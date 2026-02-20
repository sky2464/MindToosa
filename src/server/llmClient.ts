/**
 * @deprecated Import from @/server/ai instead.
 * This barrel file remains for backward compatibility.
 */
import { planAI, chatAI } from "@/server/ai";
import type { PlanContext, ProjectContext } from "@/server/ai";

export type { PlanContext, ProjectContext };

export const llmClient = {
  generateDailyPlan: planAI.generateDailyPlan.bind(planAI),
  suggestSubtasks: planAI.suggestSubtasks.bind(planAI),
  breakdownProject: planAI.breakdownProject.bind(planAI),
  chatWithProject: chatAI.chatWithProject.bind(chatAI),
};
