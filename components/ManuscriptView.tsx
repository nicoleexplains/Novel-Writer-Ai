import React, { useState, useMemo } from 'react';
// Fix: Corrected import path for types.
import type { Novel, Chapter } from '../types';
import { generateChapterDraft, generateChapterTitles, generateChapterContent, summarizeChapter } from '../services/geminiService';
// Fix: Corrected import path for icons.
import { PlusIcon, TrashIcon, SparklesIcon, QuillIcon, LightBulbIcon, DocumentTextIcon, ChevronDownIcon, ChevronUpIcon } from './icons';

interface ManuscriptViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
}

const TitleSuggestionModal: React.FC<{
  suggestions: string[];
  onSelect: (title: string) => void;
  onClose: () => void;
}> = ({ suggestions, onSelect, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-100">AI Title Suggestions</h3>
           <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
        </header>
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <ul className="space-y-2">
            {suggestions.map((title, index) => (
              <li key={index}>
                <button
                  onClick={() => onSelect(title)}
                  className="w-full text-left p-3 rounded-md bg-slate-700/50 hover:bg-indigo-600/50 transition-colors"
                >
                  {title}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <footer className="p-4 border-t border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">
            Cancel
          </button>
        </footer>
      </div>
    </div>
  );
};

const ChapterDraftModal: React.FC<{
  novel: Novel;
  chapter: Chapter;
  onClose: () => void;
  onReplace: (content: string) => void;
  onAppend: (content: string) => void;
}> = ({ novel, chapter, onClose, onReplace, onAppend }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setGeneratedDraft(null);
    try {
      const chapterIndex = novel.chapters.findIndex(c => c.id === chapter.id);
      const correspondingPlotPoint = novel.outline[chapterIndex];
      const previousPlotPoint = chapterIndex > 0 ? novel.outline[chapterIndex - 1] : null;
      
      const novelContext = {
        title: novel.title,
        chapterTitle: chapter.title,
        outline: novel.outline,
        characters: novel.characters,
        currentContent: chapter.content,
        previousPlotPointSummary: previousPlotPoint ? `${previousPlotPoint.title}: ${previousPlotPoint.description}` : null,
        currentPlotPointSummary: correspondingPlotPoint ? `${correspondingPlotPoint.title}: ${correspondingPlotPoint.description}` : null,
      };
      const draft = await generateChapterDraft(novelContext);
      setGeneratedDraft(draft);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReplace = () => {
    if (generatedDraft) {
      onReplace(generatedDraft);
    }
  };

  const handleAppend = () => {
    if (generatedDraft) {
      const newContent = chapter.content 
        ? `${chapter.content}\n\n${generatedDraft}`
        : generatedDraft;
      onAppend(newContent);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl border border-slate-700 max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2"><QuillIcon /> AI Chapter Draft</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto min-h-[20rem]">
          {generatedDraft === null && !isGenerating && !error && (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <SparklesIcon className="h-12 w-12 text-indigo-400 mb-4" />
              <h4 className="text-xl font-semibold text-slate-200">Draft Your Chapter</h4>
              <p className="text-slate-400 mt-2 max-w-md">
                Generate a draft for this chapter based on your novel's outline, characters, and existing chapter content.
              </p>
              <button onClick={handleGenerate} className="mt-6 px-6 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors">
                Generate Draft
              </button>
            </div>
          )}
          {isGenerating && (
            <div className="text-center flex flex-col items-center justify-center h-full">
              <SparklesIcon className="h-12 w-12 text-indigo-400 animate-pulse mb-4" />
              <p className="text-slate-300">Generating draft... This may take a moment.</p>
            </div>
          )}
          {error && (
             <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 rounded-md">
               <h5 className="font-bold">Generation Failed</h5>
               <p>{error}</p>
             </div>
          )}
          {generatedDraft && (
            <div className="space-y-3 h-full flex flex-col">
              <h4 className="text-md font-semibold text-slate-300">Generated Draft Preview:</h4>
              <textarea
                readOnly
                value={generatedDraft}
                className="w-full h-full flex-grow bg-slate-900 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-0 focus:border-slate-600 resize-none"
              />
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">
            {generatedDraft ? 'Discard' : 'Cancel'}
          </button>
          {generatedDraft && (
            <>
              <button onClick={handleAppend} className="px-4 py-2 rounded-md font-semibold text-white bg-emerald-600 hover:bg-emerald-500">
                Append to Chapter
              </button>
              <button onClick={handleReplace} className="px-4 py-2 rounded-md font-semibold text-white bg-indigo-600 hover:bg-indigo-500">
                Replace Chapter Content
              </button>
            </>
          )}
        </footer>
      </div>
    </div>
  );
};


const ChapterEditor: React.FC<{
  chapter: Chapter;
  novel: Novel;
  onUpdate: (id: string, field: keyof Omit<Chapter, 'id' | 'summary'>, value: string) => void;
  onDelete: (id: string) => void;
  onOpenDraftModal: () => void;
}> = ({ chapter, novel, onUpdate, onDelete, onOpenDraftModal }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [tone, setTone] = useState('');
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isSuggestingTitles, setIsSuggestingTitles] = useState(false);
  const [suggestedTitles, setSuggestedTitles] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const wordCount = useMemo(() => chapter.content.split(/\s+/).filter(Boolean).length, [chapter.content]);
  
  const chapterIndex = novel.chapters.findIndex(c => c.id === chapter.id);
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

  const handleSuggestTitles = async () => {
    if (!chapter.content) {
      alert("Please write some content before suggesting titles.");
      return;
    }
    setIsSuggestingTitles(true);
    setError(null);
    try {
      const titles = await generateChapterTitles(novel.title, chapter.content);
      setSuggestedTitles(titles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSuggestingTitles(false);
    }
  };

  const handleSelectTitle = (title: string) => {
    onUpdate(chapter.id, 'title', title);
    setSuggestedTitles(null);
  };

  return (
    <div className="flex h-full">
      {suggestedTitles && (
        <TitleSuggestionModal 
          suggestions={suggestedTitles}
          onSelect={handleSelectTitle}
          onClose={() => setSuggestedTitles(null)}
        />
      )}
      <div className="flex-grow flex flex-col overflow-y-auto">
        <div className="p-6 flex-shrink-0 flex justify-between items-center border-b border-slate-700 gap-4">
            <div className="flex-grow flex items-center gap-2">
              <input
                type="text"
                value={chapter.title}
                onChange={(e) => onUpdate(chapter.id, 'title', e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
                placeholder="Chapter Title"
              />
              <button
                onClick={handleSuggestTitles}
                disabled={isSuggestingTitles || !chapter.content}
                className="p-2 rounded-full text-slate-400 hover:bg-indigo-500/30 hover:text-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                aria-label="Suggest titles with AI"
                title={!chapter.content ? "Write some content to get title suggestions" : "Suggest titles"}
              >
                {isSuggestingTitles ? <SparklesIcon className="h-5 w-5 animate-spin" /> : <LightBulbIcon className="h-5 w-5" />}
              </button>
              <button
                onClick={onOpenDraftModal}
                className="p-2 rounded-full text-slate-400 hover:bg-indigo-500/30 hover:text-indigo-300 transition-colors flex-shrink-0"
                aria-label="Draft chapter with AI"
                title="Draft chapter with AI"
              >
                <QuillIcon className="h-5 w-5" />
              </button>
            </div>
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
        <div className="flex-shrink-0 p-3 border-t border-slate-700 flex justify-end items-center bg-slate-800/20">
          <span className="text-sm font-mono tracking-widest text-slate-500 uppercase">
            Words: {wordCount}
          </span>
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
        </div>
        {error && <div className="p-4 border-t border-red-500/50 bg-red-500/10 text-xs text-red-400">{error}</div>}
      </aside>
    </div>
  );
};

export const ManuscriptView: React.FC<ManuscriptViewProps> = ({ novel, setNovel }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(novel.chapters[0]?.id || null);
  const [summarizing, setSummarizing] = useState<Record<string, boolean>>({});
  const [expandedSummaries, setExpandedSummaries] = useState<Record<string, boolean>>({});
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  
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

  const handleChapterUpdate = (id: string, field: keyof Omit<Chapter, 'id' | 'summary'>, value: string) => {
    if (!selectedChapterId) return;

    const updatedChapters = novel.chapters.map(c =>
      c.id === id ? { ...c, [field]: value } : c
    );
    setNovel({ ...novel, chapters: updatedChapters });
  };

  const handleSummarizeChapter = async (chapterId: string) => {
    const chapter = novel.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.content) {
      alert('Chapter must have content to generate a summary.');
      return;
    }

    setSummarizing(prev => ({ ...prev, [chapterId]: true }));

    try {
      const summary = await summarizeChapter(chapter.title, chapter.content);
      const updatedChapters = novel.chapters.map(c => 
        c.id === chapterId ? { ...c, summary } : c
      );
      setNovel({ ...novel, chapters: updatedChapters });
      setExpandedSummaries(prev => ({ ...prev, [chapterId]: true })); // Auto-expand on generation
    } catch (error) {
      console.error("Failed to summarize chapter:", error);
      alert(error instanceof Error ? error.message : "An unknown error occurred during summarization.");
    } finally {
      setSummarizing(prev => ({ ...prev, [chapterId]: false }));
    }
  };

  const toggleSummary = (chapterId: string) => {
    setExpandedSummaries(prev => ({ ...prev, [chapterId]: !prev[chapterId] }));
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
            <li key={chapter.id} className={`border-b border-slate-800 transition-colors ${
              selectedChapterId === chapter.id
                ? 'bg-indigo-600/20'
                : 'hover:bg-slate-700/50'
            }`}>
              <div className="p-4">
                <div className="flex justify-between items-start gap-2">
                  <button
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className="flex-grow text-left focus:outline-none"
                  >
                    <p className={`font-semibold truncate ${selectedChapterId === chapter.id ? 'text-indigo-300' : 'text-slate-300'}`}>
                      {chapter.title}
                    </p>
                    <p className="text-sm text-slate-400 truncate mt-1">
                      {chapter.content.substring(0, 80).replace(/\s+/g, ' ')}...
                    </p>
                  </button>
                  <div className="flex-shrink-0 flex items-center">
                    <button
                      onClick={() => handleSummarizeChapter(chapter.id)}
                      disabled={summarizing[chapter.id] || !chapter.content}
                      className="p-1.5 rounded-md text-slate-400 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Generate summary"
                    >
                      {summarizing[chapter.id] 
                        ? <SparklesIcon className="h-5 w-5 animate-pulse" /> 
                        : <DocumentTextIcon className="h-5 w-5" />
                      }
                    </button>
                    {chapter.summary && (
                      <button
                        onClick={() => toggleSummary(chapter.id)}
                        className="p-1.5 rounded-md text-slate-400 hover:bg-slate-600"
                        title={expandedSummaries[chapter.id] ? "Collapse summary" : "Expand summary"}
                      >
                        {expandedSummaries[chapter.id] ? <ChevronUpIcon /> : <ChevronDownIcon />}
                      </button>
                    )}
                  </div>
                </div>
                {expandedSummaries[chapter.id] && chapter.summary && (
                  <div className="mt-3 pt-3 border-t border-slate-700/60">
                    <h4 className="text-xs font-bold text-slate-400 uppercase mb-1">Summary</h4>
                    <p className="text-sm text-slate-300 whitespace-pre-wrap">
                      {chapter.summary}
                    </p>
                  </div>
                )}
              </div>
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
             onOpenDraftModal={() => setIsDraftModalOpen(true)}
           />
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>Select a chapter or create a new one to begin.</p>
          </div>
        )}
      </main>
      
      {isDraftModalOpen && selectedChapter && (
        <ChapterDraftModal
          novel={novel}
          chapter={selectedChapter}
          onClose={() => setIsDraftModalOpen(false)}
          onReplace={(content) => {
            handleChapterUpdate(selectedChapter.id, 'content', content);
            setIsDraftModalOpen(false);
          }}
          onAppend={(content) => {
            handleChapterUpdate(selectedChapter.id, 'content', content);
            setIsDraftModalOpen(false);
          }}
        />
      )}
    </div>
  );
};
