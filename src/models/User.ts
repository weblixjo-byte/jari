import mongoose, { Schema, Document } from "mongoose";
import { IUser } from "@/lib/types";

export interface UserDocument extends Omit<IUser, "_id">, Document {}

const UserSchema = new Schema<UserDocument>(
  {
    role: {
      type: String,
      enum: ["customer", "cashier", "super_admin"],
      required: true,
      default: "customer",
    },
    name: { type: String, required: true },
    phone: { type: String, sparse: true, index: true },
    pin: { type: String, sparse: true, index: true }, // 6-digit customer lookup PIN
    qrSecret: { type: String, sparse: true },
    pointsBalance: { type: Number, default: 0 },
    lifetimePoints: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ["Member", "Silver", "Gold"],
      default: "Member",
    },
    // Staff / Cashier / Admin fields
    username: { type: String, sparse: true, index: true },
    branchName: { type: String, default: "Downtown Flagship" },
    staffPin: { type: String }, // e.g. 4-digit PIN for fast cashier POS login
    passwordHash: { type: String },
    isActive: { type: Boolean, default: true },
    email: { type: String, sparse: true, index: true },
    googleId: { type: String, sparse: true, index: true },
    avatarUrl: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.User ||
  mongoose.model<UserDocument>("User", UserSchema);
