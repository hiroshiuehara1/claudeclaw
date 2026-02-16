import mongoose from "mongoose";

const activityEventSchema = new mongoose.Schema(
  {
    actorUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true
    },
    actorRole: {
      type: String,
      enum: ["admin", "user", null],
      default: null
    },
    eventType: {
      type: String,
      required: true,
      index: true
    },
    targetType: {
      type: String,
      default: null
    },
    targetId: {
      type: String,
      default: null
    },
    ipAddress: {
      type: String,
      default: null
    },
    userAgent: {
      type: String,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false
    }
  }
);

activityEventSchema.index({ createdAt: -1 });

export const ActivityEvent = mongoose.model("ActivityEvent", activityEventSchema);

