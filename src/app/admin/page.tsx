"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBrand } from "@/components/BrandProvider";
import {
  LayoutDashboard,
  Gift,
  Users,
  User,
  Send,
  Coffee,
  TrendingUp,
  Award,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ShieldCheck,
  RefreshCw,
  X,
  Search,
  Upload,
  Camera,
  Smartphone,
} from "lucide-react";
import { IReward, IUser, ITransaction } from "@/lib/types";
import CustomGlassSelect from "@/components/CustomGlassSelect";

// Bilingual Dictionary for Admin Console
const i18n = {
  en: {
    langToggle: "English",
    superAdmin: "Super Admin",
    portalSubtitle: "Executive Portal",
    adminEmail: "Administrator Username",
    password: "Password",
    signIn: "Sign In to Admin",
    authenticating: "Authenticating...",
    defaultCredentials: "Administrator Credentials:",
    openCashier: "Cashier POS Terminal",
    openCustomer: "Customer Pass",
    returnHome: "Open Cashier Terminal",
    navAnalytics: "Analytics & KPIs",
    navCustomers: "Customers",
    navRewards: "Rewards Catalogue",
    navCashiers: "POS Cashiers",
    navBroadcast: "Notifications",
    signOut: "Sign Out",
    home: "Cashier POS",
    analyticsTitle: "Executive Analytics & Metrics",
    analyticsSubtitle: "Real-time overview of loyalty performance, member points, and rewards activity.",
    refreshData: "Refresh Data",
    cardRevenue: "Total Revenue Volume",
    cardRevenueSub: (txs: number) => `From ${txs} total transactions`,
    cardIssued: "Points Issued",
    cardIssuedSub: "Credited for store purchases",
    cardRedeemed: "Points Redeemed",
    cardRedeemedSub: "Claimed for rewards & perks",
    cardMembers: "Active Members",
    cardMembersSub: "Registered loyalty customers",
    topCustomers: "Top Loyal Members",
    byLifetime: "Ranked by Lifetime Points",
    liveActivity: "Recent Activity Log",
    auditTrail: "Financial & Loyalty Audit",
    noTransactions: "No recorded transactions yet.",
    pts: "pts",
    bal: "Bal",
    customersTitle: "Customer Directory",
    customersSubtitle: "Complete overview of all registered members, points balances, and quick actions.",
    searchPlaceholder: "Search by name, phone, or email...",
    totalCustomers: "Total Registered Members",
    totalPointsHeld: "Points in Circulation",
    tblCustomer: "Member",
    tblPhoneEmail: "Contact",
    tblTier: "Tier",
    tblBalance: "Current Balance",
    tblLifetime: "Lifetime Points",
    tblJoined: "Joined Date",
    tblSendNotif: "Send Notice",
    rewardsTitle: "Rewards Catalogue",
    rewardsSubtitle: "Manage redeemable items, images, and point costs.",
    addReward: "Add New Reward",
    tblRewardTitle: "Reward Title",
    tblCategory: "Category",
    tblPointsCost: "Points Cost",
    tblRedemptions: "Redemptions",
    tblStatus: "Status",
    tblActions: "Actions",
    active: "Active",
    disabled: "Disabled",
    addRewardModalTitle: "Add New Reward",
    titleLabel: "Reward Title",
    descriptionLabel: "Description",
    rewardImage: "Image URL",
    rewardImageHelp: "Paste an image URL or choose a preset below",
    presets: "Quick Presets:",
    cancel: "Cancel",
    createReward: "Save Reward",
    deleteConfirm: "Are you sure you want to remove this reward?",
    cashiersTitle: "Cashier Accounts & POS Terminals",
    cashiersSubtitle: "Manage authorized staff and POS access PINs.",
    addCashier: "Add Cashier",
    tblStaffMember: "Staff Name",
    tblUsername: "Username",
    tblBranch: "Branch",
    tblPin: "PIN",
    authorized: "Active",
    suspended: "Suspended",
    deactivate: "Deactivate",
    reactivate: "Activate",
    addCashierModalTitle: "Create Cashier Account",
    fullName: "Full Name",
    usernameForPOS: "Username",
    createAccount: "Create Account",
    broadcastTitle: "Customer Broadcast & Notification Center",
    broadcastSubtitle: "Dispatch in-app notifications and promotional loyalty points boosts.",
    announcementTitle: "Announcement Title",
    notificationMessage: "Notification Message",
    optionalBonus: "Optional Bonus Points Gift",
    bonusHelp: "Set to 0 for a standard notification without a points grant.",
    audienceLabel: "Target Audience",
    audienceAll: "All Members",
    audienceSingle: "Specific Member",
    selectCustomer: "Select Customer",
    noCustomersFound: "No registered customers found",
    sendBroadcast: "Send Broadcast to All Members",
    sendToSingle: "Send to Specific Member",
    sendingBroadcast: "Dispatching Notification...",
    broadcastSuccessMsg: (bonusCount?: number, bonus?: string, recipientName?: string, pushDevices?: number) => {
      const pushNote = pushDevices && pushDevices > 0 ? ` (Real push delivered to ${pushDevices} device${pushDevices > 1 ? "s" : ""})` : "";
      return recipientName
        ? `Notification sent to ${recipientName}! ${bonusCount ? `+${bonus} bonus points credited.` : ""}${pushNote}`
        : `Broadcast sent successfully! ${bonusCount ? `+${bonus} points credited to ${bonusCount} members.` : ""}${pushNote}`;
    },
  },
  ar: {
    langToggle: "English",
    superAdmin: "Super Admin",
    portalSubtitle: "Executive Portal",
    adminEmail: "Administrator Email",
    password: "Password",
    signIn: "Sign In to Admin",
    authenticating: "Authenticating...",
    defaultCredentials: "Administrator Credentials:",
    openCashier: "Cashier POS Terminal",
    openCustomer: "Customer Pass",
    returnHome: "Open Cashier Terminal",
    navAnalytics: "Analytics & KPIs",
    navCustomers: "Customers",
    navRewards: "Rewards Catalogue",
    navCashiers: "POS Cashiers",
    navBroadcast: "Notifications",
    signOut: "Sign Out",
    home: "Cashier POS",
    analyticsTitle: "Executive Analytics & Metrics",
    analyticsSubtitle: "Real-time overview of loyalty performance, member points, and rewards activity.",
    refreshData: "Refresh Data",
    cardRevenue: "Total Revenue Volume",
    cardRevenueSub: (txs: number) => `From ${txs} total transactions`,
    cardIssued: "Points Issued",
    cardIssuedSub: "Credited for store purchases",
    cardRedeemed: "Points Redeemed",
    cardRedeemedSub: "Claimed for rewards & perks",
    cardMembers: "Active Members",
    cardMembersSub: "Registered loyalty customers",
    topCustomers: "Top Loyal Members",
    byLifetime: "Ranked by Lifetime Points",
    liveActivity: "Recent Activity Log",
    auditTrail: "Financial & Loyalty Audit",
    noTransactions: "No recorded transactions yet.",
    pts: "pts",
    bal: "Bal",
    customersTitle: "Customer Directory",
    customersSubtitle: "Complete overview of all registered members, points balances, and quick actions.",
    searchPlaceholder: "Search by name, phone, or email...",
    totalCustomers: "Total Registered Members",
    totalPointsHeld: "Points in Circulation",
    tblCustomer: "Member",
    tblPhoneEmail: "Contact",
    tblTier: "Tier",
    tblBalance: "Current Balance",
    tblLifetime: "Lifetime Points",
    tblJoined: "Joined Date",
    tblSendNotif: "Send Notice",
    rewardsTitle: "Rewards Catalogue",
    rewardsSubtitle: "Manage redeemable items, images, and point costs.",
    addReward: "Add New Reward",
    tblRewardTitle: "Reward Title",
    tblCategory: "Category",
    tblPointsCost: "Points Cost",
    tblRedemptions: "Redemptions",
    tblStatus: "Status",
    tblActions: "Actions",
    active: "Active",
    disabled: "Disabled",
    addRewardModalTitle: "Add New Reward",
    titleLabel: "Reward Title",
    descriptionLabel: "Description",
    rewardImage: "Image URL",
    rewardImageHelp: "Paste an image URL or choose a preset below",
    presets: "Quick Presets:",
    cancel: "Cancel",
    createReward: "Save Reward",
    deleteConfirm: "Are you sure you want to remove this reward?",
    cashiersTitle: "Cashier Accounts & POS Terminals",
    cashiersSubtitle: "Manage authorized staff and POS access PINs.",
    addCashier: "Add Cashier",
    tblStaffMember: "Staff Name",
    tblUsername: "Username",
    tblBranch: "Branch",
    tblPin: "PIN",
    authorized: "Active",
    suspended: "Suspended",
    deactivate: "Deactivate",
    reactivate: "Activate",
    addCashierModalTitle: "Create Cashier Account",
    fullName: "Full Name",
    usernameForPOS: "Username",
    createAccount: "Create Account",
    broadcastTitle: "Customer Broadcast & Notification Center",
    broadcastSubtitle: "Dispatch in-app notifications and promotional loyalty points boosts.",
    announcementTitle: "Announcement Title",
    notificationMessage: "Notification Message",
    optionalBonus: "Optional Bonus Points Gift",
    bonusHelp: "Set to 0 for a standard notification without a points grant.",
    audienceLabel: "Target Audience",
    audienceAll: "All Members",
    audienceSingle: "Specific Member",
    selectCustomer: "Select Customer",
    noCustomersFound: "No registered customers found",
    sendBroadcast: "Send Broadcast to All Members",
    sendToSingle: "Send to Specific Member",
    sendingBroadcast: "Dispatching Notification...",
    broadcastSuccessMsg: (bonusCount?: number, bonus?: string, recipientName?: string, pushDevices?: number) => {
      const pushNote = pushDevices && pushDevices > 0 ? ` (Real push delivered to ${pushDevices} device${pushDevices > 1 ? "s" : ""})` : "";
      return recipientName
        ? `Notification sent to ${recipientName}! ${bonusCount ? `+${bonus} bonus points credited.` : ""}${pushNote}`
        : `Broadcast sent successfully! ${bonusCount ? `+${bonus} points credited to ${bonusCount} members.` : ""}${pushNote}`;
    },
  },
};

