export enum View {
  MANUSCRIPT = 'MANUSCRIPT',
  CHARACTERS = 'CHARACTERS',
  OUTLINE = 'OUTLINE',
}

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Character {
  id:string;
  name: string;
  age: string;
  appearance: string;
  backstory: string;
  personality: string;
  roleInStory: string;
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
}

export interface Novel {
  title: string;
  chapters: Chapter[];
  characters: Character[];
  outline: PlotPoint[];
}