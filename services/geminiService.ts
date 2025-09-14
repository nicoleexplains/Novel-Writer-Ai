import { GoogleGenAI, Type } from "@google/genai";
import { Character, PlotPoint, Novel } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCharacter = async (prompt: string): Promise<Omit<Character, 'id'>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a detailed character profile based on this prompt: "${prompt}". Provide a name, age, appearance, backstory, personality, and their role in the story.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "The character's full name." },
            age: { type: Type.STRING, description: "The character's age (can be a number or a description like 'ancient')." },
            appearance: { type: Type.STRING, description: "A detailed description of the character's physical appearance." },
            backstory: { type: Type.STRING, description: "The character's history and background." },
            personality: { type: Type.STRING, description: "The character's key personality traits and temperament." },
            roleInStory: { type: Type.STRING, description: "The character's role in the narrative (e.g., protagonist, antagonist, mentor)." }
          },
          required: ["name", "age", "appearance", "backstory", "personality", "roleInStory"],
        },
      },
    });
    const jsonString = response.text.trim();
    const characterData = JSON.parse(jsonString);
    return characterData as Omit<Character, 'id'>;
  } catch (error) {
    console.error("Error generating character:", error);
    throw new Error("Failed to generate character profile from AI.");
  }
};

export const generateOutline = async (prompt: string): Promise<Omit<PlotPoint, 'id'>[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Generate a story outline with distinct plot points based on this prompt: "${prompt}". Each plot point should have a clear title and a detailed description.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "A concise title for the plot point." },
              description: { type: Type.STRING, description: "A detailed description of the events in this plot point." },
            },
            required: ["title", "description"],
          }
        }
      }
    });

    const jsonString = response.text.trim();
    const outlineData = JSON.parse(jsonString);
    return outlineData as Omit<PlotPoint, 'id'>[];
  } catch (error) {
    console.error("Error generating outline:", error);
    throw new Error("Failed to generate story outline from AI.");
  }
};

export const generateChapterContent = async (
  prompt: string, 
  novelContext: { 
    title: string; 
    outline: PlotPoint[]; 
    characters: Character[]; 
    currentContent: string;
    currentWordCount: number;
    previousPlotPointSummary: string | null;
    tone: string;
  }
): Promise<string> => {
  const contextPrompt = `
    You are an AI writing assistant helping a novelist. Your task is to generate text that fits seamlessly into their story.
    Novel Title: ${novelContext.title}

    Characters:
    ${novelContext.characters.map(c => `- ${c.name}: ${c.personality}. Role: ${c.roleInStory}`).join('\n') || 'No characters defined yet.'}

    Story Outline:
    ${novelContext.outline.map(p => `- ${p.title}: ${p.description}`).join('\n') || 'No outline defined yet.'}

    ${novelContext.previousPlotPointSummary ? `Context from Previous Plot Point:\n${novelContext.previousPlotPointSummary}\n` : ''}

    Current Chapter Progress:
    - Word Count: ${novelContext.currentWordCount}
    - Content So Far:
    ---
    ${novelContext.currentContent || "(This is the beginning of the chapter.)"}
    ---

    ${novelContext.tone ? `Desired Tone/Style: ${novelContext.tone}\n` : ''}
    Based on all the context above, please fulfill the user's request: "${prompt}"

    Generate ONLY the requested story text. Do not add any commentary, introductions, or extra formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating chapter content:", error);
    throw new Error("Failed to generate chapter content from AI.");
  }
};