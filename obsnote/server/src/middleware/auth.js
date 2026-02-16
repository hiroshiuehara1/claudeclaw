import { verifyAccessToken } from "../utils/jwt.js";
import { User } from "../models/User.js";

const makeError = (statusCode, code, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
};

export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization ?? "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      throw makeError(401, "UNAUTHORIZED", "Missing or invalid access token");
    }

    const payload = verifyAccessToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      throw makeError(401, "UNAUTHORIZED", "Invalid user");
    }

    if (user.status !== "active") {
      throw makeError(403, "ACCOUNT_DISABLED", "Account is disabled");
    }

    req.user = user;
    next();
  } catch (error) {
    if (!error.statusCode) {
      next(makeError(401, "UNAUTHORIZED", "Invalid or expired access token"));
      return;
    }

    next(error);
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      next(makeError(401, "UNAUTHORIZED", "Missing authenticated user"));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(makeError(403, "FORBIDDEN", "Insufficient permissions"));
      return;
    }

    next();
  };

export const enforcePasswordReset = (req, res, next) => {
  if (req.user?.mustChangePassword) {
    next(makeError(403, "PASSWORD_RESET_REQUIRED", "Password reset required before continuing"));
    return;
  }

  next();
};

