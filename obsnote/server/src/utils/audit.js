import { ActivityEvent } from "../models/ActivityEvent.js";

const stripSensitiveMetadata = (metadata) => {
  if (!metadata || typeof metadata !== "object") {
    return {};
  }

  const clone = { ...metadata };
  delete clone.password;
  delete clone.passwordHash;
  delete clone.temporaryPassword;
  delete clone.contentMarkdown;
  delete clone.content;
  return clone;
};

export const recordActivity = async ({
  req,
  actorUserId = null,
  actorRole = null,
  eventType,
  targetType = null,
  targetId = null,
  metadata = {}
}) => {
  try {
    await ActivityEvent.create({
      actorUserId,
      actorRole,
      eventType,
      targetType,
      targetId,
      ipAddress: req.ip,
      userAgent: req.get("user-agent") ?? null,
      metadata: stripSensitiveMetadata(metadata)
    });
  } catch (error) {
    // Avoid blocking API response if auditing fails.
    console.error("Failed to record activity", error);
  }
};

