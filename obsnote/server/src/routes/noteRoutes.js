import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, enforcePasswordReset } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { Folder } from "../models/Folder.js";
import { Note } from "../models/Note.js";
import { NoteVersion } from "../models/NoteVersion.js";
import { recordActivity } from "../utils/audit.js";
import { httpError } from "../utils/httpError.js";
import { snapshotNoteVersion } from "../utils/versioning.js";

const router = express.Router();

const createNoteSchema = z.object({
  title: z.string().min(1).max(180),
  folderId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null)),
  contentMarkdown: z.string().optional().default("")
});

const updateNoteSchema = z.object({
  title: z.string().min(1).max(180).optional(),
  folderId: z
    .string()
    .trim()
    .nullable()
    .optional(),
  contentMarkdown: z.string().optional()
});

const ensureObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const toPlaintext = (markdown = "") => markdown.replace(/[#_*`>\-\[\]\(\)!]/g, " ");

const assertFolderOwnership = async (folderId, userId) => {
  if (!folderId) {
    return null;
  }

  if (!ensureObjectId(folderId)) {
    throw httpError(400, "VALIDATION_ERROR", "Invalid folder id");
  }

  const folder = await Folder.findOne({ _id: folderId, ownerId: userId });
  if (!folder) {
    throw httpError(404, "FOLDER_NOT_FOUND", "Folder not found");
  }
  return folder;
};

router.use(requireAuth, enforcePasswordReset);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const query = { ownerId: req.user._id };
    const folderId = req.query.folderId?.toString();
    if (folderId) {
      if (!ensureObjectId(folderId)) {
        throw httpError(400, "VALIDATION_ERROR", "Invalid folder id");
      }
      query.folderId = folderId;
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    res.json({ notes });
  })
);

router.post(
  "/",
  validateBody(createNoteSchema),
  asyncHandler(async (req, res) => {
    await assertFolderOwnership(req.body.folderId, req.user._id);

    const note = await Note.create({
      ownerId: req.user._id,
      folderId: req.body.folderId,
      title: req.body.title,
      contentMarkdown: req.body.contentMarkdown,
      contentPlaintext: toPlaintext(req.body.contentMarkdown)
    });

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "note.create",
      targetType: "note",
      targetId: note._id.toString()
    });

    res.status(201).json({ note });
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid note id");
    }

    const note = await Note.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!note) {
      throw httpError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    res.json({ note });
  })
);

router.patch(
  "/:id",
  validateBody(updateNoteSchema),
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid note id");
    }

    const note = await Note.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!note) {
      throw httpError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    if (req.body.folderId !== undefined) {
      if (req.body.folderId === null || req.body.folderId === "") {
        note.folderId = null;
      } else {
        await assertFolderOwnership(req.body.folderId, req.user._id);
        note.folderId = req.body.folderId;
      }
    }

    if (req.body.title !== undefined) {
      note.title = req.body.title;
    }

    if (req.body.contentMarkdown !== undefined && req.body.contentMarkdown !== note.contentMarkdown) {
      await snapshotNoteVersion({ note, reason: "autosave" });
      note.contentMarkdown = req.body.contentMarkdown;
      note.contentPlaintext = toPlaintext(req.body.contentMarkdown);
    }

    await note.save();

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "note.update",
      targetType: "note",
      targetId: note._id.toString(),
      metadata: {
        updatedFields: Object.keys(req.body)
      }
    });

    res.json({ note });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid note id");
    }

    const note = await Note.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!note) {
      throw httpError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    await note.deleteOne();
    await NoteVersion.deleteMany({ noteId: note._id, ownerId: req.user._id });

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "note.delete",
      targetType: "note",
      targetId: note._id.toString()
    });

    res.status(204).send();
  })
);

router.get(
  "/:id/versions",
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid note id");
    }

    const note = await Note.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!note) {
      throw httpError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    const versions = await NoteVersion.find({
      noteId: note._id,
      ownerId: req.user._id
    })
      .sort({ createdAt: -1 })
      .limit(10);

    res.json({ versions });
  })
);

router.post(
  "/:id/restore/:versionId",
  asyncHandler(async (req, res) => {
    const { id, versionId } = req.params;
    if (!ensureObjectId(id) || !ensureObjectId(versionId)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid note/version id");
    }

    const note = await Note.findOne({ _id: id, ownerId: req.user._id });
    if (!note) {
      throw httpError(404, "NOTE_NOT_FOUND", "Note not found");
    }

    const version = await NoteVersion.findOne({
      _id: versionId,
      noteId: note._id,
      ownerId: req.user._id
    });

    if (!version) {
      throw httpError(404, "VERSION_NOT_FOUND", "Version not found");
    }

    await snapshotNoteVersion({ note, reason: "manual_restore" });
    note.contentMarkdown = version.contentMarkdown;
    note.contentPlaintext = toPlaintext(version.contentMarkdown);
    await note.save();

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "note.restore",
      targetType: "note",
      targetId: note._id.toString(),
      metadata: { versionId }
    });

    res.json({ note });
  })
);

export default router;

