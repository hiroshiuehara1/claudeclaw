import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    folderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    contentMarkdown: {
      type: String,
      default: ""
    },
    contentPlaintext: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

noteSchema.index({ ownerId: 1, updatedAt: -1 });
noteSchema.index({ title: "text", contentPlaintext: "text" });

export const Note = mongoose.model("Note", noteSchema);

