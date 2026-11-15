import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BuildLab · Hydraulic Robotic Arm",
  description: "A bilingual, step-by-step learning guide for a cardboard hydraulic robotic arm.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="vi"><body>{children}</body></html>;
}
