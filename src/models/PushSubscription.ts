import mongoose, { Schema, Document } from "mongoose";
import { IPushSubscription } from "@/lib/types";

export interface PushSubscriptionDocument extends Omit<IPushSubscription, "_id">, Document {}

const PushSubscriptionSchema = new Schema<PushSubscriptionDocument>(
  {
    userId: { type: String, required: true, index: true },
    endpoint: { type: String, required: true, unique: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.PushSubscription ||
  mongoose.model<PushSubscriptionDocument>("PushSubscription", PushSubscriptionSchema);
