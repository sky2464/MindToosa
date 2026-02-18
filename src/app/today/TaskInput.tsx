"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const TaskInput = ({ spaceId }: { spaceId: string }) => {
    const [title, setTitle] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

            const task = {
                title,
                scheduled_for: today,
                priority: "normal",
                space_id: spaceId,
            };

            // Hack: Create a default space first if none? Or rely on default.
            // Oh right, spaces table exists. Goals table exists.
            // I need a valid space_id.
            // For now, I'll hardcode a spaceId? Or fetch one?
            // "Confirm Supabase tables (`spaces`...) exist".
            // If the user has no spaces, this will fail.
            // The PM update mentions "Frontend Integration (Connect UI to API)".
            // If I create a task without a space, the constraints will fail (`space_id uuid NOT NULL`).

            // For MVP/testing, maybe create a "General" space if not exists?
            // Or fetch existing spaces.

            // Let's first try to fetch a space. If none, create one.
            // But this is client-side.
            // I'll assume for now I can create a space via API or just use a placeholder UUID if the backend handles it?
            // No, verify schema: `space_id uuid references spaces(id)`. It MUST exist.

            // So I need to fetch spaces first.
            // I'll add logic to create a default space on the server if none exists when loading the page?
            // Or just fetch spaces in this component.

            // Let's keep it simple: assume the backend handles default space creation or the user has one.
            // Wait, I should probably check for spaces in the page component.

            // Moving back to page.tsx logic:
            // 1. Fetch user's spaces.
            // 2. If none, create a default "General" space.
            // 3. Pass the default space ID to TaskInput.

            // So TaskInput will accept `spaceId` as a prop.

            const res = await fetch("/api/tasks", {
                method: "POST",
                body: JSON.stringify(task),
                headers: { "Content-Type": "application/json" }
            });

            if (!res.ok) {
                const error = await res.json();
                console.error("Failed to add task", error);
                alert("Failed code: " + res.status);
                return;
            }

            setTitle("");
            router.refresh(); // Tells Next.js to re-fetch server components
        } catch (error) {
            console.error("Failed to add task", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
            <h3 className="text-sm font-semibold mb-2">Add New Task</h3>
            <div className="flex gap-2">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="What needs to be done?"
                    className="flex-1 p-2 border rounded text-sm disabled:opacity-50"
                    disabled={loading}
                />
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                    disabled={loading || !title.trim()}
                >
                    {loading ? "Adding..." : "Add"}
                </button>
            </div>
        </form>
    );
};

export default TaskInput;
