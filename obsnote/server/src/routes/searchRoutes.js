import express from "express";
import { requireAuth, enforcePasswordReset } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Note } from "../models/Note.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  enforcePasswordReset,
  asyncHandler(async (req, res) => {
    const q = (req.query.q ?? "").toString().trim();
    if (!q) {
      res.json({ notes: [] });
      return;
    }

    let notes = [];
    try {
      notes = await Note.find(
        {
          ownerId: req.user._id,
          $text: { $search: q }
        },
        {
          score: { $meta: "textScore" }
        }
      )
        .sort({ score: { $meta: "textScore" }, updatedAt: -1 })
        .limit(30);
    } catch (error) {
      const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      notes = await Note.find({
        ownerId: req.user._id,
        $or: [
          { title: { $regex: escaped, $options: "i" } },
          { contentPlaintext: { $regex: escaped, $options: "i" } }
        ]
      })
        .sort({ updatedAt: -1 })
        .limit(30);
    }

    res.json({ notes });
  })
);

export default router;

