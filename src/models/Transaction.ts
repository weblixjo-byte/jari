import mongoose, { Schema, Document } from "mongoose";
import { ITransaction } from "@/lib/types";

export interface TransactionDocument extends Omit<ITransaction, "_id">, Document {}

const TransactionSchema = new Schema<TransactionDocument>(
  {
    type: {
      type: String,
      enum: ["EARN", "REDEEM", "ADJUST"],
      required: true,
    },
    customerId: { type: String, required: true, index: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String },
    cashierId: { type: String },
    cashierName: { type: String },
    branchName: { type: String },
    billAmount: { type: Number },
    points: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    rewardTitle: { type: String },
    referenceCode: { type: String, required: true, unique: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.models.Transaction ||
  mongoose.model<TransactionDocument>("Transaction", TransactionSchema);
