"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useBrand } from "@/components/BrandProvider";
import confetti from "canvas-confetti";
import {
  ScanLine,
  Hash,
  CheckCircle2,
  AlertCircle,
  LogOut,
  ArrowRight,
  Sparkles,
  CreditCard,
  Gift,
  RefreshCw,
  X,
  Camera,
  Delete,
  Check,
  Smartphone,
  Share2,
} from "lucide-react";
import QrCameraScanner from "@/components/QrCameraScanner";
import CustomGlassSelect from "@/components/CustomGlassSelect";

interface POSCustomer {
  id: string;
  name: string;
  phone: string;
  pin: string;
  tier: string;
  pointsBalance: number;
  lifetimePoints: number;
  currencyValue: number;
  currency: string;
  pointsPerUnit: number;
}

interface ReceiptData {
  referenceCode: string;
  customerName: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  oldBalance: number;
  newBalance: number;
  billAmount?: number;
  currency: string;
  tier: string;
  tierUpgraded?: boolean;
}

export default function CashierPage() {
  const { config, formatCurrency } = useBrand();

  // Cashier session state
  const [cashier, setCashier] = useState<{
    id: string;
    name: string;
    username: string;
    branchName: string;
  } | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  // Cashier login form state
  const [usernameInput, setUsernameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // POS Workflow State
  const [activeMode, setActiveMode] = useState<"pin" | "qr">("pin");
  const [showCameraScanner, setShowCameraScanner] = useState(false);
  const [pinQuery, setPinQuery] = useState("");
  const [qrQuery, setQrQuery] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [identifiedCustomer, setIdentifiedCustomer] = useState<POSCustomer | null>(null);

  // Active Transaction Tab: "credit" or "redeem"
  const [actionTab, setActionTab] = useState<"credit" | "redeem">("credit");

  // Bill & Transaction State
  const [billAmount, setBillAmount] = useState<string>("");
  const [transactLoading, setTransactLoading] = useState(false);
  const [transactError, setTransactError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);

  // Redemption State
  const [redeemPoints, setRedeemPoints] = useState<string>("80");
  const [rewardTitle, setRewardTitle] = useState<string>("Specialty Flat White / Latte");
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemError, setRedeemError] = useState<string | null>(null);
  const [activeRewards, setActiveRewards] = useState<{ _id: string; title: string; pointsRequired: number; category: string }[]>([]);

  // Cashier PWA Installation States
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandaloneApp, setIsStandaloneApp] = useState(false);
  const [showInstallGuide, setShowInstallGuide] = useState(false);

  useEffect(() => {
    // Fetch active store rewards catalogue for POS redemption
    fetch("/api/customer/rewards")
      .then((res) => res.json())
      .then((data) => {
        if (data.rewards && data.rewards.length > 0) {
          const activeList = data.rewards.filter((r: any) => r.isActive !== false);
          setActiveRewards(activeList);
          if (activeList[0]) {
            setRewardTitle(activeList[0].title);
            setRedeemPoints(activeList[0].pointsRequired.toString());
          }
        }
      })
      .catch(() => {});

    if (typeof window !== "undefined") {
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
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setShowInstallGuide(true);
    }
  };

  // Check current session
  const checkSession = async () => {
    try {
      setLoadingSession(true);
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated && (data.user.role === "cashier" || data.user.role === "super_admin")) {
        setCashier({
          id: data.user.id,
          name: data.user.name,
          username: data.user.username || "sajji",
          branchName: data.user.branchName || "Main Roastery",
        });
      } else {
        setCashier(null);
      }
    } catch {
      setCashier(null);
    } finally {
      setLoadingSession(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  // Cashier Login
  const handleCashierLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "cashier",
          username: usernameInput.trim(),
          staffPin: pinInput.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCashier(data.user);
      } else {
        setLoginError(data.error || "Invalid username or security PIN");
      }
    } catch (err: any) {
      setLoginError(err.message || "Server connection error");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setCashier(null);
    resetPOS();
  };

  // Fast Customer Lookup
  const performLookup = async (query: string) => {
    if (!query || query.trim().length < 4) return;
    setLookupError(null);
    setLookupLoading(true);

    try {
      const res = await fetch("/api/pos/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: query.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setIdentifiedCustomer(data.customer);
      } else {
        setLookupError(data.error || "Customer not found. Please verify PIN or QR.");
        setIdentifiedCustomer(null);
      }
    } catch (e: any) {
      setLookupError(e.message || "Error looking up customer");
      setIdentifiedCustomer(null);
    } finally {
      setLookupLoading(false);
    }
  };

  // Handle tactile on-screen keypad press
  const handleKeypadPress = (digit: string) => {
    if (pinQuery.length >= 6) return;
    const newPin = pinQuery + digit;
    setPinQuery(newPin);
    if (newPin.length === 6) {
      performLookup(newPin);
    }
  };

  const handleKeypadBackspace = () => {
    setPinQuery((prev) => prev.slice(0, -1));
  };

  const handleKeypadClear = () => {
    setPinQuery("");
    setLookupError(null);
  };

  // Handle scanned QR from live camera
  const handleQrScan = (decodedData: string) => {
    setShowCameraScanner(false);
    setQrQuery(decodedData);
    performLookup(decodedData);
  };

  // Reset POS for next customer
  const resetPOS = () => {
    setIdentifiedCustomer(null);
    setBillAmount("");
    setPinQuery("");
    setQrQuery("");
    setLookupError(null);
    setTransactError(null);
    setRedeemError(null);
    setReceipt(null);
    setActionTab("credit");
  };

  // Credit Points on Bill
  const handleCreditPoints = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifiedCustomer) return;

    const amount = parseFloat(billAmount);
    if (isNaN(amount) || amount <= 0) {
      setTransactError("Please enter a valid bill amount greater than 0");
      return;
    }

    setTransactLoading(true);
    setTransactError(null);

    try {
      const res = await fetch("/api/pos/transact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: identifiedCustomer.id,
          billAmount: amount,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReceipt(data.receipt);
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } else {
        setTransactError(data.error || "Failed to credit points");
      }
    } catch (err: any) {
      setTransactError(err.message || "Server connection error");
    } finally {
      setTransactLoading(false);
    }
  };

  // Redeem Points
  const handleRedeemPoints = async () => {
    if (!identifiedCustomer) return;
    const pts = parseInt(redeemPoints);
    if (isNaN(pts) || pts <= 0) {
      setRedeemError("Please enter a valid points amount to redeem");
      return;
    }

    if (pts > identifiedCustomer.pointsBalance) {
      setRedeemError(`Insufficient customer balance (${identifiedCustomer.pointsBalance} pts available)`);
      return;
    }

    setRedeemLoading(true);
    setRedeemError(null);

    try {
      const res = await fetch("/api/pos/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: identifiedCustomer.id,
          pointsToRedeem: pts,
          rewardTitle: rewardTitle || "Order Discount",
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReceipt(data.receipt);
        confetti({ particleCount: 40, spread: 50 });
      } else {
        setRedeemError(data.error || "Failed to redeem reward");
      }
    } catch (e: any) {
      setRedeemError(e.message || "Server connection error");
    } finally {
      setRedeemLoading(false);
    }
  };

  // Calculate live preview of points for current bill
  const calculatedPoints =
    billAmount && !isNaN(parseFloat(billAmount))
      ? Math.floor(parseFloat(billAmount) * (config.pointsPerUnit || 10))
      : 0;

  if (loadingSession) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-neutral-300 border-t-[#0A52A9] animate-spin" />
      </div>
    );
  }

  // ==========================================
  // Cashier Login View (Mobile-First Arabic)
  // ==========================================
  if (!cashier) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-between p-4 sm:p-6 select-none font-sans">
        <div className="max-w-sm w-full mx-auto my-auto py-4">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-[#0A52A9] flex items-center justify-center mx-auto mb-3 shadow-md border border-[#0A52A9]/20 overflow-hidden p-0.5">
              <img src="/logo.png" alt="jari" className="w-full h-full object-cover rounded-xl" />
            </div>
            <h1 className="text-2xl font-bold text-[#0B192C] mb-1">
              Cashier Terminal
            </h1>
            <p className="text-xs text-neutral-500 font-medium">
              Point of Sale & Loyalty • jari POS
            </p>
          </div>

          <div className="glass-panel rounded-3xl p-6 sm:p-7 shadow-xl">
            {loginError && (
              <div className="mb-4 p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleCashierLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  Cashier Username
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. sajji"
                  className="glass-input w-full"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0B192C] mb-1.5">
                  Staff Security PIN
                </label>
                <input
                  type="password"
                  inputMode="numeric"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="glass-input w-full text-center font-mono text-xl tracking-widest"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-sm font-bold hover:bg-[#073B7A] transition-all disabled:opacity-50 mt-2 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-98"
              >
                {loginLoading ? "Signing in..." : "Open POS Terminal"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Install Cashier App to Home Screen Banner */}
          {!isStandaloneApp && (
            <div className="mt-4 p-3.5 rounded-2xl glass-panel-subtle border border-[#E6DEBA] shadow-2xs flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-[#FDFBF4] text-[#0A52A9] flex items-center justify-center shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#0B192C] truncate">Add Cashier to Home Screen</p>
                  <p className="text-[10px] text-neutral-500 truncate">Launches Cashier directly, never Customer</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-3 py-1.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-bold shrink-0 hover:bg-[#073B7A] transition-all cursor-pointer shadow-2xs"
              >
                Install
              </button>
            </div>
          )}
        </div>

        {/* Install Guide Modal (Login View) */}
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
                Install Cashier to Home Screen
              </h3>
              <p className="text-xs text-neutral-500 text-center mb-4">
                Install a dedicated Cashier POS icon that opens this terminal directly:
              </p>

              <div className="space-y-3 glass-panel-subtle rounded-2xl p-4 text-xs text-[#0B192C]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#0A52A9]" /> in Safari or <strong>Menu (⋮)</strong> in Chrome.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Add</strong>. The icon will be named <strong>jari Cashier</strong> and will open this Cashier POS terminal directly.</span>
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

        <div className="text-center text-xs text-neutral-500 py-4 flex items-center justify-center gap-4">
          <Link href="/admin" className="hover:text-[#0A52A9] font-medium transition-colors">
            Admin Console
          </Link>
          <span className="text-neutral-300">•</span>
          <Link href="/customer" className="hover:text-[#0A52A9] font-medium transition-colors">
            Customer Pass
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // Cashier POS Checkout Interface (English)
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAFC]/80 backdrop-blur-md flex flex-col justify-between select-none font-sans">
      {/* Top Header - Super Compact & Clean on Mobile */}
      <header className="glass-panel border-x-0 border-t-0 rounded-none px-3.5 sm:px-6 py-2.5 sm:py-3 sticky top-0 z-20 shadow-xs">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          {/* Cashier Info */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#0A52A9] flex items-center justify-center text-white shrink-0 overflow-hidden p-0.5 border border-[#0A52A9]/20">
              <img src="/logo.png" alt="jari" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs sm:text-sm text-[#0B192C] truncate">
                  {config.storeName} Cashier
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Online" />
              </div>
              <span className="text-[11px] text-neutral-500 block truncate">
                Cashier: {cashier.name}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isStandaloneApp && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E6DEBA] glass-panel-subtle hover:bg-white text-xs font-semibold text-[#0A52A9] flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                title="Install Cashier POS App"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#0A52A9]" />
                <span className="text-xs">Install</span>
              </button>
            )}

            <button
              onClick={resetPOS}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl border border-[#E6DEBA] glass-panel-subtle hover:bg-white text-xs font-semibold text-[#0B192C] flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#0A52A9]" />
              <span className="text-xs">Reset</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-1.5 sm:p-2 rounded-xl text-neutral-500 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* POS Main Screen */}
      <main className="max-w-2xl mx-auto w-full px-3.5 sm:px-6 py-4 sm:py-6 flex-1 flex flex-col justify-start">
        {/* ============================================================== */}
        {/* STEP 1: Fast Customer Identification (Mobile Touch First)    */}
        {/* ============================================================== */}
        {!identifiedCustomer && (
          <div className="w-full max-w-md mx-auto space-y-3.5">
            {/* Mode Switcher Buttons */}
            <div className="grid grid-cols-2 gap-2 glass-panel-subtle p-1 rounded-2xl border border-[#E6DEBA]/60">
              <button
                type="button"
                onClick={() => {
                  setActiveMode("pin");
                  setLookupError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMode === "pin"
                    ? "bg-[#0A52A9] text-[#F4EECF] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Hash className="w-4 h-4" />
                <span>Customer PIN</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveMode("qr");
                  setShowCameraScanner(true);
                  setLookupError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  activeMode === "qr"
                    ? "bg-[#0A52A9] text-[#F4EECF] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Camera className="w-4 h-4" />
                <span>Scan QR with Camera</span>
              </button>
            </div>

            {/* Error Message */}
            {lookupError && (
              <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span className="font-medium">{lookupError}</span>
              </div>
            )}

            {/* MODE 1: 6-DIGIT PIN WITH OPTIONAL TACTILE NUMPAD */}
            {activeMode === "pin" && (
              <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-lg space-y-4">
                <div className="text-center">
                  <span className="text-xs font-semibold text-neutral-500 block mb-1">
                    Enter Customer 6-Digit PIN
                  </span>

                  {/* 6 Digit Display Boxes */}
                  <div className="flex justify-center gap-2 my-2 dir-ltr">
                    {[0, 1, 2, 3, 4, 5].map((idx) => {
                      const char = pinQuery[idx];
                      return (
                        <div
                          key={idx}
                          className={`w-10 h-12 sm:w-12 sm:h-14 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition-all ${
                            char
                              ? "border-[#0A52A9] bg-[#FDFBF4] text-[#0A52A9]"
                              : idx === pinQuery.length
                              ? "border-[#0A52A9] bg-white animate-pulse"
                              : "border-[#E6DEBA] bg-[#F8FAFC]/50 text-neutral-300"
                          }`}
                        >
                          {char || "•"}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tactile On-Screen Numpad for Mobile Fast Entry */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleKeypadPress(num)}
                      disabled={lookupLoading}
                      className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-white/90 active:scale-95 text-[#0B192C] font-bold text-lg font-mono flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                    >
                      {num}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleKeypadClear}
                    className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-neutral-200/50 active:scale-95 text-neutral-500 font-semibold text-xs flex items-center justify-center transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => handleKeypadPress("0")}
                    disabled={lookupLoading}
                    className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-white/90 active:scale-95 text-[#0B192C] font-bold text-lg font-mono flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                  >
                    0
                  </button>
                  <button
                    type="button"
                    onClick={handleKeypadBackspace}
                    className="h-12 sm:h-13 rounded-2xl glass-panel-subtle hover:bg-red-50/80 active:scale-95 text-neutral-600 hover:text-red-600 font-bold flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Search Button */}
                <button
                  type="button"
                  onClick={() => performLookup(pinQuery)}
                  disabled={lookupLoading || pinQuery.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-[#0A52A9] text-[#F4EECF] text-sm font-bold hover:bg-[#073B7A] transition-all disabled:opacity-40 cursor-pointer shadow-xs flex items-center justify-center gap-2 active:scale-98"
                >
                  {lookupLoading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                      <span>Searching customer...</span>
                    </>
                  ) : (
                    <>
                      <span>Search by PIN</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* MODE 2: QR SCANNER BUTTON & MANUAL TOKEN */}
            {activeMode === "qr" && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-lg space-y-4 text-center">
                <div className="w-16 h-16 rounded-full bg-[#FDFBF4] border border-[#E6DEBA] text-[#0A52A9] flex items-center justify-center mx-auto">
                  <ScanLine className="w-8 h-8 animate-pulse" />
                </div>

                <div>
                  <h3 className="font-bold text-[#0B192C] text-sm sm:text-base mb-1">
                    Scan QR Code
                  </h3>
                  <p className="text-xs text-neutral-500 max-w-xs mx-auto">
                    Open camera to scan customer loyalty card directly or enter code manually.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCameraScanner(true)}
                  className="w-full py-4 px-4 rounded-2xl bg-[#0A52A9] hover:bg-[#073B7A] text-[#F4EECF] text-sm font-bold flex items-center justify-center gap-2.5 transition-all shadow-md active:scale-98 cursor-pointer"
                >
                  <Camera className="w-5 h-5 text-[#F4EECF]" />
                  <span>Open Camera for Live Scan</span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-[#E6DEBA]"></div>
                  <span className="shrink mx-3 text-neutral-400 text-[11px]">Or enter code manually</span>
                  <div className="flex-grow border-t border-[#E6DEBA]"></div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={qrQuery}
                    onChange={(e) => setQrQuery(e.target.value)}
                    placeholder="Customer QR code..."
                    className="glass-input flex-1 text-xs font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => performLookup(qrQuery)}
                    disabled={lookupLoading || !qrQuery}
                    className="px-4 py-2.5 rounded-xl bg-[#0A52A9] text-[#F4EECF] text-xs font-bold hover:bg-[#073B7A] transition-colors disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    {lookupLoading ? "Checking..." : "Confirm"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 2: Customer Identified - Mobile-Optimized Action Screen */}
        {/* ============================================================== */}
        {identifiedCustomer && !receipt && (
          <div className="w-full max-w-lg mx-auto space-y-4">
            {/* Customer Profile Card */}
            <div className="glass-panel rounded-3xl p-4 sm:p-5 shadow-lg">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#FDFBF4] border border-[#E6DEBA] flex items-center justify-center text-[#0A52A9] text-xl font-bold shrink-0">
                    {identifiedCustomer.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-bold text-[#0B192C] truncate">
                        {identifiedCustomer.name}
                      </h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          identifiedCustomer.tier === "Gold"
                            ? "bg-amber-50 text-amber-900 border-amber-300"
                            : identifiedCustomer.tier === "Silver"
                            ? "bg-slate-100 text-slate-800 border-slate-300"
                            : "bg-[#FDFBF4] text-[#0A52A9] border-[#E6DEBA]"
                        }`}
                      >
                        {identifiedCustomer.tier}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 font-mono mt-0.5 truncate">
                      {identifiedCustomer.phone} • PIN: {identifiedCustomer.pin}
                    </p>
                  </div>
                </div>

                <button
                  onClick={resetPOS}
                  className="p-1.5 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-[#F8FAFC] transition-colors shrink-0"
                  title="Change Customer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Balance Bar */}
              <div className="glass-panel-subtle rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-neutral-500 block">Current Points Balance</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-[#0A52A9] font-mono">
                      {identifiedCustomer.pointsBalance}
                    </span>
                    <span className="text-xs text-neutral-500 font-semibold">pts</span>
                  </div>
                </div>
                <div className="text-right bg-white/80 px-3 py-1.5 rounded-xl border border-[#E6DEBA]/70 shadow-2xs">
                  <span className="text-[10px] text-neutral-400 block font-medium">Member Tier</span>
                  <span className="text-xs font-bold text-[#0A52A9] uppercase tracking-wider">
                    {identifiedCustomer.tier || "Member"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Switcher: Credit Points vs. Redeem Reward */}
            <div className="grid grid-cols-2 gap-2 glass-panel-subtle p-1 rounded-2xl border border-[#E6DEBA]/60">
              <button
                type="button"
                onClick={() => {
                  setActionTab("credit");
                  setTransactError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  actionTab === "credit"
                    ? "bg-[#0A52A9] text-[#F4EECF] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Credit Points (Bill)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActionTab("redeem");
                  setRedeemError(null);
                }}
                className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  actionTab === "redeem"
                    ? "bg-[#0A52A9] text-[#F4EECF] shadow-xs"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                <Gift className="w-4 h-4" />
                <span>Redeem Reward</span>
              </button>
            </div>

            {/* TAB A: CREDIT POINTS ON BILL */}
            {actionTab === "credit" && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#0B192C] mb-1">
                    Total Bill Amount
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Customer earns {config.pointsPerUnit || 10} points per 1.000 {config.currency}.
                  </p>
                </div>

                {transactError && (
                  <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{transactError}</span>
                  </div>
                )}

                <form onSubmit={handleCreditPoints} className="space-y-4">
                  {/* Bill Amount Input with clean embedded currency */}
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Bill Amount ({config.currency})
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.05"
                        min="0.05"
                        value={billAmount}
                        onChange={(e) => setBillAmount(e.target.value)}
                        placeholder="0.000"
                        className="glass-input w-full pr-16 pl-4 py-3.5 text-2xl font-bold font-mono text-left"
                        autoFocus
                        required
                      />
                      <span className="absolute right-3 px-2.5 py-1 rounded-xl bg-[#F8FAFC]/80 border border-[#E6DEBA] text-xs font-bold text-[#0A52A9] font-mono pointer-events-none">
                        {config.currency}
                      </span>
                    </div>

                    {/* Quick Amount Add Chips for Mobile Cashier */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {[0.5, 1.0, 1.5, 2.0, 3.0, 5.0, 10.0].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            const current = parseFloat(billAmount) || 0;
                            setBillAmount((current + val).toFixed(3));
                          }}
                          className="px-2.5 py-1.5 rounded-xl glass-panel-subtle hover:bg-white active:scale-95 text-[#0B192C] text-xs font-mono font-bold transition-all cursor-pointer"
                        >
                          +{val.toFixed(3)}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setBillAmount("")}
                        className="px-2.5 py-1.5 rounded-xl glass-panel-subtle hover:bg-red-50/80 text-neutral-600 hover:text-red-600 text-xs font-bold transition-all cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                  </div>

                  {/* Real-time points preview */}
                  <div className="p-3.5 glass-panel-subtle rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B192C]">
                      <Sparkles className="w-4 h-4 text-[#0A52A9]" />
                      <span>Points to be Earned:</span>
                    </div>
                    <span className="text-base font-black font-mono text-[#0A52A9]">
                      +{calculatedPoints} pts
                    </span>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={resetPOS}
                      className="px-4 py-3 rounded-2xl border border-[#E6DEBA] text-neutral-600 hover:bg-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={transactLoading || !billAmount || parseFloat(billAmount) <= 0}
                      className="flex-1 py-3.5 rounded-2xl bg-[#0A52A9] hover:bg-[#073B7A] text-[#F4EECF] text-sm font-bold transition-all disabled:opacity-40 flex items-center justify-center gap-2 shadow-sm cursor-pointer active:scale-98"
                    >
                      {transactLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Processing transaction...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm & Credit Points</span>
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB B: REDEEM REWARD / DISCOUNT */}
            {actionTab === "redeem" && (
              <div className="glass-panel rounded-3xl p-5 sm:p-6 shadow-lg space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-[#0B192C] mb-1">
                    Redeem Reward or Instant Discount
                  </h4>
                  <p className="text-[11px] text-neutral-500">
                    Deduct points from customer balance for a beverage, treat, or bill discount.
                  </p>
                </div>

                {redeemError && (
                  <div className="p-3 rounded-2xl bg-red-50/80 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{redeemError}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Select Reward or Discount Reason
                    </label>
                    <CustomGlassSelect
                      value={rewardTitle}
                      onChange={(val) => {
                        setRewardTitle(val);
                        const matched = activeRewards.find((r) => r.title === val);
                        if (matched) {
                          setRedeemPoints(matched.pointsRequired.toString());
                        }
                      }}
                      placeholder="Select Reward or Reason..."
                      options={[
                        ...(activeRewards.length > 0
                          ? activeRewards.map((r) => ({
                              value: r.title,
                              label: r.title,
                              badge: `${r.pointsRequired} pts`,
                              subtitle: r.category,
                            }))
                          : [
                              { value: "Specialty Flat White / Latte", label: "Specialty Flat White / Latte", badge: "80 pts" },
                              { value: "Kyoto Cold Brew", label: "Kyoto Cold Brew", badge: "120 pts" },
                              { value: "Fresh French Pistachio Croissant", label: "Fresh French Pistachio Croissant", badge: "90 pts" },
                            ]),
                        { value: "Custom Bill Discount", label: "Custom Bill Discount", subtitle: "Manual adjustment" },
                      ]}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
                      Points to Deduct
                    </label>
                    <input
                      type="number"
                      value={redeemPoints}
                      onChange={(e) => setRedeemPoints(e.target.value)}
                      className="glass-input w-full text-lg font-mono font-bold"
                      required
                    />
                  </div>

                  <div className="flex gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={resetPOS}
                      className="px-4 py-3 rounded-2xl border border-[#E6DEBA] text-neutral-600 hover:bg-[#F8FAFC] text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="button"
                      onClick={handleRedeemPoints}
                      disabled={
                        redeemLoading ||
                        !redeemPoints ||
                        parseInt(redeemPoints) <= 0 ||
                        parseInt(redeemPoints) > identifiedCustomer.pointsBalance
                      }
                      className="flex-1 py-3.5 rounded-2xl bg-[#0A52A9] hover:bg-[#073B7A] text-[#F4EECF] text-sm font-bold transition-all disabled:opacity-40 cursor-pointer shadow-sm active:scale-98 flex items-center justify-center gap-2"
                    >
                      {redeemLoading ? (
                        <>
                          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin" />
                          <span>Deducting points...</span>
                        </>
                      ) : (
                        <>
                          <span>Confirm Reward Redemption</span>
                          <Gift className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* STEP 3: Transaction Success Receipt Modal                     */}
        {/* ============================================================== */}
        {receipt && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-5 sm:p-7 max-w-sm w-full shadow-2xl text-center animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-[#FDFBF4] border-2 border-[#E6DEBA] text-[#0A52A9] flex items-center justify-center mx-auto mb-3 shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-[#0A52A9]" />
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-[#0B192C] mb-1">
                Transaction Successful!
              </h3>
              <p className="text-xs text-neutral-500 mb-4 font-mono">
                Receipt #: #{receipt.referenceCode}
              </p>

              <div className="glass-panel-subtle rounded-2xl p-4 mb-5 text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Customer:</span>
                  <span className="font-bold text-[#0B192C]">{receipt.customerName}</span>
                </div>

                {receipt.billAmount && (
                  <div className="flex justify-between">
                    <span className="text-neutral-500">Bill Amount:</span>
                    <span className="font-mono font-bold text-[#0B192C]">
                      {receipt.billAmount.toFixed(3)} {receipt.currency}
                    </span>
                  </div>
                )}

                {receipt.pointsEarned ? (
                  <div className="flex justify-between text-emerald-800 font-bold bg-emerald-50/90 px-2 py-1 rounded-lg">
                    <span>Points Added:</span>
                    <span className="font-mono">+{receipt.pointsEarned} pts</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-neutral-800 font-bold bg-neutral-100/90 px-2 py-1 rounded-lg">
                    <span>Points Redeemed:</span>
                    <span className="font-mono">-{receipt.pointsRedeemed} pts</span>
                  </div>
                )}

                <div className="pt-2 border-t border-[#E6DEBA] flex justify-between font-extrabold text-sm">
                  <span className="text-[#0B192C]">New Balance:</span>
                  <span className="font-mono text-[#0A52A9]">{receipt.newBalance} pts</span>
                </div>

                {receipt.tierUpgraded && (
                  <div className="p-2.5 bg-amber-50/90 text-amber-900 border border-amber-200 rounded-xl text-center font-bold mt-2 flex items-center justify-center gap-1.5 text-xs">
                    <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Customer tier upgraded to {receipt.tier}!</span>
                  </div>
                )}
              </div>

              <button
                onClick={resetPOS}
                className="w-full py-3.5 rounded-2xl bg-[#0A52A9] hover:bg-[#073B7A] text-[#F4EECF] text-sm font-bold transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Next Customer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Live Mobile Camera QR Scanner Modal */}
        {showCameraScanner && (
          <QrCameraScanner
            onScan={handleQrScan}
            onClose={() => setShowCameraScanner(false)}
          />
        )}

        {/* Install Guide Modal (Authenticated View) */}
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
                Install Cashier to Home Screen
              </h3>
              <p className="text-xs text-neutral-500 text-center mb-4">
                Install a dedicated Cashier POS icon that opens this terminal directly:
              </p>

              <div className="space-y-3 glass-panel-subtle rounded-2xl p-4 text-xs text-[#0B192C]">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span>Tap the <strong>Share</strong> button <Share2 className="w-3.5 h-3.5 inline mx-0.5 text-[#0A52A9]" /> in Safari or <strong>Menu (⋮)</strong> in Chrome.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span>Select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-[#0A52A9] text-[#F4EECF] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span>Tap <strong>Add</strong>. The icon will be named <strong>jari Cashier</strong> and will open this Cashier POS terminal directly.</span>
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
      </main>

      {/* Mobile-Friendly Footer */}
      <footer className="border-t border-[#E6DEBA]/60 bg-white py-2.5 px-4 text-center text-[11px] text-neutral-400">
        jari POS Terminal • Real-Time Sync with Customer Pass
      </footer>
    </div>
  );
}
