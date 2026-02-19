import { GoogleGenAI } from "@google/genai";
import { env } from "./env";
import { DailyPlanSchema, DailyPlan, Task, Goal, Project } from "@/core/planTypes";
import { ApiError, ValidationError } from "@/lib/errors";
import { sanitizeLLMInput, sanitizeLLMArray } from "@/lib/sanitize";

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

function getClient(): GoogleGenAI {
  if (!env.AI_PROVIDER_API_KEY) {
    throw new ApiError("AI_PROVIDER_API_KEY is not set.", 500, "MISSING_CONFIG");
  }
  return new GoogleGenAI({ apiKey: env.AI_PROVIDER_API_KEY });
}

const MODEL = "gemini-2.0-flash";

export const llmClient = {
  async generateDailyPlan(context: PlanContext): Promise<DailyPlan> {
    const ai = getClient();

    // Sanitize all user-supplied strings before interpolation to prevent prompt injection
    const safeNotes = sanitizeLLMInput(context.notes ?? "");
    const safeConstraints = sanitizeLLMArray(context.constraints);
    const safeGoalTitles = sanitizeLLMArray(context.activeGoals.map((g) => `${g.title} (${g.horizon || "general"})`));
    const safeTaskTitles = sanitizeLLMArray(context.existingTasks.map((t) => `${t.title} (${t.status})`));

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
        config: {
          responseMimeType: "application/json",
          responseSchema: DailyPlanSchema, // Optional: if SDK supports Zod schema directly, otherwise just JSON mode
        },
        contents: prompt,
      });
      const text = response.text ?? "";

      // With JSON mode, we don't need regex cleaning usually, but safe to keep a simple parse
      const json = JSON.parse(text);
      const parsed = DailyPlanSchema.safeParse(json);

      if (!parsed.success) {
        console.error("LLM Validation Error:", JSON.stringify(parsed.error.format(), null, 2));
        throw new ValidationError("Failed to parse LLM response: " + parsed.error.issues[0].message);
      }

      return parsed.data;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      console.error("LLM Generation Error:", error);
      throw new ApiError("Failed to generate plan.", 500, "LLM_GENERATION_FAILED");
    }
  },

  async suggestSubtasks(taskTitle: string): Promise<string[]> {
    if (!env.AI_PROVIDER_API_KEY)
      return ["Analyze requirements", "Draft outline", "Review and refine"];

    const ai = getClient();

    const prompt = `Break down the task "${taskTitle}" into 3-5 actionable micro-steps. Return ONLY a JSON array of strings. Example: ["Step 1", "Step 2"]`;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        config: {
          responseMimeType: "application/json",
        },
        contents: prompt,
      });
      const text = response.text ?? "[]";
      const json = JSON.parse(text);

      if (!Array.isArray(json)) {
        return ["Define requirements", "Execute task", "Verify output"];
      }
      return json;
    } catch (error) {
      console.error("Error suggesting subtasks:", error);
      return ["Define requirements", "Execute task", "Verify output"];
    }
  },

  async chatWithProject(context: ProjectContext, message: string): Promise<string> {
    if (!env.AI_PROVIDER_API_KEY) return "I can only help if the API Key is set.";

    const ai = getClient();

    // Sanitize user-supplied message and project data
    const safeMessage = sanitizeLLMInput(message, 1000);
    const safeTitle = sanitizeLLMInput(context.project.title);
    const safeDescription = sanitizeLLMInput(context.project.description ?? "N/A");
    const safeTasks = sanitizeLLMArray(context.tasks.map((t) => `${t.title} (${t.status})`));

    const systemPrompt = `
        You are a project assistant for the project "${safeTitle}".
        Description: ${safeDescription}
        Status: ${context.project.status}

        Tasks:
        ${safeTasks.map((t) => `- ${t}`).join("\n")}

        Answer the user's question accurately based on this context. Keep answers concise.
        `;

    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents: systemPrompt + "\n\nUser Question: " + safeMessage,
      });
      return response.text ?? "Sorry, I couldn't process your request.";
    } catch (error) {
      console.error("Error chatting with project:", error);
      return "Sorry, I couldn't process your request.";
    }
  },
};
