import mongoose from "mongoose";

const noteVersionSchema = new mongoose.Schema(
  {
    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Note",
      required: true,
      index: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    contentMarkdown: {
      type: String,
      default: ""
    },
    reason: {
      type: String,
      enum: ["autosave", "manual_restore"],
      default: "autosave"
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

noteVersionSchema.index({ noteId: 1, createdAt: -1 });

export const NoteVersion = mongoose.model("NoteVersion", noteVersionSchema);

