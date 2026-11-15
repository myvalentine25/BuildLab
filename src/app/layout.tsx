import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildLab",
  description: "A hands-on hydraulic arm learning guide",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body>{children}</body>
    </html>
  );
}
