import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "jari Digital Loyalty Pass",
  description: "jari Coffee House & Pastry Digital Loyalty Pass & Rewards",
  applicationName: "jari Pass",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "jari Pass",
  },
  manifest: "/manifest.json",
};

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
