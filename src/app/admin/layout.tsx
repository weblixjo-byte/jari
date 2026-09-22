import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "jari Admin Dashboard",
  description: "jari Executive Admin Dashboard",
  applicationName: "jari Admin",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "jari Admin",
  },
  manifest: "/manifest-admin.json",
  other: {
    "application-name": "jari Admin Dashboard",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
