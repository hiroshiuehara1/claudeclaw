import { env } from "../config/env.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { createRawRefreshToken, hashToken } from "./jwt.js";

export const refreshCookieName = "obsnote_refresh";

const refreshCookieMaxAgeMs = env.refreshTokenTtlDays * 24 * 60 * 60 * 1000;

export const refreshCookieOptions = {
  httpOnly: true,
  secure: env.secureCookies,
  sameSite: "strict",
  path: "/api/auth",
  maxAge: refreshCookieMaxAgeMs
};

export const refreshCookieClearOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  secure: refreshCookieOptions.secure,
  sameSite: refreshCookieOptions.sameSite,
  path: refreshCookieOptions.path
};

export const persistRefreshToken = async ({ userId, ip, userAgent }) => {
  const rawToken = createRawRefreshToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + refreshCookieMaxAgeMs);

  await RefreshToken.create({
    userId,
    tokenHash,
    expiresAt,
    createdByIp: ip ?? null,
    userAgent: userAgent ?? null
  });

  return rawToken;
};

export const revokeRefreshToken = async (rawToken) => {
  if (!rawToken) {
    return;
  }

  const tokenHash = hashToken(rawToken);
  await RefreshToken.findOneAndUpdate(
    { tokenHash, revokedAt: null },
    {
      revokedAt: new Date()
    }
  );
};

export const rotateRefreshToken = async ({ rawToken, ip, userAgent }) => {
  const tokenHash = hashToken(rawToken);
  const session = await RefreshToken.findOne({ tokenHash, revokedAt: null }).populate("userId");

  if (!session || session.expiresAt <= new Date()) {
    return null;
  }

  session.revokedAt = new Date();
  await session.save();

  const nextRawToken = await persistRefreshToken({
    userId: session.userId._id,
    ip,
    userAgent
  });

  return {
    user: session.userId,
    rawToken: nextRawToken
  };
};
