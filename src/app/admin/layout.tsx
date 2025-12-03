import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hope United Admin",
  manifest: "/admin.manifest.webmanifest",
  appleWebApp: {
    title: "Admin",
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
