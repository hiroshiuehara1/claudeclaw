import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, enforcePasswordReset } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { Folder } from "../models/Folder.js";
import { Note } from "../models/Note.js";
import { recordActivity } from "../utils/audit.js";
import { httpError } from "../utils/httpError.js";

const router = express.Router();

const createFolderSchema = z.object({
  name: z.string().min(1).max(120),
  parentFolderId: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : null))
});

const updateFolderSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  parentFolderId: z
    .string()
    .trim()
    .nullable()
    .optional()
});

const ensureObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const computePathCache = (folderName, parentPath = "") =>
  `${parentPath}${parentPath ? "/" : ""}${folderName.toLowerCase()}`;

router.use(requireAuth, enforcePasswordReset);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const folders = await Folder.find({ ownerId: req.user._id }).sort({ pathCache: 1, name: 1 });
    res.json({ folders });
  })
);

router.post(
  "/",
  validateBody(createFolderSchema),
  asyncHandler(async (req, res) => {
    let parent = null;
    if (req.body.parentFolderId) {
      if (!ensureObjectId(req.body.parentFolderId)) {
        throw httpError(400, "VALIDATION_ERROR", "Invalid parent folder id");
      }

      parent = await Folder.findOne({
        _id: req.body.parentFolderId,
        ownerId: req.user._id
      });

      if (!parent) {
        throw httpError(404, "FOLDER_NOT_FOUND", "Parent folder not found");
      }
    }

    const folder = await Folder.create({
      ownerId: req.user._id,
      name: req.body.name,
      parentFolderId: parent ? parent._id : null,
      pathCache: computePathCache(req.body.name, parent?.pathCache ?? "")
    });

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "folder.create",
      targetType: "folder",
      targetId: folder._id.toString()
    });

    res.status(201).json({ folder });
  })
);

router.patch(
  "/:id",
  validateBody(updateFolderSchema),
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid folder id");
    }

    const folder = await Folder.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!folder) {
      throw httpError(404, "FOLDER_NOT_FOUND", "Folder not found");
    }

    let parent = null;
    if (req.body.parentFolderId !== undefined) {
      if (req.body.parentFolderId === null || req.body.parentFolderId === "") {
        folder.parentFolderId = null;
      } else {
        if (!ensureObjectId(req.body.parentFolderId)) {
          throw httpError(400, "VALIDATION_ERROR", "Invalid parent folder id");
        }

        if (req.body.parentFolderId === req.params.id) {
          throw httpError(400, "VALIDATION_ERROR", "Folder cannot be parent of itself");
        }

        parent = await Folder.findOne({
          _id: req.body.parentFolderId,
          ownerId: req.user._id
        });

        if (!parent) {
          throw httpError(404, "FOLDER_NOT_FOUND", "Parent folder not found");
        }

        folder.parentFolderId = parent._id;
      }
    } else if (folder.parentFolderId) {
      parent = await Folder.findOne({ _id: folder.parentFolderId, ownerId: req.user._id });
    }

    if (req.body.name) {
      folder.name = req.body.name;
    }

    folder.pathCache = computePathCache(folder.name, parent?.pathCache ?? "");
    await folder.save();

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "folder.update",
      targetType: "folder",
      targetId: folder._id.toString()
    });

    res.json({ folder });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid folder id");
    }

    const folder = await Folder.findOne({ _id: req.params.id, ownerId: req.user._id });
    if (!folder) {
      throw httpError(404, "FOLDER_NOT_FOUND", "Folder not found");
    }

    const [childCount, noteCount] = await Promise.all([
      Folder.countDocuments({ ownerId: req.user._id, parentFolderId: folder._id }),
      Note.countDocuments({ ownerId: req.user._id, folderId: folder._id })
    ]);

    if (childCount > 0 || noteCount > 0) {
      throw httpError(
        409,
        "FOLDER_NOT_EMPTY",
        "Cannot delete a folder that still contains folders or notes"
      );
    }

    await folder.deleteOne();

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "folder.delete",
      targetType: "folder",
      targetId: folder._id.toString()
    });

    res.status(204).send();
  })
);

export default router;

