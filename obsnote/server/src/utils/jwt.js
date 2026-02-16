import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const createAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email
    },
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenTtl }
  );

export const verifyAccessToken = (token) => jwt.verify(token, env.jwtAccessSecret);

export const createRawRefreshToken = () => crypto.randomBytes(48).toString("base64url");

export const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

