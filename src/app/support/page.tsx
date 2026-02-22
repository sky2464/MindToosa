import type { Metadata } from "next";
import SupportPageClient from "./SupportPageClient";

export const metadata: Metadata = {
  title: "Support — MindToosa",
  description: "Get in touch with our support team. We're here to help.",
};

export default function SupportPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div>
        <h1 className="text-foreground mb-2 text-4xl font-bold">Support</h1>
        <p className="text-muted-foreground mb-12">Get in touch with us. We're here to help.</p>
        <SupportPageClient />
      </div>
    </div>
  );
}
