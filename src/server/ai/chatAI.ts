import { GoogleGenAI } from "@google/genai";
import { env } from "@/server/env";
import { Task, Project } from "@/core/planTypes";
import { sanitizeLLMInput, sanitizeLLMArray } from "@/lib/sanitize";

const MODEL = "gemini-2.0-flash";

function getClient(): GoogleGenAI | null {
  if (!env.AI_PROVIDER_API_KEY) return null;
  return new GoogleGenAI({ apiKey: env.AI_PROVIDER_API_KEY });
}

export interface ProjectContext {
  project: Project;
  tasks: Task[];
}

export const chatAI = {
  async chatWithProject(context: ProjectContext, message: string): Promise<string> {
    const ai = getClient();
    if (!ai) return "I can only help if the API Key is set.";

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
    } catch {
      return "Sorry, I couldn't process your request.";
    }
  },
};
