import type { Metadata } from "next";
import { FaqItem } from "@/components/FaqItem";

export const metadata: Metadata = {
  title: "Help — MindToosa",
  description: "Get help with MindToosa. FAQs, keyboard shortcuts, and getting started guides.",
};

export default function HelpPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8 md:ml-16">
      <div className="max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-foreground">Help Center</h1>
        <p className="mb-12 text-muted-foreground">Find answers, guides, and tips to get the most out of MindToosa.</p>

        {/* Getting Started */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Getting Started</h2>
          <div className="space-y-4">
            <FaqItem
              question="What is MindToosa?"
              answer={
                <p>
                  MindToosa is a focus-friendly planning and execution webapp designed for deep work. It combines daily planning, weekly overviews, goal tracking, and focused sprints with a Pomodoro-style timer to help you accomplish your most important tasks.
                </p>
              }
            />
            <FaqItem
              question="How do I create my first task?"
              answer={
                <div className="space-y-3">
                  <p>
                    Navigate to the <strong>Today</strong> section and click the "+" button to add a new task. Give it a title, set a priority level, and optionally assign it to a project or space. Tasks appear in your daily view where you can track progress.
                  </p>
                </div>
              }
            />
            <FaqItem
              question="What's the difference between Today, Week, and Goals?"
              answer={
                <div className="space-y-3">
                  <p>
                    <strong>Today</strong> shows your daily tasks and focus sessions. <strong>Week</strong> gives you a bird's-eye view of your commitments across the week. <strong>Goals</strong> is for long-term objectives and north stars that guide your planning.
                  </p>
                </div>
              }
            />
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Features Explained</h2>
          <div className="space-y-4">
            <FaqItem
              question="How does the Focus Timer work?"
              answer={
                <div className="space-y-3">
                  <p>
                    The Focus Timer (Pomodoro-style) is built into your tasks. Start a focus session to enter a distraction-free timer. You can customize session duration. When a session ends, take a break and track your progress.
                  </p>
                </div>
              }
            />
            <FaqItem
              question="What are Spaces?"
              answer={
                <div className="space-y-3">
                  <p>
                    Spaces are contexts or categories for organizing your work—like "Work", "Personal", "Learning". Create spaces to group related tasks and projects for easier navigation.
                  </p>
                </div>
              }
            />
            <FaqItem
              question="How do Projects work?"
              answer={
                <div className="space-y-3">
                  <p>
                    Projects are larger initiatives with multiple tasks. View all project tasks in a Kanban board, track overall progress, and organize work into stages (e.g., To Do, In Progress, Done).
                  </p>
                </div>
              }
            />
            <FaqItem
              question="Can I use MindToosa on mobile?"
              answer={
                <div className="space-y-3">
                  <p>
                    Yes! MindToosa is fully responsive. On mobile, navigation appears at the bottom for easy thumb access. All features are available on your phone or tablet.
                  </p>
                </div>
              }
            />
          </div>
        </section>

        {/* Shortcuts */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-bold text-foreground">Keyboard Shortcuts</h2>
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-foreground">Quick search</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-muted-foreground">Cmd/Ctrl + K</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Add new task</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-muted-foreground">Cmd/Ctrl + N</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Start focus session</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-muted-foreground">Space</kbd>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-foreground">Complete task</span>
                <kbd className="px-2 py-1 bg-background border border-border rounded text-muted-foreground">Enter</kbd>
              </div>
            </div>
          </div>
        </section>

        {/* Tips */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-foreground">Pro Tips</h2>
          <div className="space-y-4">
            <FaqItem
              question="How do I stay focused?"
              answer={
                <p>
                  Set a daily goal, break it into 3-5 key tasks, and use focus sessions to eliminate distractions. MindToosa's minimalist design helps you stay on track.
                </p>
              }
            />
            <FaqItem
              question="Should I plan my week every Sunday?"
              answer={
                <p>
                  Yes! Spend 10-15 minutes every Sunday reviewing the Week view, adjusting goals, and creating a rough outline. This ensures your daily plans align with bigger objectives.
                </p>
              }
            />
          </div>
        </section>
      </div>
    </main>
  );
}
