import mongoose, { Schema, Document } from "mongoose";
import { INotification } from "@/lib/types";

export interface NotificationDocument extends Omit<INotification, "_id">, Document {}

const NotificationSchema = new Schema<NotificationDocument>(
  {
    customerId: { type: String, required: true, index: true }, // "all" for broadcast
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["POINTS_EARNED", "REWARD_CLAIMED", "BROADCAST", "SYSTEM"],
      default: "SYSTEM",
    },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Notification ||
  mongoose.model<NotificationDocument>("Notification", NotificationSchema);
