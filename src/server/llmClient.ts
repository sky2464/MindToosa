import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "./env";
import { DailyPlanSchema, DailyPlan, Task, Goal, Project } from "@/core/planTypes";

export interface PlanContext {
    date: string;
    constraints: string[];
    timeAvailableMinutes: number;
    existingTasks: Task[];
    activeGoals: Goal[];
    notes?: string;
}

export interface ProjectContext {
    project: Project;
    tasks: Task[];
}

export const llmClient = {
    async generateDailyPlan(context: PlanContext): Promise<DailyPlan> {
        if (!env.AI_PROVIDER_API_KEY) throw new Error("AI_PROVIDER_API_KEY is not set.");

        const genAI = new GoogleGenerativeAI(env.AI_PROVIDER_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `
        You are an expert productivity coach. Create a realistic daily plan for me.
        
        Context:
        - Date: ${context.date}
        - Time Available: ${context.timeAvailableMinutes} minutes
        - Constraints: ${context.constraints.join("; ")}
        - User Notes: ${context.notes || "None"}
        
        Goals:
        ${context.activeGoals.length > 0 ? context.activeGoals.map(g => `- ${g.title} (${g.horizon || 'general'})`).join("\n") : "No specific goals set."}
        
        Existing Tasks:
        ${context.existingTasks.length > 0 ? context.existingTasks.map(t => `- ${t.title} (${t.status})`).join("\n") : "No existing tasks."}
        
        Rules:
        1. Select up to 3 Must-Do tasks.
        2. Select up to 4 Optional tasks.
        3. Break down each task into 3-7 micro-steps.
        4. Estimate realistic minutes (default 25).
        5. Ensure the total time does not exceed Time Available.
        6. Return ONLY valid JSON matching this schema:
        
        {
          "date": "YYYY-MM-DD",
          "mustDo": [ { "title": "...", "estimated_minutes": 25, "priority": "must_do", "micro_steps": ["step 1", ...] } ],
          "optional": [ { "title": "...", "priority": "optional", ... } ],
          "constraints": ["..."],
          "notes": "..."
        }
        `;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            const json = JSON.parse(cleanText);
            const parsed = DailyPlanSchema.safeParse(json);

            if (!parsed.success) {
                console.error("LLM Validation Error:", JSON.stringify(parsed.error.format(), null, 2));
                throw new Error("Failed to parse LLM response: " + parsed.error.issues[0].message);
            }

            return parsed.data;

        } catch (error) {
            console.error("LLM Generation Error:", error);
            throw new Error("Failed to generate plan.");
        }
    },

    async suggestSubtasks(taskTitle: string): Promise<string[]> {
        if (!env.AI_PROVIDER_API_KEY) return ["Analyze requirements", "Draft outline", "Review and refine"];

        const genAI = new GoogleGenerativeAI(env.AI_PROVIDER_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const prompt = `Break down the task "${taskTitle}" into 3-5 actionable micro-steps. Return ONLY a JSON array of strings. Example: ["Step 1", "Step 2"]`;

        try {
            const result = await model.generateContent(prompt);
            const text = result.response.text();
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
            return JSON.parse(cleanText);
        } catch (error) {
            console.error("Error suggesting subtasks:", error);
            return ["Define requirements", "Execute task", "Verify output"];
        }
    },

    async chatWithProject(context: ProjectContext, message: string): Promise<string> {
        if (!env.AI_PROVIDER_API_KEY) return "I can only help if the API Key is set.";

        const genAI = new GoogleGenerativeAI(env.AI_PROVIDER_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
        You are a project assistant for the project "${context.project.title}".
        Description: ${context.project.description || "N/A"}
        Status: ${context.project.status}

        Tasks:
        ${context.tasks.map(t => `- ${t.title} (${t.status})`).join("\n")}

        Answer the user's question accurately based on this context. Keep answers concise.
        `;

        try {
            const result = await model.generateContent(systemPrompt + "\n\nUser Question: " + message);
            return result.response.text();
        } catch (error) {
            console.error("Error chatting with project:", error);
            return "Sorry, I couldn't process your request.";
        }
    }
};
