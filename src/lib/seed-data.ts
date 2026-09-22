import bcrypt from "bcryptjs";
import { ITenantConfig, IUser, ITransaction, IReward, INotification } from "./types";

export function seedInitialData() {
  const adminPasswordHash = bcrypt.hashSync("jari@2026", 10);

  const config: ITenantConfig = {
    _id: "config_jari_default",
    storeName: "jari",
    tagline: "Coffee House & Pastry",
    logoUrl: "/logo.png",
    primaryColor: "#0A52A9",
    accentColor: "#F4EECF",
    terracottaColor: "#0A52A9",
    currency: "JOD",
    pointsPerUnit: 10,
    discountPer100Pts: 1.0,
    welcomeBonusPts: 50,
    updatedAt: new Date().toISOString(),
  };

  const users: IUser[] = [
    // Super Admin
    {
      _id: "admin_01",
      role: "super_admin",
      name: "jari",
      username: "jari",
      email: "admin@jari.com",
      passwordHash: adminPasswordHash,
      pointsBalance: 0,
      lifetimePoints: 0,
      tier: "Gold",
      createdAt: new Date().toISOString(),
    },
    // Cashier
    {
      _id: "cashier_admin",
      role: "cashier",
      name: "Cashier",
      username: "admin",
      staffPin: "2026",
      branchName: "Main Branch",
      isActive: true,
      pointsBalance: 0,
      lifetimePoints: 0,
      tier: "Member",
      createdAt: new Date().toISOString(),
    },
  ];

  const transactions: ITransaction[] = [];

  const rewards: IReward[] = [];

  const notifications: INotification[] = [];

  return { config, users, transactions, rewards, notifications };
}
