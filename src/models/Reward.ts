import mongoose, { Schema, Document } from "mongoose";
import { IReward } from "@/lib/types";

export interface RewardDocument extends Omit<IReward, "_id">, Document {}

const RewardSchema = new Schema<RewardDocument>(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    pointsRequired: { type: Number, required: true },
    category: {
      type: String,
      default: "Drinks",
    },
    imageUrl: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    stock: { type: Number, default: 999 },
    redemptionCount: { type: Number, default: 0 },
    claimCode: { type: String, default: "" },
  },
  { timestamps: true }
);

// Clear model cache in dev/reload to ensure updated schema is applied
if (mongoose.models && mongoose.models.Reward) {
  delete mongoose.models.Reward;
}

export default mongoose.model<RewardDocument>("Reward", RewardSchema);
