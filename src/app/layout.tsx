import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AmbientBackground from "@/components/AmbientBackground";
import NavBar from "@/components/NavBar";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MindToosa — Planning for Deep Flow",
  description:
    "Focus-friendly planning and execution webapp. Create daily plans, track goals, and run focus sprints.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <AmbientBackground />
        <NavBar />
        <main className="pb-16 md:pb-0 md:pl-16">{children}</main>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
