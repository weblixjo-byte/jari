export type UserRole = "customer" | "cashier" | "super_admin";

export type CustomerTier = "Member" | "Silver" | "Gold";

export interface ITenantConfig {
  _id?: string;
  storeName: string;
  tagline: string;
  logoUrl?: string;
  primaryColor: string; // e.g. #2C221E
  accentColor: string;  // e.g. #1A5336
  terracottaColor?: string; // e.g. #C87D55
  currency: string;      // e.g. KWD, USD, SAR
  pointsPerUnit: number; // e.g. 10 points per 1.00 currency
  discountPer100Pts: number; // e.g. 1.00 currency discount per 100 points
  welcomeBonusPts: number;   // e.g. 50 points on signup
  updatedAt?: Date | string;
}

export interface IUser {
  _id: string;
  role: UserRole;
  name: string;
  phone?: string;
  pin?: string;             // 6-digit PIN e.g. "482910"
  qrSecret?: string;        // Dynamic QR token payload
  pointsBalance: number;
  lifetimePoints: number;
  tier: CustomerTier;
  // Staff fields
  username?: string;
  branchName?: string;
  passwordHash?: string;
  staffPin?: string;
  isActive?: boolean;
  email?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: string | Date;
}

export type TransactionType = "EARN" | "REDEEM" | "ADJUST";

export interface ITransaction {
  _id: string;
  type: TransactionType;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  cashierId?: string;
  cashierName?: string;
  branchName?: string;
  billAmount?: number;
  points: number; // positive for EARN, negative for REDEEM
  balanceAfter: number;
  rewardTitle?: string;
  referenceCode: string; // e.g. "TX-892147"
  notes?: string;
  createdAt: string | Date;
}

export type RewardCategory = "Drinks" | "Food" | "Beans" | "Merchandise" | "Special";

export interface IReward {
  _id: string;
  title: string;
  description: string;
  pointsRequired: number;
  category: RewardCategory;
  imageUrl?: string;
  isActive: boolean;
  stock?: number;
  redemptionCount?: number;
  createdAt: string | Date;
}

export type NotificationType = "POINTS_EARNED" | "REWARD_CLAIMED" | "BROADCAST" | "SYSTEM";

export interface INotification {
  _id: string;
  customerId: string; // "all" for broadcasts
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string | Date;
}

export interface AuthSession {
  userId: string;
  role: UserRole;
  name: string;
  phone?: string;
  username?: string;
  branchName?: string;
  tier?: CustomerTier;
  email?: string;
  avatarUrl?: string;
  googleId?: string;
}

export interface IPushSubscription {
  _id?: string;
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  userAgent?: string;
  createdAt?: string | Date;
}
