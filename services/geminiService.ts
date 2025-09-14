import { GoogleGenAI, Type } from "@google/genai";
import { Character, PlotPoint, Novel } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCharacter = async (
  prompt: string,
  novelContext: {
    title: string;
    outline: PlotPoint[];
    characters: Character[];
  }
): Promise<Omit<Character, 'id'>> => {
  const contextPrompt = `
    As an AI writing assistant, your task is to create a compelling new character for a novel. It's crucial that this character fits logically within the existing story.

    **Novel Title:** ${novelContext.title}

    **Story Outline Context:**
    ${novelContext.outline.map(p => `- ${p.title}: ${p.description}`).join('\n') || 'No outline defined yet.'}

    **Existing Characters Context:**
    ${novelContext.characters.map(c => `- ${c.name}: ${c.personality}. Role: ${c.roleInStory}`).join('\n') || 'No other characters defined yet.'}

    ---

    **User's Request:** "${prompt}"

    ---

    **Your Task:**
    Based *heavily* on the context provided (title, outline, and existing characters), generate a detailed profile for the new character requested by the user. Ensure the new character:
    1. Has a role that complements the current plot.
    2. Possesses a personality that contrasts or aligns meaningfully with existing characters.
    3. Has a backstory that could logically intersect with the story's events.
    4. Avoids duplicating the roles or core traits of existing characters.

    Provide a name, age, appearance, backstory, personality, and their potential role in the story.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
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

export const generateChapterDraft = async (
  novelContext: {
    title: string;
    chapterTitle: string;
    outline: PlotPoint[];
    characters: Character[];
    currentContent: string;
    previousPlotPointSummary: string | null;
    currentPlotPointSummary: string | null;
  }
): Promise<string> => {
  const contextPrompt = `
    You are an AI writing assistant helping a novelist write a draft for a chapter.
    Your task is to generate a compelling chapter draft that fits seamlessly into the story.

    **Novel Title:** ${novelContext.title}

    **Characters:**
    ${novelContext.characters.map(c => `- ${c.name}: ${c.personality}. Role: ${c.roleInStory}`).join('\n') || 'No characters defined yet.'}

    **Overall Story Outline:**
    ${novelContext.outline.map(p => `- ${p.title}`).join('\n') || 'No outline defined yet.'}

    **Previous Chapter's Context:**
    ${novelContext.previousPlotPointSummary ? `The previous chapter likely covered:\n${novelContext.previousPlotPointSummary}\n` : 'This is an early chapter.'}

    **Current Chapter's Goal (based on outline):**
    ${novelContext.currentPlotPointSummary ? `${novelContext.currentPlotPointSummary}\n` : `This chapter, titled "${novelContext.chapterTitle}", does not have a specific corresponding plot point in the outline. Use the overall story context to guide its content.`}

    **Content written so far by the author (if any, continue from or incorporate it):**
    ---
    ${novelContext.currentContent || "(The chapter is currently empty.)"}
    ---

    **Your Task:**
    Based on all the context above, write a comprehensive draft for the chapter titled "${novelContext.chapterTitle}".
    The draft should be engaging, well-paced, and consistent with the characters and plot.
    If there's existing content, build upon it naturally to create a cohesive whole.

    Generate ONLY the story text for the draft. Do not add any commentary, headings, or introductions like "Here is the draft:".
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating chapter draft:", error);
    throw new Error("Failed to generate chapter draft from AI.");
  }
};

export const generateChapterTitles = async (
  novelTitle: string,
  chapterContent: string
): Promise<string[]> => {
  const contentForPrompt = chapterContent.length > 4000
    ? `${chapterContent.substring(0, 4000)}... (content truncated)`
    : chapterContent;

  const contextPrompt = `
    You are an AI writing assistant specializing in creating compelling titles.
    Based on the content of this chapter from the novel titled "${novelTitle}", generate 5 alternative, engaging titles.

    Chapter Content:
    ---
    ${contentForPrompt}
    ---

    Your Task:
    Generate a list of 5 creative and relevant chapter titles. The titles should be concise and hint at the chapter's key events or themes.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            titles: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "An array of 5 suggested chapter titles."
            }
          },
          required: ["titles"]
        },
      },
    });
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);
    return result.titles as string[];
  } catch (error) {
    console.error("Error generating chapter titles:", error);
    throw new Error("Failed to generate chapter titles from AI.");
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