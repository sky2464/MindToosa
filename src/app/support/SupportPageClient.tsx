"use client";

import { useState } from "react";
import { ContactCard } from "@/components/ContactCard";
import { Mail, Github, Heart, MessageCircle } from "lucide-react";

export default function SupportPageClient() {
  const [formData, setFormData] = useState({
    email: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus("idle");

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitStatus("success");
        setFormData({ email: "", subject: "", message: "" });
        setTimeout(() => setSubmitStatus("idle"), 5000);
      } else {
        setSubmitStatus("error");
        setTimeout(() => setSubmitStatus("idle"), 5000);
      }
    } catch (error) {
      setSubmitStatus("error");
      setTimeout(() => setSubmitStatus("idle"), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Contact Us</h2>
        <div className="space-y-4">
          <ContactCard
            icon={Mail}
            title="Email Support"
            description="Send us an email with your question or feedback."
            href="mailto:support@mindtoosa.com"
          />
          <ContactCard
            icon={Github}
            title="GitHub Discussions"
            description="Join the community and discuss ideas on our GitHub repository."
            href="https://github.com/mindtoosa"
            external
          />
          <ContactCard
            icon={Heart}
            title="Feature Requests"
            description="Share your ideas for improving MindToosa. We read every suggestion."
            href="https://github.com/mindtoosa/issues"
            external
          />
        </div>
      </section>

      {/* Support Form */}
      <section className="mb-16">
        <h2 className="mb-6 text-2xl font-bold text-foreground">Send us a Message</h2>
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 max-w-2xl">
          <div className="mb-6">
            <label htmlFor="email" className="block mb-2 font-semibold text-foreground">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="subject" className="block mb-2 font-semibold text-foreground">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="How can we help?"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="message" className="block mb-2 font-semibold text-foreground">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="w-full px-4 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              placeholder="Tell us what's on your mind..."
            />
          </div>

          {submitStatus === "success" && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
              ✓ Message sent! Thank you for reaching out. We'll get back to you soon.
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
              ✗ Something went wrong. Please try again or email us directly.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="mb-6 text-2xl font-bold text-foreground">Frequently Asked Questions</h2>
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <div>
            <h3 className="font-semibold text-foreground mb-2">How quickly will I get a response?</h3>
            <p className="text-muted-foreground">
              We aim to respond to all support requests within 24 hours. For urgent issues, please mention "URGENT" in the subject line.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Do you offer phone support?</h3>
            <p className="text-muted-foreground">
              Currently we support email and GitHub discussions. If you need a call, mention it in your message and we'll arrange a time.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Can I report a bug directly?</h3>
            <p className="text-muted-foreground">
              Yes! Use the support form or email us with as much detail as possible: what you were doing, what happened, and what you expected.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">Is there a status page?</h3>
            <p className="text-muted-foreground">
              We monitor MindToosa 24/7. For real-time status updates, follow our <a href="https://github.com/mindtoosa" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">GitHub</a>.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
