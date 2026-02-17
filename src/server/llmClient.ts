import { createGenAI } from "@google/genai";
import { env } from "./env";
import { DailyPlanSchema, DailyPlan, Task, Goal } from "@/core/planTypes";

export interface PlanContext {
    date: string;
    constraints: string[];
    timeAvailableMinutes: number;
    existingTasks: Task[];
    activeGoals: Goal[];
    notes?: string;
}

export const llmClient = {
    async generateDailyPlan(context: PlanContext): Promise<DailyPlan> {
        if (!env.AI_PROVIDER_API_KEY) {
            throw new Error("AI_PROVIDER_API_KEY is not set.");
        }

        const genAI = createGenAI({ apiKey: env.AI_PROVIDER_API_KEY });
        const model = "gemini-1.5-flash";

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
            const result = await genAI.models.generateContent({
                model,
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            });
            const text = result.response.text();

            console.log("LLM Raw Response:", text); // Debugging

            // Clean up code blocks if present
            const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();

            const json = JSON.parse(cleanText);

            // Validate with Zod
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
    }
};
