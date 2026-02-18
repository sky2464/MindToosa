import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AmbientBackground from "@/components/AmbientBackground";
import NavBar from "@/components/NavBar";

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
  description: "Focus-friendly planning and execution webapp. Create daily plans, track goals, and run focus sprints.",
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
        <div className="pb-16 md:pb-0">
          {children}
        </div>
      </body>
    </html>
  );
}
