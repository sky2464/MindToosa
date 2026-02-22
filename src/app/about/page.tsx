import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About — MindToosa",
  description: "Learn about MindToosa, our mission, and the vision behind deep focus planning.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
      <div>
        <h1 className="text-foreground mb-2 text-4xl font-bold">About MindToosa</h1>
        <p className="text-muted-foreground mb-12">
          Our mission and vision for deep, focused work.
        </p>

        {/* Mission */}
        <section className="mb-16">
          <h2 className="text-foreground mb-4 text-2xl font-bold">Our Mission</h2>
          <p className="text-foreground leading-relaxed">
            MindToosa exists to help knowledge workers reclaim focus and build momentum. We believe
            that deep work is the most valuable kind of work, but it's under constant threat from
            distractions, poor planning, and context switching.
          </p>
          <p className="text-foreground mt-4 leading-relaxed">
            Our mission is to provide a planning tool that makes focus the default—not a struggle.
            By combining daily planning, weekly overviews, and focused work sessions, we help you
            accomplish your most important work.
          </p>
        </section>

        {/* Vision */}
        <section className="mb-16">
          <h2 className="text-foreground mb-4 text-2xl font-bold">Our Vision</h2>
          <p className="text-foreground leading-relaxed">
            We envision a world where professionals can sustain deep focus without burnout, where
            planning is a joy rather than a chore, and where productivity tools are designed for
            humans—not for maximizing engagement metrics.
          </p>
          <p className="text-foreground mt-4 leading-relaxed">
            MindToosa is built for quality over quantity. We measure success not by time spent in
            the app, but by progress toward meaningful goals and the quality of work produced.
          </p>
        </section>

        {/* Core Values */}
        <section className="mb-16">
          <h2 className="text-foreground mb-6 text-2xl font-bold">Core Values</h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Focus First</h3>
              <p className="text-muted-foreground">
                Every design decision prioritizes deep work. We eliminate distractions and noise.
                The UI is intentionally minimal so it gets out of your way.
              </p>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Simplicity &amp; Clarity</h3>
              <p className="text-muted-foreground">
                We believe less is more. Complex features dilute focus. We carefully curate what
                goes into MindToosa to keep it simple and effective.
              </p>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Privacy &amp; Ownership</h3>
              <p className="text-muted-foreground">
                Your data is yours. We don't sell it, mine it, or use it for ads. We believe you
                should have full control and transparency over your information.
              </p>
            </div>
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Respecting Your Time</h3>
              <p className="text-muted-foreground">
                We're intentionally designed to be quick and efficient. MindToosa respects your
                time—every interaction counts, and nothing is bloated.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features */}
        <section className="mb-16">
          <h2 className="text-foreground mb-6 text-2xl font-bold">Why MindToosa</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-3 font-semibold">🎯 Three-Horizon Planning</h3>
              <p className="text-muted-foreground text-sm">
                Plan across today, this week, and long-term goals. Align daily work with bigger
                objectives.
              </p>
            </div>
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-3 font-semibold">⏱️ Built-in Focus Timer</h3>
              <p className="text-muted-foreground text-sm">
                Start Pomodoro-style sessions directly from tasks. Track focus streaks and build
                momentum.
              </p>
            </div>
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-3 font-semibold">📊 Smart Project Kanban</h3>
              <p className="text-muted-foreground text-sm">
                Visualize project progress with intuitive Kanban boards. Customize columns to match
                your workflow.
              </p>
            </div>
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-3 font-semibold">🗂️ Context Spaces</h3>
              <p className="text-muted-foreground text-sm">
                Organize work by context (Work, Personal, Learning). Filter and focus on one space
                at a time.
              </p>
            </div>
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-3 font-semibold">📱 Responsive Design</h3>
              <p className="text-muted-foreground text-sm">
                Plan and execute on desktop, tablet, or phone. Mobile-first design for busy
                professionals.
              </p>
            </div>
            <div className="bg-card border-border rounded-lg border p-6">
              <h3 className="text-foreground mb-3 font-semibold">🔒 Privacy First</h3>
              <p className="text-muted-foreground text-sm">
                Your data is encrypted and never sold. We're transparent about how we handle your
                information.
              </p>
            </div>
          </div>
        </section>

        {/* Team */}
        <section>
          <h2 className="text-foreground mb-6 text-2xl font-bold">Built by Makers</h2>
          <p className="text-foreground mb-6 leading-relaxed">
            MindToosa was built by a small team of makers who use it every day. We're committed to
            deep work ourselves and believe in practicing what we preach.
          </p>
          <p className="text-foreground leading-relaxed">
            We're always learning and improving. If you have feedback, ideas, or questions, we'd
            love to hear from you. You can reach out through our{" "}
            <a href="/support" className="text-primary hover:underline">
              Support page
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
