import React, { useState, useMemo } from 'react';
import type { Novel, Chapter } from '../types';
import { generateChapterDraft, generateChapterTitles, generateChapterContent } from '../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, QuillIcon, LightBulbIcon } from './icons';

interface ManuscriptViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
}

const ChapterEditor: React.FC<{
  chapter: Chapter;
  novel: Novel;
  onUpdate: (id: string, field: keyof Omit<Chapter, 'id'>, value: string) => void;
  onDelete: (id: string) => void;
}> = ({ chapter, novel, onUpdate, onDelete }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [tone, setTone] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isSuggestingTitles, setIsSuggestingTitles] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => chapter.content.split(/\s+/).filter(Boolean).length, [chapter.content]);
  
  const chapterIndex = novel.chapters.findIndex(c => c.id === chapter.id);
  const correspondingPlotPoint = novel.outline[chapterIndex];
  const previousPlotPoint = chapterIndex > 0 ? novel.outline[chapterIndex - 1] : null;

  const handleGenerateContent = async () => {
    if (!aiPrompt) return;
    setIsGeneratingContent(true);
    setError(null);
    try {
      const novelContext = {
        title: novel.title,
        outline: novel.outline,
        characters: novel.characters,
        currentContent: chapter.content,
        currentWordCount: wordCount,
        previousPlotPointSummary: previousPlotPoint ? `${previousPlotPoint.title}: ${previousPlotPoint.description}` : null,
        tone: tone,
      };
      const newContent = await generateChapterContent(aiPrompt, novelContext);
      onUpdate(chapter.id, 'content', chapter.content ? `${chapter.content}\n\n${newContent}` : newContent);
      setAiPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingContent(false);
    }
  };

  const handleGenerateDraft = async () => {
    if (chapter.content && !window.confirm('This will replace the current chapter content. Are you sure?')) {
      return;
    }
    setIsGeneratingDraft(true);
    setError(null);
    try {
      const novelContext = {
        title: novel.title,
        chapterTitle: chapter.title,
        outline: novel.outline,
        characters: novel.characters,
        currentContent: '', // Start fresh
        previousPlotPointSummary: previousPlotPoint ? `${previousPlotPoint.title}: ${previousPlotPoint.description}` : null,
        currentPlotPointSummary: correspondingPlotPoint ? `${correspondingPlotPoint.title}: ${correspondingPlotPoint.description}` : null,
      };
      const draft = await generateChapterDraft(novelContext);
      onUpdate(chapter.id, 'content', draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  const handleSuggestTitles = async () => {
    if (!chapter.content) {
      alert("Please write some content before suggesting titles.");
      return;
    }
    setIsSuggestingTitles(true);
    setError(null);
    try {
      const titles = await generateChapterTitles(novel.title, chapter.content);
      const chosenTitle = prompt(`Suggested Titles:\n\n- ${titles.join('\n- ')}\n\nEnter a title below or cancel to keep the current one:`, titles[0]);
      if (chosenTitle) {
        onUpdate(chapter.id, 'title', chosenTitle);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSuggestingTitles(false);
    }
  };


  return (
    <div className="flex h-full">
      <div className="flex-grow flex flex-col overflow-y-auto">
        <div className="p-6 flex-shrink-0 flex justify-between items-start border-b border-slate-700">
          <input
            type="text"
            value={chapter.title}
            onChange={(e) => onUpdate(chapter.id, 'title', e.target.value)}
            className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
            placeholder="Chapter Title"
          />
          <button
            onClick={() => onDelete(chapter.id)}
            className="ml-4 p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            aria-label="Delete chapter"
          >
            <TrashIcon />
          </button>
        </div>
        <div className="flex-grow relative">
            <textarea
              value={chapter.content}
              onChange={(e) => onUpdate(chapter.id, 'content', e.target.value)}
              className="absolute inset-0 w-full h-full bg-slate-900 text-slate-200 p-6 resize-none focus:outline-none leading-relaxed"
              placeholder="Start writing your chapter here..."
            />
        </div>
        <div className="p-2 border-t border-slate-700 text-right text-xs text-slate-400">
            Word Count: {wordCount}
        </div>
      </div>
      <aside className="w-1/3 max-w-sm h-full bg-slate-800/50 border-l border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-slate-200">AI Writing Tools</h3>
        </div>
        <div className="flex-grow p-4 space-y-6 overflow-y-auto">
          <div>
            <h4 className="flex items-center gap-2 text-md font-semibold text-slate-300 mb-2">
              <QuillIcon className="h-5 w-5 text-indigo-400"/>
              Continue Writing
            </h4>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g., Describe the main character's reaction to the news."
              rows={3}
              className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <input
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="Optional: Specify tone (e.g., tense, humorous)"
              className="mt-2 w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={handleGenerateContent}
              disabled={isGeneratingContent || !aiPrompt}
              className="mt-2 w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:bg-slate-600"
            >
              <SparklesIcon />
              {isGeneratingContent ? 'Generating...' : 'Generate'}
            </button>
          </div>
          <div className="border-t border-slate-700"></div>
          <div>
            <h4 className="flex items-center gap-2 text-md font-semibold text-slate-300 mb-2">
              <SparklesIcon className="h-5 w-5 text-indigo-400"/>
              Generate Full Draft
            </h4>
            <p className="text-xs text-slate-400 mb-2">Uses chapter title and outline to generate a first draft. This will replace existing content.</p>
            <button
              onClick={handleGenerateDraft}
              disabled={isGeneratingDraft}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors disabled:bg-slate-600"
            >
              <SparklesIcon />
              {isGeneratingDraft ? 'Generating...' : 'Draft Chapter'}
            </button>
          </div>
          <div className="border-t border-slate-700"></div>
          <div>
            <h4 className="flex items-center gap-2 text-md font-semibold text-slate-300 mb-2">
              <LightBulbIcon className="h-5 w-5 text-indigo-400"/>
              Suggest Titles
            </h4>
            <p className="text-xs text-slate-400 mb-2">Analyzes chapter content to suggest alternative titles.</p>
            <button
              onClick={handleSuggestTitles}
              disabled={isSuggestingTitles || !chapter.content}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors disabled:bg-slate-600"
            >
              <LightBulbIcon />
              {isSuggestingTitles ? 'Suggesting...' : 'Suggest'}
            </button>
          </div>
        </div>
        {error && <div className="p-4 border-t border-red-500/50 bg-red-500/10 text-xs text-red-400">{error}</div>}
      </aside>
    </div>
  );
};

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({ novel, setNovel }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(novel.chapters[0]?.id || null);
  
  const selectedChapter = novel.chapters.find(c => c.id === selectedChapterId);

  const handleAddChapter = () => {
    const newChapter: Chapter = {
      id: Date.now().toString(),
      title: `Chapter ${novel.chapters.length + 1}`,
      content: '',
    };
    const updatedNovel = { ...novel, chapters: [...novel.chapters, newChapter] };
    setNovel(updatedNovel);
    setSelectedChapterId(newChapter.id);
  };
  
  const handleDeleteChapter = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this chapter?')) return;
    
    const updatedChapters = novel.chapters.filter(c => c.id !== id);
    const updatedNovel = { ...novel, chapters: updatedChapters };
    setNovel(updatedNovel);
    if (selectedChapterId === id) {
      setSelectedChapterId(updatedChapters[0]?.id || null);
    }
  };

  const handleChapterUpdate = (id: string, field: keyof Omit<Chapter, 'id'>, value: string) => {
    if (!selectedChapterId) return;

    const updatedChapters = novel.chapters.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setNovel({ ...novel, chapters: updatedChapters });
  };
  
  return (
    <div className="flex h-full">
      {/* Chapter List */}
      <aside className="w-1/3 max-w-xs h-full bg-slate-800/50 border-r border-slate-700 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Manuscript</h2>
          <button
            onClick={handleAddChapter}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
            aria-label="Add new chapter"
          >
            <PlusIcon />
          </button>
        </div>
        
        <ul className="flex-grow overflow-y-auto">
          {novel.chapters.map(chapter => (
            <li key={chapter.id}>
              <button
                onClick={() => setSelectedChapterId(chapter.id)}
                className={`w-full text-left p-4 ${
                  selectedChapterId === chapter.id
                    ? 'bg-indigo-600/30 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50'
                } transition-colors focus:outline-none focus:bg-slate-700/50`}
              >
                <p className="font-semibold truncate">{chapter.title}</p>
                <p className="text-sm text-slate-400 truncate">
                  {chapter.content.substring(0, 40).replace(/\s+/g, ' ')}...
                </p>
              </button>
            </li>
          ))}
          {novel.chapters.length === 0 && (
            <div className="p-4 text-center text-slate-500">
                <p>No chapters yet. Click the '+' button to add one.</p>
            </div>
          )}
        </ul>
      </aside>

      {/* Chapter Editor */}
      <main className="w-2/3 h-full flex flex-col">
        {selectedChapter ? (
          <ChapterEditor
             chapter={selectedChapter}
             novel={novel}
             onUpdate={handleChapterUpdate}
             onDelete={handleDeleteChapter}
           />
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>Select a chapter or create a new one to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};
