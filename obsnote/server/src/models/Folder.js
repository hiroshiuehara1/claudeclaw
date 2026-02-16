import mongoose from "mongoose";

const folderSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    parentFolderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Folder",
      default: null
    },
    pathCache: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

folderSchema.index({ ownerId: 1, parentFolderId: 1, name: 1 }, { unique: true });

export const Folder = mongoose.model("Folder", folderSchema);

