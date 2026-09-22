import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "jari Cashier POS Terminal",
  description: "Point of Sale & Loyalty Scanner for jari Staff",
  applicationName: "jari Cashier",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "jari Cashier",
  },
  icons: {
    apple: [
      { url: "/apple-touch-icon-cashier.png", sizes: "180x180", type: "image/png" },
    ],
    icon: [
      { url: "/icon-cashier-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-cashier-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  manifest: "/manifest-cashier.json",
  other: {
    "application-name": "jari Cashier POS",
  },
};

export default function CashierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
