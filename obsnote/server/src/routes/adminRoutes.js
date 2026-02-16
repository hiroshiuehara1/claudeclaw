import express from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { requireAuth, requireRole, enforcePasswordReset } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { adminLimiter } from "../middleware/rateLimiters.js";
import { validateBody } from "../middleware/validate.js";
import { ActivityEvent } from "../models/ActivityEvent.js";
import { User } from "../models/User.js";
import { recordActivity } from "../utils/audit.js";
import { httpError } from "../utils/httpError.js";
import { hashPassword } from "../utils/password.js";
import { generateTempPassword } from "../utils/tempPassword.js";

const router = express.Router();

const createUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["user", "admin"]).optional().default("user")
});

const updateStatusSchema = z.object({
  status: z.enum(["active", "disabled"])
});

const ensureObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

router.use(requireAuth, enforcePasswordReset, requireRole("admin"), adminLimiter);

router.post(
  "/users",
  validateBody(createUserSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const existing = await User.findOne({ email });
    if (existing) {
      throw httpError(409, "EMAIL_TAKEN", "An account with this email already exists");
    }

    const temporaryPassword = generateTempPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const createdUser = await User.create({
      email,
      passwordHash,
      role: req.body.role,
      status: "active",
      mustChangePassword: true
    });

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "user.create",
      targetType: "user",
      targetId: createdUser._id.toString(),
      metadata: {
        createdRole: createdUser.role,
        createdEmail: createdUser.email
      }
    });

    res.status(201).json({
      user: createdUser.toSafeJSON(),
      temporaryPassword
    });
  })
);

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const users = await User.find({})
      .select("email role status mustChangePassword createdAt updatedAt lastLoginAt")
      .sort({ createdAt: -1 })
      .lean();

    const activityCounts = await ActivityEvent.aggregate([
      {
        $match: {
          actorUserId: { $ne: null }
        }
      },
      {
        $group: {
          _id: "$actorUserId",
          count: { $sum: 1 }
        }
      }
    ]);

    const countMap = new Map(activityCounts.map((entry) => [String(entry._id), entry.count]));
    const usersWithCounts = users.map((user) => ({
      ...user,
      activityCount: countMap.get(String(user._id)) ?? 0
    }));

    res.json({ users: usersWithCounts });
  })
);

router.patch(
  "/users/:id/status",
  validateBody(updateStatusSchema),
  asyncHandler(async (req, res) => {
    if (!ensureObjectId(req.params.id)) {
      throw httpError(400, "VALIDATION_ERROR", "Invalid user id");
    }

    if (String(req.user._id) === req.params.id && req.body.status === "disabled") {
      throw httpError(400, "VALIDATION_ERROR", "Admin cannot disable their own account");
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw httpError(404, "USER_NOT_FOUND", "User not found");
    }

    user.status = req.body.status;
    await user.save();

    await recordActivity({
      req,
      actorUserId: req.user._id,
      actorRole: req.user.role,
      eventType: "user.status.update",
      targetType: "user",
      targetId: user._id.toString(),
      metadata: { status: req.body.status }
    });

    res.json({ user: user.toSafeJSON() });
  })
);

router.get(
  "/activity",
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page ?? 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.eventType) {
      filter.eventType = req.query.eventType.toString();
    }
    if (req.query.userId && ensureObjectId(req.query.userId.toString())) {
      filter.actorUserId = new mongoose.Types.ObjectId(req.query.userId.toString());
    }
    if (req.query.from || req.query.to) {
      filter.createdAt = {};
      if (req.query.from) {
        filter.createdAt.$gte = new Date(req.query.from.toString());
      }
      if (req.query.to) {
        filter.createdAt.$lte = new Date(req.query.to.toString());
      }
    }

    const [events, total] = await Promise.all([
      ActivityEvent.find(filter)
        .populate("actorUserId", "email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ActivityEvent.countDocuments(filter)
    ]);

    res.json({
      events,
      page,
      limit,
      total
    });
  })
);

router.get(
  "/activity/summary",
  asyncHandler(async (req, res) => {
    const match = {};
    if (req.query.from || req.query.to) {
      match.createdAt = {};
      if (req.query.from) {
        match.createdAt.$gte = new Date(req.query.from.toString());
      }
      if (req.query.to) {
        match.createdAt.$lte = new Date(req.query.to.toString());
      }
    }

    const byType = await ActivityEvent.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$eventType",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const counts = Object.fromEntries(byType.map((entry) => [entry._id, entry.count]));

    res.json({
      counts,
      metrics: {
        loginSuccess: counts["auth.login.success"] ?? 0,
        loginFailed: counts["auth.login.failed"] ?? 0,
        notesCreated: counts["note.create"] ?? 0,
        notesUpdated: counts["note.update"] ?? 0,
        notesDeleted: counts["note.delete"] ?? 0
      }
    });
  })
);

export default router;

