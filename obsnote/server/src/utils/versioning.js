import { NoteVersion } from "../models/NoteVersion.js";

const VERSION_LIMIT = 10;

export const snapshotNoteVersion = async ({ note, reason = "autosave" }) => {
  await NoteVersion.create({
    noteId: note._id,
    ownerId: note.ownerId,
    contentMarkdown: note.contentMarkdown,
    reason
  });

  const overflow = await NoteVersion.find({ noteId: note._id })
    .sort({ createdAt: -1 })
    .skip(VERSION_LIMIT)
    .select("_id")
    .lean();

  if (overflow.length > 0) {
    await NoteVersion.deleteMany({
      _id: {
        $in: overflow.map((version) => version._id)
      }
    });
  }
};

