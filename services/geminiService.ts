import { GoogleGenAI, Type } from "@google/genai";
import { Character, PlotPoint, Novel } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateCharacter = async (
  descriptionPrompt: string,
  rolePrompt: string,
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
    The following is the plot of the story. The new character must have a role that makes sense within this plot.
    ${novelContext.outline.map(p => `- ${p.title}: ${p.description}`).join('\n') || 'No outline defined yet.'}

    **Existing Characters Context:**
    ${novelContext.characters.map(c => `- ${c.name}: ${c.personality}. Role: ${c.roleInStory}`).join('\n') || 'No other characters defined yet.'}

    ---

    **User's Request:**
    *   **Character Description:** "${descriptionPrompt}"
    *   **Intended Role in Story:** "${rolePrompt}"

    ---

    **Your Task:**
    Based on the user's request and the provided novel context (title, outline, and existing characters), generate a detailed profile for the new character.

    **Requirements for the new character:**
    1.  **Role in Story:** This is the most important part. Your primary goal is to flesh out the user's "Intended Role in Story" idea. Expand upon it and make it concrete by explicitly connecting it to specific plot points from the "Story Outline". For example, if the user wants an antagonist, explain *how* they trigger the inciting incident mentioned in the outline. The final role must be integral to the provided plot.
    2.  **Personality & Backstory:** Ensure their personality and backstory are a perfect fit for the role you've defined.
    3.  **Uniqueness:** The character must not duplicate the core traits or roles of existing characters.

    Provide a name, age, appearance, backstory, personality, and their specific, detailed role in the story.
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
            backstory: { type: Type.STRING, description: "The character's history and background, justifying their role." },
            personality: { type: Type.STRING, description: "The character's key personality traits and temperament." },
            roleInStory: { type: Type.STRING, description: "The character's specific role in the narrative, explicitly linked to the plot outline." }
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
    You are an AI writing assistant helping a novelist draft a chapter. Your task is to generate a compelling draft that fits perfectly within the story's context.

    **Novel Title:** ${novelContext.title}
    **Chapter to Draft:** "${novelContext.chapterTitle}"

    **Key Context for this Chapter:**

    1.  **Primary Goal (from the outline):** This chapter must accomplish the following:
        ${novelContext.currentPlotPointSummary ? `${novelContext.currentPlotPointSummary}` : 'This chapter does not have a specific plot point assigned. Use the overall story context to guide its content.'}

    2.  **Author's Progress So Far:** You must build upon or continue directly from the text the author has already written:
        ---
        ${novelContext.currentContent || "(The chapter is currently empty. You will be writing the beginning.)"}
        ---

    3.  **Leading Events (Previous Chapter's Context):** The story is coming from this point:
        ${novelContext.previousPlotPointSummary || 'This is an early chapter, so establish the initial scene.'}

    **Supporting Context:**

    *   **Characters Involved:**
        ${novelContext.characters.map(c => `- ${c.name}: ${c.personality}. Role: ${c.roleInStory}`).join('\n') || 'No characters defined yet.'}

    *   **Overall Story Arc (Full Outline):**
        ${novelContext.outline.map(p => `- ${p.title}`).join('\n') || 'No outline defined yet.'}

    **Your Task:**
    Based *specifically* on the **Key Context** provided above (the chapter's goal, the author's current text, and the previous events), write a comprehensive and engaging draft for the chapter "${novelContext.chapterTitle}". Use the supporting context (characters, full outline) to ensure consistency.

    The draft should be well-paced and true to the established characters. If there is existing content, your draft must create a seamless continuation.

    **Output Rules:**
    - Generate ONLY the story text for the draft.
    - Do not add any commentary, headings, or introductions like "Here is the draft:".
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

export const summarizeChapter = async (
  chapterTitle: string,
  chapterContent: string
): Promise<string> => {
  if (!chapterContent) {
    return "Chapter is empty.";
  }

  const contentForPrompt = chapterContent.length > 8000
    ? `${chapterContent.substring(0, 8000)}... (content truncated)`
    : chapterContent;

  const contextPrompt = `
    You are an expert AI editor. Your task is to provide a concise, one-paragraph summary of the following book chapter.
    The summary should capture the key events, character developments, and plot advancements.

    Chapter Title: "${chapterTitle}"

    Chapter Content:
    ---
    ${contentForPrompt}
    ---

    Your Task:
    Generate a single, well-written paragraph summarizing the chapter.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contextPrompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error generating chapter summary:", error);
    throw new Error("Failed to generate chapter summary from AI.");
  }
};