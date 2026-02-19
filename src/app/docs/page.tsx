import type { Metadata } from "next";
import { DocSection } from "@/components/DocSection";

export const metadata: Metadata = {
  title: "Documentation — MindToosa",
  description: "Learn how to use MindToosa. Comprehensive guides for all features.",
};

export default function DocsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8 md:ml-16">
      <div className="max-w-4xl">
        <h1 className="mb-2 text-4xl font-bold text-foreground">Documentation</h1>
        <p className="mb-12 text-muted-foreground">Detailed guides and documentation for every feature in MindToosa.</p>

        <DocSection title="Getting Started" id="getting-started">
          <p>MindToosa is a focus-friendly planning app built for deep work. Sign in with your Google account to get started, then create your first task in the <strong>Today</strong> view.</p>
          <p>The app has three main planning horizons:</p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Today</strong> — Daily tasks and focus sessions</li>
            <li><strong>Week</strong> — Weekly overview and planning</li>
            <li><strong>Goals</strong> — Long-term objectives and north stars</li>
          </ul>
        </DocSection>

        <DocSection title="Today View" id="today">
          <p>The <strong>Today</strong> view is your daily command center. Here you'll find all your tasks for the current day and can start focus sessions.</p>
          <h4 className="font-semibold text-foreground mt-4">Creating Tasks</h4>
          <p>Click the "+" button to create a new task. Fill in the title, select a priority level (Low, Medium, High), and optionally assign it to a project or space. Tasks appear in your list immediately.</p>
          <h4 className="font-semibold text-foreground mt-4">Focus Sessions</h4>
          <p>Click on any task to open it, then click "Start Focus" to begin a timed session. The default is 25 minutes (standard Pomodoro), but you can customize this in settings. When the timer ends, take a break and mark your session complete.</p>
          <h4 className="font-semibold text-foreground mt-4">Task Status</h4>
          <p>Tasks show as pending, in-progress, or completed. Drag to reorder or click the checkbox to mark complete. Completed tasks move to the bottom and can be archived.</p>
        </DocSection>

        <DocSection title="Week View" id="week">
          <p>The <strong>Week</strong> view gives you a bird's-eye view of your commitments across all seven days. Use this to balance your workload and ensure you're making progress toward your goals.</p>
          <h4 className="font-semibold text-foreground mt-4">Planning Your Week</h4>
          <p>Spend 10-15 minutes each Sunday (or whenever you plan) reviewing the week ahead. Check your Goals, then distribute key tasks across the week. This helps avoid bottlenecks and ensures progress on important work.</p>
          <h4 className="font-semibold text-foreground mt-4">Capacity Planning</h4>
          <p>The week view shows your task density per day. A balanced week has roughly 5-8 tasks per day. If a day is overloaded, move tasks to other days or defer them to next week.</p>
        </DocSection>

        <DocSection title="Goals" id="goals">
          <p>The <strong>Goals</strong> section is for your north stars—the big-picture objectives that guide your planning. These are typically 3-12 month ambitions.</p>
          <h4 className="font-semibold text-foreground mt-4">Creating Goals</h4>
          <p>Click "New Goal" and give it a clear, measurable title. Add a description explaining why it matters. Link related tasks from your daily/weekly views to track progress.</p>
          <h4 className="font-semibold text-foreground mt-4">Goal Tracking</h4>
          <p>Each goal shows a progress percentage based on completed linked tasks. Review goals weekly to ensure your daily work aligns with your bigger picture.</p>
        </DocSection>

        <DocSection title="Projects" id="projects">
          <p>Projects are initiatives with multiple tasks, typically lasting weeks or months. Use the Kanban board to organize work into stages (To Do, In Progress, Done).</p>
          <h4 className="font-semibold text-foreground mt-4">Creating a Project</h4>
          <p>Go to <strong>Projects</strong>, click "New Project", and give it a name. Add a description and set a target completion date. Then create tasks within the project.</p>
          <h4 className="font-semibold text-foreground mt-4">Kanban Board</h4>
          <p>Drag tasks between columns to update their status. The board automatically updates project progress. You can also customize columns to match your workflow.</p>
          <h4 className="font-semibold text-foreground mt-4">Progress Tracking</h4>
          <p>Each project shows overall completion percentage and key metrics. Use this to communicate progress to stakeholders and stay motivated.</p>
        </DocSection>

        <DocSection title="Spaces" id="spaces">
          <p>Spaces are contexts or categories for organizing work. Think of them as folders—you might have "Work", "Personal", "Learning", or "Side Hustles".</p>
          <h4 className="font-semibold text-foreground mt-4">Creating and Managing Spaces</h4>
          <p>Go to <strong>Spaces</strong> and click "New Space". Give it a name and optional emoji icon. All tasks and projects can be assigned to a space, making them easy to filter and find.</p>
          <h4 className="font-semibold text-foreground mt-4">Filtering by Space</h4>
          <p>Use the space filter in Today or Week view to focus on one context. This helps you batch similar work and reduce context switching.</p>
        </DocSection>

        <DocSection title="Focus Timer" id="focus">
          <p>The Focus Timer is a Pomodoro-style tool built into every task. It helps you work in focused sprints and track time spent on work.</p>
          <h4 className="font-semibold text-foreground mt-4">Starting a Focus Session</h4>
          <p>Click "Start Focus" on any task. The timer will count down. By default, a session is 25 minutes, but you can adjust this in <strong>Settings</strong>. During a session, notifications are silenced (optional).</p>
          <h4 className="font-semibold text-foreground mt-4">Sessions and Streaks</h4>
          <p>Each completed focus session counts toward your daily streak and total session count. Build momentum by completing consecutive days of focused work.</p>
        </DocSection>

        <DocSection title="Settings" id="settings">
          <p>Customize your MindToosa experience in the <strong>Settings</strong> view.</p>
          <h4 className="font-semibold text-foreground mt-4">Available Settings</h4>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Focus Duration</strong> — Set default session length (default: 25 min)</li>
            <li><strong>Break Duration</strong> — Set break length between sessions (default: 5 min)</li>
            <li><strong>Notifications</strong> — Toggle timer alerts and task reminders</li>
            <li><strong>Theme</strong> — Choose between dark/light mode (default: dark)</li>
            <li><strong>Email Digests</strong> — Receive weekly summaries of progress</li>
          </ul>
        </DocSection>

        <DocSection title="Keyboard Shortcuts" id="shortcuts">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-foreground font-semibold">Action</th>
                <th className="text-left py-3 px-4 text-foreground font-semibold">Shortcut</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="py-3 px-4">Quick search</td>
                <td className="py-3 px-4"><code className="bg-background px-2 py-1 rounded border border-border">Cmd/Ctrl + K</code></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4">Add new task</td>
                <td className="py-3 px-4"><code className="bg-background px-2 py-1 rounded border border-border">Cmd/Ctrl + N</code></td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-3 px-4">Start focus session</td>
                <td className="py-3 px-4"><code className="bg-background px-2 py-1 rounded border border-border">Space</code></td>
              </tr>
              <tr>
                <td className="py-3 px-4">Complete task</td>
                <td className="py-3 px-4"><code className="bg-background px-2 py-1 rounded border border-border">Enter</code></td>
              </tr>
            </tbody>
          </table>
        </DocSection>

        <DocSection title="Tips &amp; Best Practices" id="tips">
          <h4 className="font-semibold text-foreground">Daily Ritual</h4>
          <p>Start each day by reviewing your tasks and identifying your top 3. This sets intention and reduces decision fatigue.</p>
          
          <h4 className="font-semibold text-foreground mt-4">Weekly Planning</h4>
          <p>Spend 15 minutes every Sunday reviewing goals, planning the week, and ensuring work aligns with priorities.</p>
          
          <h4 className="font-semibold text-foreground mt-4">Batch Similar Work</h4>
          <p>Use Spaces to group related tasks. Then filter by Space to focus on one context, reducing context switching overhead.</p>
          
          <h4 className="font-semibold text-foreground mt-4">Build Focus Streaks</h4>
          <p>Consistency matters. Aim for at least one focus session every day. The streak counter provides motivation and accountability.</p>
          
          <h4 className="font-semibold text-foreground mt-4">Archive Completed Work</h4>
          <p>Keep your views clean by archiving completed tasks. This maintains focus on what's current and important.</p>
        </DocSection>
      </div>
    </main>
  );
}
