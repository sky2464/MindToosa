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
        <h2 className="text-foreground mb-6 text-2xl font-bold">Contact Us</h2>
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
        <h2 className="text-foreground mb-6 text-2xl font-bold">Send us a Message</h2>
        <form
          onSubmit={handleSubmit}
          className="bg-card border-border max-w-2xl rounded-lg border p-8"
        >
          <div className="mb-6">
            <label htmlFor="email" className="text-foreground mb-2 block font-semibold">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="bg-background border-border text-foreground placeholder-muted-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="subject" className="text-foreground mb-2 block font-semibold">
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="bg-background border-border text-foreground placeholder-muted-foreground focus:ring-primary w-full rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              placeholder="How can we help?"
            />
          </div>

          <div className="mb-6">
            <label htmlFor="message" className="text-foreground mb-2 block font-semibold">
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              required
              rows={6}
              className="bg-background border-border text-foreground placeholder-muted-foreground focus:ring-primary w-full resize-none rounded-lg border px-4 py-2 focus:ring-2 focus:outline-none"
              placeholder="Tell us what's on your mind..."
            />
          </div>

          {submitStatus === "success" && (
            <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-green-400">
              ✓ Message sent! Thank you for reaching out. We'll get back to you soon.
            </div>
          )}

          {submitStatus === "error" && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-red-400">
              ✗ Something went wrong. Please try again or email us directly.
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-primary text-primary-foreground rounded-lg px-6 py-2 font-semibold transition-colors hover:bg-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Send Message"}
          </button>
        </form>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="text-foreground mb-6 text-2xl font-bold">Frequently Asked Questions</h2>
        <div className="bg-card border-border space-y-6 rounded-lg border p-6">
          <div>
            <h3 className="text-foreground mb-2 font-semibold">
              How quickly will I get a response?
            </h3>
            <p className="text-muted-foreground">
              We aim to respond to all support requests within 24 hours. For urgent issues, please
              mention "URGENT" in the subject line.
            </p>
          </div>
          <div>
            <h3 className="text-foreground mb-2 font-semibold">Do you offer phone support?</h3>
            <p className="text-muted-foreground">
              Currently we support email and GitHub discussions. If you need a call, mention it in
              your message and we'll arrange a time.
            </p>
          </div>
          <div>
            <h3 className="text-foreground mb-2 font-semibold">Can I report a bug directly?</h3>
            <p className="text-muted-foreground">
              Yes! Use the support form or email us with as much detail as possible: what you were
              doing, what happened, and what you expected.
            </p>
          </div>
          <div>
            <h3 className="text-foreground mb-2 font-semibold">Is there a status page?</h3>
            <p className="text-muted-foreground">
              We monitor MindToosa 24/7. For real-time status updates, follow our{" "}
              <a
                href="https://github.com/mindtoosa"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
