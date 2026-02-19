import type { Metadata } from "next";
import SupportPageClient from "./SupportPageClient";

export const metadata: Metadata = {
  title: "Support — MindToosa",
  description: "Get in touch with our support team. We're here to help.",
};

export default function SupportPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8 md:ml-16">
      <div className="max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-foreground">Support</h1>
        <p className="mb-12 text-muted-foreground">Get in touch with us. We're here to help.</p>
        <SupportPageClient />
      </div>
    </main>
  );
}
