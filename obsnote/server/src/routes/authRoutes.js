import express from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { authLimiter } from "../middleware/rateLimiters.js";
import { validateBody } from "../middleware/validate.js";
import { User } from "../models/User.js";
import { recordActivity } from "../utils/audit.js";
import { httpError } from "../utils/httpError.js";
import { createAccessToken } from "../utils/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import {
  refreshCookieName,
  refreshCookieClearOptions,
  refreshCookieOptions,
  revokeRefreshToken,
  rotateRefreshToken,
  persistRefreshToken
} from "../utils/session.js";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const forceResetSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(10)
});

const router = express.Router();

router.post(
  "/login",
  authLimiter,
  validateBody(loginSchema),
  asyncHandler(async (req, res) => {
    const email = req.body.email.toLowerCase();
    const user = await User.findOne({ email });

    if (!user) {
      await recordActivity({
        req,
        eventType: "auth.login.failed",
        targetType: "auth",
        metadata: { email, reason: "user_not_found" }
      });
      throw httpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    if (user.status !== "active") {
      await recordActivity({
        req,
        actorUserId: user._id,
        actorRole: user.role,
        eventType: "auth.login.failed",
        targetType: "user",
        targetId: user._id.toString(),
        metadata: { reason: "account_disabled" }
      });
      throw httpError(403, "ACCOUNT_DISABLED", "Account is disabled");
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      await recordActivity({
        req,
        actorUserId: user._id,
        actorRole: user.role,
        eventType: "auth.login.failed",
        targetType: "user",
        targetId: user._id.toString(),
        metadata: { reason: "account_locked" }
      });
      throw httpError(423, "ACCOUNT_LOCKED", "Account is temporarily locked");
    }

    const passwordOk = await verifyPassword(req.body.password, user.passwordHash);

    if (!passwordOk) {
      user.failedLoginCount += 1;
      if (user.failedLoginCount >= env.maxFailedLogins) {
        user.lockUntil = new Date(Date.now() + env.accountLockMinutes * 60 * 1000);
      }
      await user.save();

      await recordActivity({
        req,
        actorUserId: user._id,
        actorRole: user.role,
        eventType: "auth.login.failed",
        targetType: "user",
        targetId: user._id.toString(),
        metadata: { reason: "invalid_password", failedLoginCount: user.failedLoginCount }
      });
      throw httpError(401, "INVALID_CREDENTIALS", "Invalid email or password");
    }

    user.failedLoginCount = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = createAccessToken(user);
    const rawRefreshToken = await persistRefreshToken({
      userId: user._id,
      ip: req.ip,
      userAgent: req.get("user-agent")
    });

    res.cookie(refreshCookieName, rawRefreshToken, refreshCookieOptions);

    await recordActivity({
      req,
      actorUserId: user._id,
      actorRole: user.role,
      eventType: "auth.login.success",
      targetType: "user",
      targetId: user._id.toString()
    });

    res.json({
      accessToken,
      user: user.toSafeJSON()
    });
  })
);

router.post(
  "/refresh",
  authLimiter,
  asyncHandler(async (req, res) => {
    const rawRefreshToken = req.cookies?.[refreshCookieName];
    if (!rawRefreshToken) {
      throw httpError(401, "UNAUTHORIZED", "Missing refresh token");
    }

    const rotated = await rotateRefreshToken({
      rawToken: rawRefreshToken,
      ip: req.ip,
      userAgent: req.get("user-agent")
    });

    if (!rotated || !rotated.user || rotated.user.status !== "active") {
      res.clearCookie(refreshCookieName, refreshCookieClearOptions);
      throw httpError(401, "UNAUTHORIZED", "Invalid refresh session");
    }

    const accessToken = createAccessToken(rotated.user);
    res.cookie(refreshCookieName, rotated.rawToken, refreshCookieOptions);

    res.json({
      accessToken,
      user: rotated.user.toSafeJSON()
    });
  })
);

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const rawRefreshToken = req.cookies?.[refreshCookieName];
    await revokeRefreshToken(rawRefreshToken);
    res.clearCookie(refreshCookieName, refreshCookieClearOptions);
    res.status(204).send();
  })
);

router.post(
  "/force-reset-password",
  requireAuth,
  validateBody(forceResetSchema),
  asyncHandler(async (req, res) => {
    const user = req.user;
    const currentPasswordOk = await verifyPassword(req.body.currentPassword, user.passwordHash);

    if (!currentPasswordOk) {
      throw httpError(401, "INVALID_CREDENTIALS", "Current password is incorrect");
    }

    user.passwordHash = await hashPassword(req.body.newPassword);
    user.mustChangePassword = false;
    user.failedLoginCount = 0;
    user.lockUntil = null;
    await user.save();

    await recordActivity({
      req,
      actorUserId: user._id,
      actorRole: user.role,
      eventType: "auth.password.force_reset",
      targetType: "user",
      targetId: user._id.toString()
    });

    res.json({
      user: user.toSafeJSON()
    });
  })
);

export default router;
