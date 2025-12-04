import { GoogleGenAI, Type } from "@google/genai";
import { TaskBreakdown, Priority } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const breakDownGoal = async (goal: string): Promise<TaskBreakdown | null> => {
  if (!apiKey) {
    console.error("API Key is missing");
    return null;
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Break down the following goal into 3-6 actionable subtasks with time estimates (in minutes) and priority levels: "${goal}". Keep tasks concise.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subtasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  estimatedMinutes: { type: Type.INTEGER },
                  priority: { type: Type.STRING, enum: [Priority.HIGH, Priority.MEDIUM, Priority.LOW] }
                },
                required: ["title", "estimatedMinutes", "priority"]
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as TaskBreakdown;
    }
    return null;
  } catch (error) {
    console.error("Error breaking down goal:", error);
    return null;
  }
};

export const suggestEncouragement = async (completedCount: number): Promise<string> => {
  if (!apiKey) return "Great job! Keep going!";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Give me a short, witty, and motivating one-sentence compliment for someone who just completed their ${completedCount}th task of the day.`,
    });
    return response.text || "You're on fire!";
  } catch (e) {
    return "Great job! Keep going!";
  }
}