interface MetricsData {
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  activeCustomerCount: number;
  totalRevenueVolume: number;
  totalTransactions: number;
  cashierCount: number;
  rewardsCount: number;
  topCustomers: IUser[];
  recentTransactions: ITransaction[];
}

export default function AdminPage() {
  const { config, formatCurrency } = useBrand();

  // Language State: English by default
  const [lang, setLang] = useState<"en" | "ar">("en");

  // Authentication State
  const [admin, setAdmin] = useState<{ id: string; name: string; email: string } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Login Form State
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<"analytics" | "customers" | "rewards" | "cashiers" | "broadcast">("analytics");

  // Customer Directory State
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");

  // Analytics State
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  // Rewards State
  const [rewardsList, setRewardsList] = useState<IReward[]>([]);
  const [showAddRewardModal, setShowAddRewardModal] = useState(false);
  const [newReward, setNewReward] = useState({
    title: "",
    description: "",
    pointsRequired: 100,
    category: "Drinks",
    imageUrl: "",
    stock: 999,
  });
  const [createRewardLoading, setCreateRewardLoading] = useState(false);
  const [createRewardError, setCreateRewardError] = useState<string | null>(null);

  // Cashiers State
  const [cashiersList, setCashiersList] = useState<any[]>([]);
  const [showAddCashierModal, setShowAddCashierModal] = useState(false);
  const [newCashier, setNewCashier] = useState({
    name: "",
    username: "",
    branchName: "Downtown Flagship",
    staffPin: "",
  });

  // Customer List for Targeted Notifications
  const [customersList, setCustomersList] = useState<{ id: string; name: string; email?: string; phone?: string; pointsBalance: number; tier?: string; lifetimePoints?: number; createdAt?: string }[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Broadcast & Targeted Notification State
  const [broadcastAudience, setBroadcastAudience] = useState<"all" | "single">("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [broadcastTitle, setBroadcastTitle] = useState("");
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastBonus, setBroadcastBonus] = useState<string>("0");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [broadcastError, setBroadcastError] = useState<string | null>(null);

  // Admin PWA Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  // Admin Console is 100% English
  useEffect(() => {
    setLang("en");
    if (typeof window !== "undefined") {
      localStorage.setItem("jari_admin_lang", "en");
    }
  }, []);

  // Admin PWA Install Detection
  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      ("standalone" in window.navigator && (window.navigator as any).standalone) ||
      window.matchMedia("(display-mode: standalone)").matches;
    setIsStandaloneApp(Boolean(standalone));

    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setDeferredPrompt(null);
    } else {
      setShowInstallGuide(true);
    }
  };

  const t = i18n.en;

  // Check Admin Session
  const checkAdminSession = async () => {
    try {
      setLoadingSession(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated && data.user.role === "super_admin") {
        setAdmin(data.user);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setLoadingSession(false);
    }
  };

  // Load Analytics
  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const res = await fetch("/api/admin/analytics");
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Load Rewards
  const loadRewards = async () => {
    try {
      const res = await fetch("/api/admin/rewards");
      const data = await res.json();
      if (data.success) setRewardsList(data.rewards);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Cashiers
  const loadCashiers = async () => {
    try {
      const res = await fetch("/api/admin/cashiers");
      const data = await res.json();
      if (data.success) setCashiersList(data.cashiers);
    } catch (e) {
      console.error(e);
    }
  };

  // Load Customers for targeted broadcast
  const loadCustomers = async () => {
    try {
      setLoadingCustomers(true);
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) setCustomersList(data.customers);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  useEffect(() => {
    checkAdminSession();
  }, []);

  useEffect(() => {
    if (admin) {
      loadMetrics();
      loadRewards();
      loadCashiers();
      loadCustomers();
    }
  }, [admin]);

  // Admin Login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "super_admin",
          username: emailInput.trim(),
          email: emailInput.trim(),
          password: passwordInput,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAdmin(data.user);
      } else {
        setLoginError(data.error || "Invalid administrator credentials");
      }
    } catch (err: any) {
      setLoginError(err.message || "Network error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setAdmin(null);
  };



  // Helper for direct device image file upload & client-side compression to lightweight crisp JPEG (~40-60KB)
  const handleRewardImageUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setCreateRewardError("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    setCreateRewardError(null);
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.82);
        setNewReward((prev) => ({ ...prev, imageUrl: compressedBase64 }));
      };
      img.onerror = () => {
        setCreateRewardError("Unable to read selected image file. Please try another photo.");
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Add Reward
  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateRewardLoading(true);
    setCreateRewardError(null);
    try {
      const res = await fetch("/api/admin/rewards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReward),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowAddRewardModal(false);
        setNewReward({ title: "", description: "", pointsRequired: 100, category: "Drinks", imageUrl: "", stock: 999 });
        await loadRewards();
      } else {
        setCreateRewardError(data.error || "Failed to save reward. Please check required fields.");
      }
    } catch (e: any) {
      console.error(e);
      setCreateRewardError(e.message || "Server connection error");
    } finally {
      setCreateRewardLoading(false);
    }
  };

  // Delete Reward
  const handleDeleteReward = async (id: string) => {
    if (!confirm(t.deleteConfirm)) return;
    try {
      await fetch(`/api/admin/rewards?id=${id}`, { method: "DELETE" });
      await loadRewards();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Reward Active State
  const handleToggleReward = async (id: string, current: boolean) => {
    try {
      await fetch("/api/admin/rewards", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await loadRewards();
    } catch (e) {
      console.error(e);
    }
  };

  // Create Cashier
  const handleCreateCashier = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/cashiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCashier),
      });
      if (res.ok) {
        setShowAddCashierModal(false);
        setNewCashier({ name: "", username: "", branchName: "Downtown Flagship", staffPin: "1234" });
        await loadCashiers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle Cashier Active State
  const handleToggleCashier = async (id: string, current: boolean) => {
    try {
      await fetch("/api/admin/cashiers", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await loadCashiers();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Cashier
  const handleDeleteCashier = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete cashier "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cashiers?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await loadCashiers();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Send Broadcast / Targeted Notification
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (broadcastAudience === "single" && !selectedCustomerId) {
      setBroadcastError("Please select a target customer");
      return;
    }

    setBroadcastSending(true);
    setBroadcastSuccess(null);
    setBroadcastError(null);

    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: broadcastTitle,
          message: broadcastMessage,
          bonusPoints: parseInt(broadcastBonus) || 0,
          audience: broadcastAudience,
          targetCustomerId: broadcastAudience === "single" ? selectedCustomerId : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBroadcastSuccess(
          t.broadcastSuccessMsg(data.bonusCreditedTo, broadcastBonus, data.recipientName, data.pushDevicesSent)
        );
        setBroadcastTitle("");
        setBroadcastMessage("");
        setBroadcastBonus("0");
        await loadMetrics();
        await loadCustomers();
      } else {
        setBroadcastError(data.error || "Failed to send notification");
      }
    } catch (e: any) {
      setBroadcastError(e.message || "Network error");
    } finally {
      setBroadcastSending(false);
    }
  };

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-neutral-900 animate-spin" />
      </div>
    );
  }

  // Admin Login Screen with Language Switcher
  if (!admin) {
    return (
      <>
      <div
        dir="ltr"
        className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 transition-all"
      >
        <div className="max-w-sm w-full mx-auto my-auto py-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0A52A9] text-white flex items-center justify-center mx-auto mb-4 shadow-md overflow-hidden p-0.5 border border-[#0A52A9]">
              <img src="/logo.png" alt="jari" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-2xl font-serif font-medium text-[#0B192C] mb-1">
              {config.storeName}
            </h1>
            <p className="text-xs text-neutral-500">{t.portalSubtitle}</p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-8 shadow-xl">
            {loginError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  {t.adminEmail}
                </label>
                <input
                  type="text"
                  autoCapitalize="none"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="jari"
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  {t.password}
                </label>
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••"
                  className="glass-input w-full px-4 py-3 rounded-2xl text-sm"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-2xl bg-[#0A52A9] text-[#F4EECF] text-sm font-semibold hover:bg-[#073B7A] transition-all disabled:opacity-50 mt-2 cursor-pointer shadow-sm active:scale-98"
              >
                {loginLoading ? t.authenticating : t.signIn}
              </button>
            </form>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500 py-4 flex items-center justify-center gap-4">
          <Link href="/cashier" className="hover:text-[#0A52A9] underline flex items-center gap-1">
            <Coffee className="w-3.5 h-3.5 text-[#0A52A9]" />
            {t.openCashier}
          </Link>
          <span className="text-neutral-300">•</span>
          <Link href="/customer" className="hover:text-[#0A52A9] underline">
            {t.openCustomer}
          </Link>
        </div>
      </div>

      {/* Install Guide Modal */}
      {showInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl p-6 max-w-sm w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="absolute top-4 end-4 p-1 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-[#0A52A9] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-center text-[#0B192C] mb-1">
              Install Admin Dashboard
            </h3>
            <p className="text-xs text-neutral-500 text-center mb-4">
              Add a dedicated Admin icon that opens this dashboard directly:
            </p>

            <div className="space-y-3 glass-panel-subtle rounded-2xl p-4 text-xs text-[#0B192C]">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                <span>Tap the <strong>Share</strong> button in Safari or <strong>Menu (⋮)</strong> in Chrome.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                <span>Select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                <span>Tap <strong>Add</strong>. The icon will be named <strong>jari Admin</strong> and will open the dashboard directly.</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallGuide(false)}
              className="w-full mt-4 py-2.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-bold hover:bg-[#073B7A] transition-colors cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
      </>
    );
  }

  const navTabs = [
    { id: "analytics", label: t.navAnalytics, icon: LayoutDashboard },
    { id: "customers", label: t.navCustomers, icon: Users },
    { id: "rewards", label: t.navRewards, icon: Gift },
    { id: "cashiers", label: t.navCashiers, icon: ShieldCheck },
    { id: "broadcast", label: t.navBroadcast, icon: Send },
  ] as const;

  // Super Admin Layout (100% English, Centered & Balanced Layout)
  return (
    <div
      dir="ltr"
      className="min-h-screen bg-[#F8FAFC] flex flex-col lg:flex-row transition-all text-[#0B192C]"
    >
      {/* MOBILE & IPAD PORTRAIT TOP HEADER (< lg: 1024px) */}
      <div className="lg:hidden bg-white/95 backdrop-blur-md border-b border-[#E6DEBA] sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#0A52A9] flex items-center justify-center text-white shrink-0 overflow-hidden p-0.5 border border-[#0A52A9]">
              <img src="/logo.png" alt="jari" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="min-w-0">
              <span className="font-semibold text-sm text-[#0B192C] block leading-tight truncate font-serif">
                {config.storeName}
              </span>
              <span className="text-[10px] font-mono text-[#0A52A9] uppercase tracking-wider font-semibold">
                {t.superAdmin}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/cashier"
              title={t.openCashier}
              className="px-2.5 py-1.5 rounded-xl border border-[#E6DEBA] bg-white hover:bg-[#FDFBF4] text-xs font-medium text-[#0B192C] transition-colors flex items-center gap-1"
            >
              <Coffee className="w-3.5 h-3.5 text-[#0A52A9]" />
              <span className="hidden sm:inline">{t.openCashier}</span>
            </Link>

            {!isStandaloneApp && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-2.5 py-1.5 rounded-xl border border-[#E6DEBA] bg-white hover:bg-[#FDFBF4] text-xs font-semibold text-[#0A52A9] flex items-center gap-1 transition-colors cursor-pointer"
                title="Install Admin Dashboard"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Install</span>
              </button>
            )}

            <button
              onClick={handleLogout}
              className="p-2 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              title={t.signOut}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills (Touch-Optimized for Mobile & iPad Portrait) */}
        <div className="px-3 py-2 border-t border-[#E6DEBA]/60 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-2 rounded-xl text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#0A52A9] text-[#F4EECF] shadow-xs font-semibold"
                    : "bg-[#FDFBF4] text-[#0B192C] hover:bg-[#E6DEBA]/50 border border-[#E6DEBA]/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#F4EECF]" : "text-[#0A52A9]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESKTOP & IPAD LANDSCAPE SIDEBAR (>= lg: 1024px) */}
      <aside className="hidden lg:flex w-64 xl:w-72 bg-white/70 backdrop-blur-2xl border-e border-white/60 shadow-xs flex-col justify-between p-5 min-h-screen shrink-0 sticky top-0 h-screen">
        <div>
          {/* Brand header */}
          <div className="flex items-center gap-3 px-2 py-3 mb-5 border-b border-[#E6DEBA]/60">
            <div className="w-11 h-11 rounded-xl bg-[#0A52A9] flex items-center justify-center text-white flex-shrink-0 overflow-hidden p-0.5 border border-[#0A52A9]">
              <img src="/logo.png" alt="jari" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="truncate">
              <span className="font-semibold text-sm text-[#0B192C] block leading-tight truncate font-serif">
                {config.storeName}
              </span>
              <span className="text-[10px] font-mono text-[#0A52A9] uppercase tracking-wider font-semibold">
                {t.superAdmin}
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#0A52A9] text-[#F4EECF] shadow-sm font-semibold"
                      : "text-neutral-600 hover:text-[#073B7A] hover:bg-[#FDFBF4]"
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#F4EECF]" : "text-[#0A52A9]"}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-[#E6DEBA]/60 space-y-3">
          <div className="px-2">
            <span className="text-xs font-semibold text-[#0B192C] block truncate">
              {admin.name}
            </span>
            <span className="text-[11px] text-neutral-400 font-mono block truncate" dir="ltr">
              {admin.email}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <Link
              href="/cashier"
              className="text-xs text-[#0A52A9] hover:text-[#073B7A] font-medium flex items-center gap-1.5 transition-colors"
            >
              <Coffee className="w-3.5 h-3.5 text-[#0A52A9]" />
              {t.openCashier}
            </Link>
            <div className="flex items-center gap-2">
              {!isStandaloneApp && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="text-xs text-[#0A52A9] hover:text-[#073B7A] flex items-center gap-1 cursor-pointer font-medium"
                  title="Install Admin App"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  Install
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1 cursor-pointer font-medium"
              >
                <LogOut className="w-3.5 h-3.5" />
                {t.signOut}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 xl:p-10 max-w-6xl w-full mx-auto overflow-y-auto">
        {/* TAB 1: EXECUTIVE ANALYTICS & METRICS */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-medium text-neutral-900">
                  {t.analyticsTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.analyticsSubtitle}
                </p>
              </div>

              <button
                onClick={loadMetrics}
                disabled={loadingMetrics}
                className="px-4 py-2.5 rounded-2xl glass-panel hover:bg-white text-xs font-semibold text-[#0A52A9] flex items-center gap-2 self-start transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMetrics ? "animate-spin" : ""}`} />
                <span>{t.refreshData}</span>
              </button>
            </div>

            {/* Metrics Cards Grid - Clean Minimalist Luxury Glass */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Card 1: Points Issued */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all hover:shadow-md hover:border-[#0A52A9]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-neutral-500">{t.cardIssued}</span>
                  <div className="w-8 h-8 rounded-xl bg-[#FDFBF4] text-[#0A52A9] flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#0A52A9] font-mono" dir="ltr">
                  +{metrics?.totalPointsIssued.toLocaleString() || 0}
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
                  {t.cardIssuedSub}
                </span>
              </div>

              {/* Card 2: Points Redeemed */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all hover:shadow-md hover:border-[#0A52A9]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-neutral-500">{t.cardRedeemed}</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-neutral-800 font-mono" dir="ltr">
                  -{metrics?.totalPointsRedeemed.toLocaleString() || 0}
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block font-mono">
                  {t.cardRedeemedSub}
                </span>
              </div>

              {/* Card 3: Active Customer Base */}
              <div className="glass-panel rounded-3xl p-5 sm:p-6 transition-all hover:shadow-md hover:border-[#0A52A9]/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-semibold text-neutral-500">{t.cardMembers}</span>
                  <div className="w-8 h-8 rounded-xl bg-[#F8FAFC] text-[#0A52A9] flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#0B192C]" dir="ltr">
                  {metrics?.activeCustomerCount || 0}
                </div>
                <span className="text-[11px] text-neutral-400 mt-1 block">
                  {t.cardMembersSub}
                </span>
              </div>
            </div>

            {/* Clean Recent Activity & Top Customer Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Customers summary */}
              <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E6DEBA]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#0A52A9]" />
                    <h3 className="text-sm font-semibold text-[#0B192C]">{t.topCustomers}</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab("customers")}
                    className="text-xs text-[#0A52A9] hover:underline font-medium cursor-pointer"
                  >
                    View All Members →
                  </button>
                </div>

                <div className="divide-y divide-[#E6DEBA]/40">
                  {metrics?.topCustomers.slice(0, 5).map((cust, idx) => (
                    <div key={cust._id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#F8FAFC] text-[#0A52A9] text-xs font-mono font-semibold flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-[#0B192C]">{cust.name}</span>
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-medium bg-[#FDFBF4] text-[#0A52A9] border border-[#E6DEBA]">
                              {cust.tier}
                            </span>
                          </div>
                          <span className="text-[11px] text-neutral-400 font-mono block" dir="ltr">
                            {cust.phone || cust.email}
                          </span>
                        </div>
                      </div>

                      <div className={lang === "ar" ? "text-left" : "text-right"}>
                        <span className="text-xs font-bold font-mono text-[#0A52A9] block" dir="ltr">
                          {cust.lifetimePoints} {t.pts}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-mono" dir="ltr">
                          {t.bal}: {cust.pointsBalance}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E6DEBA]/60">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-600" />
                    <h3 className="text-sm font-semibold text-[#0B192C]">{t.liveActivity}</h3>
                  </div>
                  <span className="text-[11px] font-mono text-neutral-400">{t.auditTrail}</span>
                </div>

                {metrics?.recentTransactions.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-8 text-center">{t.noTransactions}</p>
                ) : (
                  <div className="divide-y divide-[#E6DEBA]/40">
                    {metrics?.recentTransactions.slice(0, 5).map((tx) => (
                      <div key={tx._id} className="py-3 flex items-center justify-between text-xs">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${
                                tx.type === "EARN"
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-amber-50 text-amber-800 border-amber-200"
                              }`}
                            >
                              {tx.type === "EARN" ? "Earned" : "Redeemed"}
                            </span>
                            <span className="font-semibold text-[#0B192C]">{tx.customerName}</span>
                          </div>
                          <span className="text-[10px] text-neutral-400 font-mono block">
                            {tx.referenceCode} • {tx.branchName || "Main"}
                          </span>
                        </div>

                        <div className={lang === "ar" ? "text-left" : "text-right"}>
                          <span
                            dir="ltr"
                            className={`font-mono font-bold block ${
                              tx.points > 0 ? "text-emerald-700" : "text-[#0A52A9]"
                            }`}
                          >
                            {tx.points > 0 ? `+${tx.points}` : tx.points} {t.pts}
                          </span>
                          {tx.billAmount && (
                            <span className="text-[10px] text-neutral-400 font-mono block" dir="ltr">
                              {tx.billAmount.toFixed(3)} {config.currency}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMERS DIRECTORY */}
        {activeTab === "customers" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-medium text-neutral-900">
                  {t.customersTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.customersSubtitle}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="px-3.5 py-1.5 rounded-xl bg-white border border-[#E6DEBA] shadow-2xs text-xs">
                  <span className="text-neutral-400 font-mono text-[11px] me-1.5">{t.totalCustomers}:</span>
                  <span className="font-bold text-[#0A52A9]">{customersList.length}</span>
                </div>
                <button
                  onClick={loadCustomers}
                  disabled={loadingCustomers}
                  className="px-3.5 py-2 rounded-xl border border-[#E6DEBA] bg-white hover:bg-[#F8FAFC] text-xs font-medium text-[#0A52A9] flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomers ? "animate-spin" : ""}`} />
                  <span>{t.refreshData}</span>
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="glass-panel-subtle rounded-2xl p-3 shadow-xs flex items-center gap-2.5">
              <Search className="w-4 h-4 text-neutral-400 flex-shrink-0" />
              <input
                type="text"
                value={customerSearchQuery}
                onChange={(e) => setCustomerSearchQuery(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full text-xs bg-transparent focus:outline-none text-[#0B192C] placeholder-neutral-400"
              />
              {customerSearchQuery && (
                <button
                  onClick={() => setCustomerSearchQuery("")}
                  className="text-neutral-400 hover:text-neutral-700 text-xs px-2 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Customers Table */}
            <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FDFBF4] border-b border-[#E6DEBA] text-[#0A52A9] font-semibold">
                      <th className="py-3.5 px-5 text-start">{t.tblCustomer}</th>
                      <th className="py-3.5 px-4 text-start">{t.tblPhoneEmail}</th>
                      <th className="py-3.5 px-4 text-start">{t.tblTier}</th>
                      <th className="py-3.5 px-4 text-start">{t.tblBalance}</th>
                      <th className="py-3.5 px-5 text-end">{t.tblActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DEBA]/50">
                    {customersList
                      .filter((c) => {
                        if (!customerSearchQuery.trim()) return true;
                        const q = customerSearchQuery.toLowerCase().trim();
                        return (
                          (c.name && c.name.toLowerCase().includes(q)) ||
                          (c.phone && c.phone.includes(q)) ||
                          (c.email && c.email.toLowerCase().includes(q))
                        );
                      })
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-[#FDFBF4]/40 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#0A52A9] text-[#F4EECF] font-semibold text-xs flex items-center justify-center flex-shrink-0">
                                {c.name ? c.name.charAt(0).toUpperCase() : "C"}
                              </div>
                              <div>
                                <span className="font-semibold text-[#0B192C] block">{c.name}</span>
                                {c.email && (
                                  <span className="text-[11px] text-neutral-400 font-mono block" dir="ltr">
                                    {c.email}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-neutral-600" dir="ltr">
                            {c.phone || "—"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium border bg-[#F8FAFC] text-[#0A52A9] border-[#E6DEBA]">
                              {c.tier || "Member"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-bold text-[#0A52A9] font-mono">
                            {c.pointsBalance.toLocaleString()} {t.pts}
                          </td>
                          <td className="py-3.5 px-5 text-end">
                            <button
                              onClick={() => {
                                setSelectedCustomerId(c.id);
                                setBroadcastAudience("single");
                                setActiveTab("broadcast");
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#F8FAFC] hover:bg-[#0A52A9] text-[#0A52A9] hover:text-[#F4EECF] border border-[#E6DEBA] text-[11px] font-medium transition-all flex items-center gap-1.5 ms-auto cursor-pointer shadow-2xs"
                            >
                              <Send className="w-3 h-3" />
                              <span>{t.tblSendNotif}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    {customersList.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-xs text-neutral-400">
                          {t.noCustomersFound}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: REWARDS CATALOGUE MANAGEMENT */}
        {activeTab === "rewards" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-medium text-neutral-900">
                  {t.rewardsTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.rewardsSubtitle}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAddRewardModal(true)}
                className="px-4 py-2.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-bold hover:bg-[#073B7A] transition-all flex items-center gap-2 shadow-xs cursor-pointer self-start sm:self-auto shrink-0 active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>{t.addReward}</span>
              </button>
            </div>

            {rewardsList.length === 0 ? (
              <div className="bg-white border border-[#E6DEBA] rounded-3xl p-10 text-center shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-[#FDFBF4] text-[#0A52A9] flex items-center justify-center mx-auto mb-3 border border-[#E6DEBA]">
                  <Gift className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-[#0B192C] mb-1">No Rewards Created Yet</h3>
                <p className="text-xs text-neutral-500 max-w-sm mx-auto mb-4">
                  Add items customers can redeem with their loyalty points using photos directly from your device.
                </p>
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(true)}
                  className="px-4 py-2 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-bold hover:bg-[#073B7A] transition-colors cursor-pointer"
                >
                  Create First Reward
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {rewardsList.map((reward) => (
                  <div
                    key={reward._id}
                    className="glass-panel rounded-3xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Thumbnail Banner */}
                      <div className="relative h-44 sm:h-48 w-full bg-[#F8FAFC] overflow-hidden border-b border-[#E6DEBA]/60">
                        {reward.imageUrl ? (
                          <img
                            src={reward.imageUrl}
                            alt={reward.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#0A52A9]/30">
                            <Gift className="w-12 h-12" />
                          </div>
                        )}

                        {/* Points Cost Floating Badge */}
                        <div className="absolute top-3 end-3 px-3 py-1 rounded-full bg-[#0A52A9] text-[#F4EECF] shadow-sm flex items-center gap-1 font-mono text-xs font-bold">
                          <span>{reward.pointsRequired}</span>
                          <span className="text-[10px] opacity-80 uppercase">pts</span>
                        </div>

                        {/* Category Floating Badge */}
                        <div className="absolute top-3 start-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#0B192C] border border-neutral-200 text-[10px] font-semibold shadow-2xs">
                          {reward.category}
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-5">
                        <h3 className="text-sm sm:text-base font-bold text-[#0B192C] leading-snug line-clamp-1 mb-1">
                          {reward.title}
                        </h3>
                        <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed min-h-[2rem]">
                          {reward.description || "Specialty loyalty catalogue item."}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Controls Bar */}
                    <div className="px-4 py-3 bg-[#F8FAFC]/50 border-t border-[#E6DEBA]/60 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleReward(reward._id, reward.isActive)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-all cursor-pointer ${
                            reward.isActive
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                              : "bg-neutral-100 text-neutral-500 border-neutral-200 hover:bg-neutral-200"
                          }`}
                        >
                          {reward.isActive ? "● Active" : "○ Disabled"}
                        </button>

                        <span className="text-[11px] text-neutral-400 font-mono" title="Total redemptions">
                          {reward.redemptionCount || 0} claimed
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteReward(reward._id)}
                        className="p-1.5 rounded-xl text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete Reward"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: CASHIER STAFF ACCOUNTS */}
        {activeTab === "cashiers" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-serif font-medium text-neutral-900">
                  {t.cashiersTitle}
                </h1>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {t.cashiersSubtitle}
                </p>
              </div>

              <button
                onClick={() => setShowAddCashierModal(true)}
                className="px-4 py-2 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-medium hover:bg-[#073B7A] transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0 active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                {t.addCashier}
              </button>
            </div>

            <div className="glass-panel rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[620px] w-full text-start text-xs">
                  <thead className="bg-[#F8FAFC] border-b border-[#E6DEBA] font-mono text-neutral-500 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-5 text-start">{t.tblStaffMember}</th>
                      <th className="py-3 px-4 text-start">{t.tblUsername}</th>
                      <th className="py-3 px-4 text-start">{t.tblBranch}</th>
                      <th className="py-3 px-4 text-start">{t.tblPin}</th>
                      <th className="py-3 px-4 text-start">{t.tblStatus}</th>
                      <th className="py-3 px-5 text-end">{t.tblActions}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DEBA]/50">
                    {cashiersList.map((c) => (
                      <tr key={c.id} className="hover:bg-[#FDFBF4]/50 transition-colors">
                        <td className="py-3.5 px-5 font-semibold text-[#0B192C]">{c.name}</td>
                        <td className="py-3.5 px-4 font-mono text-neutral-600" dir="ltr">{c.username}</td>
                        <td className="py-3.5 px-4 text-neutral-600">{c.branchName}</td>
                        <td className="py-3.5 px-4 font-mono tracking-wider font-bold text-[#0A52A9]" dir="ltr">
                          {c.staffPin}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                              c.isActive
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-neutral-100 text-neutral-500 border-neutral-200"
                            }`}
                          >
                            {c.isActive ? t.authorized : t.suspended}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-end">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => handleToggleCashier(c.id, c.isActive)}
                              className="text-[#0A52A9] hover:text-[#073B7A] text-xs underline font-medium cursor-pointer"
                            >
                              {c.isActive ? t.deactivate : t.reactivate}
                            </button>
                            <button
                              onClick={() => handleDeleteCashier(c.id, c.name)}
                              className="p-1 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="Delete Cashier"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: BROADCAST / NOTIFICATION CENTER */}
        {activeTab === "broadcast" && (
          <div className="max-w-xl space-y-6">
            <div>
              <h1 className="text-2xl font-serif font-medium text-neutral-900">
                {t.broadcastTitle}
              </h1>
              <p className="text-xs text-neutral-500 mt-0.5">
                {t.broadcastSubtitle}
              </p>
            </div>

            <form onSubmit={handleSendBroadcast} className="glass-panel rounded-3xl p-6 sm:p-8 space-y-5">
              {broadcastSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{broadcastSuccess}</span>
                </div>
              )}

              {broadcastError && (
                <div className="p-3 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{broadcastError}</span>
                </div>
              )}

              {/* Audience Selector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-500 mb-2.5">
                  {t.audienceLabel}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBroadcastAudience("all")}
                    className={`py-3 px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      broadcastAudience === "all"
                        ? "bg-[#0A52A9] text-[#F4EECF] border-[#0A52A9] shadow-md ring-2 ring-[#0A52A9]/20"
                        : "bg-white/80 text-neutral-700 border-[#E6DEBA] hover:bg-white hover:border-[#0A52A9]/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${broadcastAudience === "all" ? "bg-white/15 text-white" : "bg-[#F8FAFC] text-[#0A52A9]"}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${broadcastAudience === "all" ? "text-white" : "text-neutral-900"}`}>
                        All Members
                      </div>
                      <div className={`text-[10px] ${broadcastAudience === "all" ? "text-[#F4EECF]/70" : "text-neutral-400"}`}>
                        Broadcast to all members
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBroadcastAudience("single")}
                    className={`py-3 px-4 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
                      broadcastAudience === "single"
                        ? "bg-[#0A52A9] text-[#F4EECF] border-[#0A52A9] shadow-md ring-2 ring-[#0A52A9]/20"
                        : "bg-white/80 text-neutral-700 border-[#E6DEBA] hover:bg-white hover:border-[#0A52A9]/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${broadcastAudience === "single" ? "bg-white/15 text-white" : "bg-[#F8FAFC] text-[#0A52A9]"}`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${broadcastAudience === "single" ? "text-white" : "text-neutral-900"}`}>
                        Specific Member
                      </div>
                      <div className={`text-[10px] ${broadcastAudience === "single" ? "text-[#F4EECF]/70" : "text-neutral-400"}`}>
                        Direct 1-on-1 message
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Single Customer Selection Dropdown */}
              {broadcastAudience === "single" && (
                <div className="p-4 rounded-2xl bg-[#F8FAFC]/80 border border-[#E6DEBA]/80 space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600">
                    {t.selectCustomer}
                  </label>
                  {loadingCustomers ? (
                    <div className="p-3 text-xs text-neutral-400 font-mono">Loading customers directory...</div>
                  ) : customersList.length === 0 ? (
                    <div className="p-3 text-xs text-amber-800 bg-amber-50/80 rounded-xl border border-amber-200">
                      {t.noCustomersFound}
                    </div>
                  ) : (
                    <CustomGlassSelect
                      value={selectedCustomerId}
                      onChange={setSelectedCustomerId}
                      placeholder={`-- ${t.selectCustomer} --`}
                      searchable={true}
                      options={customersList.map((c) => ({
                        value: c.id,
                        label: c.name,
                        subtitle: c.phone || c.email || undefined,
                        badge: `${c.pointsBalance} pts`,
                      }))}
                    />
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 mb-2">
                  {t.announcementTitle}
                </label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="Notification title or offer announcement..."
                  className="glass-input w-full px-4 py-3.5 rounded-2xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 shadow-xs focus:ring-4 focus:ring-[#0A52A9]/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 mb-2">
                  {t.notificationMessage}
                </label>
                <textarea
                  rows={4}
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Write notification message details here..."
                  className="glass-input w-full px-4 py-3.5 rounded-2xl text-sm text-neutral-900 placeholder:text-neutral-400 resize-none leading-relaxed min-h-[110px] shadow-xs focus:ring-4 focus:ring-[#0A52A9]/10"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-neutral-600 mb-2">
                  {t.optionalBonus}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={broadcastBonus}
                    onChange={(e) => setBroadcastBonus(e.target.value)}
                    placeholder="0"
                    min="0"
                    className="glass-input w-full px-4 py-3.5 pr-14 rounded-2xl text-sm font-mono text-neutral-900 placeholder:text-neutral-400 shadow-xs focus:ring-4 focus:ring-[#0A52A9]/10"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[11px] font-mono font-bold text-neutral-400 pointer-events-none">
                    PTS
                  </span>
                </div>
                <span className="text-[11px] text-neutral-400 mt-1.5 block">
                  {t.bonusHelp}
                </span>
              </div>

              <div className="pt-4 border-t border-[#E6DEBA]/60 flex justify-end">
                <button
                  type="submit"
                  disabled={broadcastSending}
                  className="px-6 py-2.5 rounded-xl bg-[#0A52A9] hover:bg-[#073B7A] text-[#F4EECF] text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer active:scale-98"
                >
                  <Send className="w-3.5 h-3.5" />
                  {broadcastSending
                    ? t.sendingBroadcast
                    : broadcastAudience === "single"
                    ? t.sendToSingle
                    : t.sendBroadcast}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* MODAL: ADD NEW REWARD */}
      {showAddRewardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            dir="ltr"
            className="glass-panel rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DEBA]/60 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#0A52A9] text-[#F4EECF] flex items-center justify-center shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0B192C]">Add New Reward</h3>
                  <p className="text-[11px] text-neutral-500">Create a reward with photo directly from your device</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddRewardModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createRewardError && (
              <div className="p-3.5 rounded-2xl bg-rose-50/80 border border-rose-200 text-xs text-rose-800 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createRewardError}</span>
              </div>
            )}

            <form onSubmit={handleCreateReward} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  {t.titleLabel} *
                </label>
                <input
                  type="text"
                  value={newReward.title}
                  onChange={(e) => setNewReward({ ...newReward, title: e.target.value })}
                  placeholder="e.g. Flat White, French Croissant, Kyoto Cold Brew..."
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  {t.descriptionLabel} (Optional)
                </label>
                <input
                  type="text"
                  value={newReward.description}
                  onChange={(e) => setNewReward({ ...newReward, description: e.target.value })}
                  placeholder="e.g. Double shot espresso with velvety steamed whole milk"
                  className="glass-input w-full"
                />
              </div>

              {/* Device-Only Image Upload */}
              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  Reward Photo (Direct Device Upload)
                </label>

                {newReward.imageUrl ? (
                  <div className="relative rounded-2xl overflow-hidden border-2 border-[#E6DEBA] bg-[#F8FAFC] h-48 w-full group shadow-xs">
                    <img
                      src={newReward.imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />

                    {/* Desktop Hover Controls Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex items-center justify-center gap-2.5">
                      <label className="px-3.5 py-2 rounded-xl bg-white text-[#0B192C] text-xs font-bold shadow-md cursor-pointer hover:bg-[#F8FAFC] flex items-center gap-1.5 transition-all">
                        <Camera className="w-3.5 h-3.5 text-[#0A52A9]" />
                        <span>Change Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleRewardImageUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewReward({ ...newReward, imageUrl: "" })}
                        className="px-3.5 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md cursor-pointer hover:bg-red-700 flex items-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>

                    {/* Mobile & Touch Controls */}
                    <div className="sm:hidden absolute bottom-2 end-2 flex items-center gap-1.5">
                      <label className="px-3 py-1.5 rounded-xl bg-black/75 backdrop-blur-xs text-white text-xs font-semibold cursor-pointer shadow-md flex items-center gap-1">
                        <Camera className="w-3 h-3" />
                        <span>Change</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleRewardImageUpload(file);
                          }}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => setNewReward({ ...newReward, imageUrl: "" })}
                        className="px-3 py-1.5 rounded-xl bg-red-600/90 backdrop-blur-xs text-white text-xs font-semibold cursor-pointer shadow-md flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Delete</span>
                      </button>
                    </div>

                    <div className="absolute top-2.5 start-2.5 px-2.5 py-1 rounded-full bg-emerald-700/90 text-white text-[10px] font-semibold backdrop-blur-xs shadow-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Photo Attached</span>
                    </div>
                  </div>
                ) : (
                  <label className="w-full py-8 px-4 rounded-2xl border-2 border-dashed border-[#E6DEBA] hover:border-[#0A52A9] bg-[#F8FAFC]/60 hover:bg-[#FDFBF4] flex flex-col items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#0A52A9]/10 text-[#0A52A9] flex items-center justify-center">
                      <Upload className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#0B192C] block">
                        Tap to select photo from device
                      </span>
                      <span className="text-[11px] text-neutral-500 block mt-0.5">
                        Camera, Photo Library, or Files (JPG, PNG, WebP)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-[#0A52A9] bg-[#F4EECF] px-2.5 py-0.5 rounded-full mt-1">
                      Auto-compressed on device for instant loading
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleRewardImageUpload(file);
                      }}
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-[#0B192C] mb-1">
                    {t.tblPointsCost} *
                  </label>
                  <input
                    type="number"
                    value={newReward.pointsRequired}
                    onChange={(e) =>
                      setNewReward({ ...newReward, pointsRequired: parseInt(e.target.value) || 0 })
                    }
                    className="glass-input w-full font-mono"
                    required
                    min={1}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0B192C] mb-1">
                    {t.tblCategory} *
                  </label>
                  <CustomGlassSelect
                    value={newReward.category}
                    onChange={(cat) => setNewReward({ ...newReward, category: cat })}
                    options={[
                      { value: "Drinks", label: "Beverages" },
                      { value: "Food", label: "Food & Pastries" },
                      { value: "Beans", label: "Specialty Beans" },
                      { value: "Merchandise", label: "Merchandise" },
                      { value: "Special", label: "Special Offers" },
                    ]}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-[#E6DEBA]/60">
                <button
                  type="button"
                  onClick={() => setShowAddRewardModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E6DEBA] text-xs font-medium text-neutral-600 hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={createRewardLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-bold hover:bg-[#073B7A] transition-all cursor-pointer shadow-xs disabled:opacity-50 active:scale-98 flex items-center gap-1.5"
                >
                  {createRewardLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Saving Reward...</span>
                    </>
                  ) : (
                    <span>{t.createReward}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW CASHIER */}
      {showAddCashierModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="glass-panel rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DEBA]/60 mb-5">
              <h3 className="text-base font-semibold text-[#0B192C] font-serif">{t.addCashierModalTitle}</h3>
              <button onClick={() => setShowAddCashierModal(false)} className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100/50 cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCashier} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#0B192C] mb-1">{t.fullName}</label>
                <input
                  type="text"
                  value={newCashier.name}
                  onChange={(e) => setNewCashier({ ...newCashier, name: e.target.value })}
                  placeholder="Staff Full Name"
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#0B192C] mb-1">{t.usernameForPOS}</label>
                <input
                  type="text"
                  value={newCashier.username}
                  onChange={(e) => setNewCashier({ ...newCashier, username: e.target.value })}
                  placeholder="cashier"
                  className="glass-input w-full font-mono"
                  dir="ltr"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#0B192C] mb-1">{t.tblBranch}</label>
                  <input
                    type="text"
                    value={newCashier.branchName}
                    onChange={(e) => setNewCashier({ ...newCashier, branchName: e.target.value })}
                    className="glass-input w-full"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#0B192C] mb-1">{t.tblPin}</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newCashier.staffPin}
                    onChange={(e) => setNewCashier({ ...newCashier, staffPin: e.target.value })}
                    placeholder="••••"
                    className="glass-input w-full font-mono text-center tracking-widest"
                    required
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E6DEBA]/60 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddCashierModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E6DEBA] text-xs text-neutral-600 hover:bg-neutral-100/50 cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-semibold hover:bg-[#073B7A] transition-colors shadow-xs cursor-pointer active:scale-98"
                >
                  {t.createAccount}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
