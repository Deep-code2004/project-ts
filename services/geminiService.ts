
import { GoogleGenAI } from "@google/genai";
import { AgentRole } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set. Please set it in your .env file or environment.');
}
const ai = new GoogleGenAI({ apiKey });

const SYSTEM_PROMPTS = {
  [AgentRole.IDEA]: `Generate 1 innovative concept. 50 words max.`,

  [AgentRole.CRITIC]: `List 3 key risks/issues in bullet points.`,

  [AgentRole.REFINER]: `Improve concept with feedback. 75 words max.`,

  [AgentRole.PRESENTER]: `Write executive summary: Overview, Strategy, Impact, Next Steps. 100 words max.`
};

export async function runAgentStep(
  role: AgentRole,
  userPrompt: string,
  context?: string,
  domain?: string
): Promise<string> {
  const model = "gemini-1.5-flash";

  let fullPrompt = `Domain: ${domain || 'General'}\n\nUser Goal: ${userPrompt}\n\n`;
  if (context) {
    fullPrompt += `Previous Process Context:\n${context}\n\n`;
  }

  fullPrompt += "Task: Execute your specific role for this context.";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: fullPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPTS[role],
        temperature: 0.0,
        topP: 0.8,
        maxOutputTokens: 200,
      }
    });

    return response.text || "No output generated.";
  } catch (error) {
    console.error(`Error in ${role} agent:`, error);
    throw error;
  }
}
