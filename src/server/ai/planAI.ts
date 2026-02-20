import { GoogleGenAI } from "@google/genai";
import { env } from "@/server/env";
import { DailyPlanSchema, DailyPlan, Task, Goal } from "@/core/planTypes";
import { ApiError, ValidationError } from "@/lib/errors";
import { sanitizeLLMInput, sanitizeLLMArray } from "@/lib/sanitize";

const MODEL = "gemini-2.0-flash";

function getClient(): GoogleGenAI {
  if (!env.AI_PROVIDER_API_KEY) {
    throw new ApiError("AI_PROVIDER_API_KEY is not set.", 500, "MISSING_CONFIG");
  }
  return new GoogleGenAI({ apiKey: env.AI_PROVIDER_API_KEY });
}

export interface PlanContext {
  date: string;
  constraints: string[];
  timeAvailableMinutes: number;
  existingTasks: Task[];
  activeGoals: Goal[];
  notes?: string;
}

export const planAI = {
  async generateDailyPlan(context: PlanContext): Promise<DailyPlan> {
    const ai = getClient();

    const safeNotes = sanitizeLLMInput(context.notes ?? "");
    const safeConstraints = sanitizeLLMArray(context.constraints);
    const safeGoalTitles = sanitizeLLMArray(
      context.activeGoals.map((g) => `${g.title} (${g.horizon || "general"})`)
    );
    const safeTaskTitles = sanitizeLLMArray(
      context.existingTasks.map((t) => `${t.title} (${t.status})`)
    );

    const prompt = `
You are an expert productivity coach. Create a realistic daily plan for me.

Context:
- Date: ${context.date}
- Time Available: ${context.timeAvailableMinutes} minutes
- Constraints: ${safeConstraints.join("; ")}
- User Notes: ${safeNotes || "None"}

Goals:
${safeGoalTitles.length > 0 ? safeGoalTitles.map((t) => `- ${t}`).join("\n") : "No specific goals set."}

Existing Tasks:
${safeTaskTitles.length > 0 ? safeTaskTitles.map((t) => `- ${t}`).join("\n") : "No existing tasks."}

Rules:
1. Select up to 3 Must-Do tasks.
2. Select up to 4 Optional tasks.
3. Break down each task into 3-7 micro-steps.
4. Estimate realistic minutes (default 25).
5. Ensure the total time does not exceed Time Available.
6. Return ONLY valid JSON matching this schema:

{
  "date": "YYYY-MM-DD",
  "mustDo": [ { "title": "...", "estimated_minutes": 25, "priority": "must_do", "micro_steps": ["step 1", ...], "space_id": "placeholder-uuid" } ],
  "optional": [ { "title": "...", "priority": "optional", "space_id": "placeholder-uuid", ... } ],
  "constraints": ["..."],
  "notes": "..."
}
`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        config: { responseMimeType: "application/json", responseSchema: DailyPlanSchema },
        contents: prompt,
      });
      const json = JSON.parse(response.text ?? "");
      const parsed = DailyPlanSchema.safeParse(json);
      if (!parsed.success) {
        throw new ValidationError("Failed to parse LLM response: " + parsed.error.issues[0].message);
      }
      return parsed.data;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ApiError("Failed to generate plan.", 500, "LLM_GENERATION_FAILED");
    }
  },

  async suggestSubtasks(taskTitle: string): Promise<string[]> {
    if (!env.AI_PROVIDER_API_KEY) return ["Analyze requirements", "Draft outline", "Review and refine"];

    const ai = getClient();
    const prompt = `Break down the task "${taskTitle}" into 3-5 actionable micro-steps. Return ONLY a JSON array of strings. Example: ["Step 1", "Step 2"]`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        config: { responseMimeType: "application/json" },
        contents: prompt,
      });
      const json = JSON.parse(response.text ?? "[]");
      return Array.isArray(json) ? json : ["Define requirements", "Execute task", "Verify output"];
    } catch {
      return ["Define requirements", "Execute task", "Verify output"];
    }
  },
  async breakdownProject(title: string, description: string, scope: string): Promise<Partial<Task>[]> {
    if (!env.AI_PROVIDER_API_KEY) {
      // Mock fallback if no API key
      return [
        { title: "Define Requirements", estimated_minutes: 30 },
        { title: "Initial Implementation", estimated_minutes: 60 },
        { title: "Review and Refine", estimated_minutes: 30 }
      ];
    }

    const ai = getClient();
    const safeTitle = sanitizeLLMInput(title);
    const safeDesc = sanitizeLLMInput(description);
    const safeScope = sanitizeLLMInput(scope);

    const prompt = `You are an expert project manager. Break down the following project into actionable tasks.
Project Title: ${safeTitle}
Description: ${safeDesc || "None"}
Scope/Context: ${safeScope || "None"}

Rules:
1. Return ONLY a valid JSON array of task objects.
2. Each object MUST have:
   - "title" (string, clear actionable task name)
   - "estimated_minutes" (integer, duration, default 25 or 50)
   - "micro_steps" (array of strings, further breakdown of the task)
3. Do not include markdown formatting or json code blocks, just the raw JSON.
Example output:
[{"title": "Setup repository", "estimated_minutes": 25, "micro_steps": ["git init", "npm install"]}]`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        config: { responseMimeType: "application/json" },
        contents: prompt,
      });
      const text = response.text ?? "[]";
      const cleanJson = text.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const json = JSON.parse(cleanJson);
      return Array.isArray(json) ? json : [];
    } catch {
      return [];
    }
  },
};
