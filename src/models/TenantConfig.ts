import mongoose, { Schema, Document } from "mongoose";
import { ITenantConfig } from "@/lib/types";

export interface TenantConfigDocument extends Omit<ITenantConfig, "_id">, Document {}

const TenantConfigSchema = new Schema<TenantConfigDocument>(
  {
    storeName: { type: String, required: true, default: "jari" },
    tagline: { type: String, default: "Coffee House & Pastry" },
    logoUrl: { type: String, default: "/logo.png" },
    primaryColor: { type: String, default: "#0A52A9" },
    accentColor: { type: String, default: "#F4EECF" },
    terracottaColor: { type: String, default: "#0A52A9" },
    currency: { type: String, default: "JOD" },
    pointsPerUnit: { type: Number, default: 10 },
    discountPer100Pts: { type: Number, default: 1.00 },
    welcomeBonusPts: { type: Number, default: 50 },
  },
  { timestamps: true }
);

export default mongoose.models.TenantConfig ||
  mongoose.model<TenantConfigDocument>("TenantConfig", TenantConfigSchema);
