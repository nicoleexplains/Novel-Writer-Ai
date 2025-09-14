// Defining the core data structures for the application.
export interface Character {
  id: string;
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

export interface Chapter {
  id: string;
  title: string;
  content: string;
  summary?: string;
}

export interface NovelVersion {
  timestamp: number;
  novel: Omit<Novel, 'versionHistory'>;
}

export interface Novel {
  id: string;
  title: string;
  outline: PlotPoint[];
  characters: Character[];
  chapters: Chapter[];
  versionHistory: NovelVersion[];
}
