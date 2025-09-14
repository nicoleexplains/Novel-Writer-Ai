import React, { useState, useRef } from 'react';
import type { Novel, Chapter } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon } from './icons';
import { generateChapterContent } from '../services/geminiService';

interface ManuscriptViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
}

const AiHelperModal: React.FC<{
  novel: Novel;
  selectedChapter: Chapter;
  onClose: () => void;
  onInsert: (text: string) => void;
  onReplace: (text: string) => void;
  wordCount: number;
  previousPlotPointSummary: string | null;
}> = ({ novel, selectedChapter, onClose, onInsert, onReplace, wordCount, previousPlotPointSummary }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [tone, setTone] = useState('');
  const [generatedText, setGeneratedText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    setGeneratedText('');
    try {
      const novelContext = {
        title: novel.title,
        outline: novel.outline,
        characters: novel.characters,
        currentContent: selectedChapter.content,
        currentWordCount: wordCount,
        previousPlotPointSummary: previousPlotPointSummary,
        tone: tone,
      };
      const result = await generateChapterContent(aiPrompt, novelContext);
      setGeneratedText(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  const handleCopy = () => {
      if(navigator.clipboard) {
        navigator.clipboard.writeText(generatedText);
      }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-slate-700">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <SparklesIcon /> AI Writing Assistant
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
        </header>
        
        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div>
            <label htmlFor="ai-prompt" className="block text-sm font-medium text-slate-300 mb-2">Your Request</label>
            <textarea
              id="ai-prompt"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Continue the story, focusing on the detective's inner conflict."
            />
          </div>
          <div>
            <label htmlFor="ai-tone" className="block text-sm font-medium text-slate-300 mb-2">Tone / Style (Optional)</label>
            <input
              id="ai-tone"
              type="text"
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="e.g., Suspenseful, humorous, formal"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !aiPrompt}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating...' : 'Generate Text'}
          </button>
          
          {error && <p className="text-sm text-red-400" role="alert">{error}</p>}
          
          {generatedText && (
            <div className="space-y-2">
               <label className="block text-sm font-medium text-slate-300">Preview</label>
               <div className="bg-slate-900 p-4 rounded-md border border-slate-700 max-h-60 overflow-y-auto">
                 <p className="text-slate-300 whitespace-pre-wrap font-serif">{generatedText}</p>
               </div>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">Close</button>
             {generatedText && (
                 <>
                    <button onClick={handleCopy} className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">Copy</button>
                    <button onClick={() => { onReplace(generatedText); onClose(); }} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-500">Replace All</button>
                    <button onClick={() => { onInsert(generatedText); onClose(); }} className="px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-500">Insert at Cursor</button>
                 </>
             )}
        </footer>
      </div>
    </div>
  );
};


export const ManuscriptView: React.FC<ManuscriptViewProps> = ({ novel, setNovel }) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(
    novel.chapters[0]?.id || null
  );
  const [isAiHelperOpen, setIsAiHelperOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const selectedChapter = novel.chapters.find(c => c.id === selectedChapterId);

  const wordCount = selectedChapter?.content
    ? selectedChapter.content.trim().split(/\s+/).filter(Boolean).length
    : 0;
    
  let previousPlotPointSummary: string | null = null;
  if (selectedChapter) {
      const chapterIndex = novel.chapters.findIndex(c => c.id === selectedChapter.id);
      if (chapterIndex > 0 && novel.outline[chapterIndex - 1]) {
          const prevPlotPoint = novel.outline[chapterIndex - 1];
          previousPlotPointSummary = `Title: ${prevPlotPoint.title}\nDescription: ${prevPlotPoint.description}`;
      }
  }

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
    const updatedChapters = novel.chapters.filter(c => c.id !== id);
    const updatedNovel = { ...novel, chapters: updatedChapters };
    setNovel(updatedNovel);
    if (selectedChapterId === id) {
      setSelectedChapterId(updatedChapters[0]?.id || null);
    }
  };

  const handleChapterChange = (field: 'title' | 'content', value: string) => {
    if (!selectedChapterId) return;

    const updatedChapters = novel.chapters.map(c =>
      c.id === selectedChapterId ? { ...c, [field]: value } : c
    );
    setNovel({ ...novel, chapters: updatedChapters });
  };
  
  const handleInsertText = (text: string) => {
    if (!selectedChapter || !textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    
    const currentContent = selectedChapter.content;
    const newContent = 
      currentContent.substring(0, start) + 
      text + 
      currentContent.substring(end);
      
    handleChapterChange('content', newContent);
    
    setTimeout(() => {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };
  
  const handleReplaceText = (text: string) => {
      if (!selectedChapter) return;
      handleChapterChange('content', text);
  };

  return (
    <div className="flex h-full">
      {/* Chapter List */}
      <aside className="w-1/4 h-full bg-slate-800/50 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Chapters</h2>
          <button
            onClick={handleAddChapter}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
            aria-label="Add new chapter"
          >
            <PlusIcon />
          </button>
        </div>
        <ul>
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
                <span className="truncate">{chapter.title}</span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Editor */}
      <main className="w-3/4 h-full flex flex-col">
        {selectedChapter ? (
          <>
            <div className="p-4 border-b border-slate-700 flex justify-between items-center gap-4">
              <input
                type="text"
                value={selectedChapter.title}
                onChange={e => handleChapterChange('title', e.target.value)}
                className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
                placeholder="Chapter Title"
              />
              <div className="flex items-center flex-shrink-0 gap-2">
                 <button
                    onClick={() => setIsAiHelperOpen(true)}
                    className="p-2 rounded-md text-slate-400 hover:bg-emerald-500/20 hover:text-emerald-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500"
                    aria-label="AI Writing Assistant"
                 >
                    <SparklesIcon />
                 </button>
                 <button
                    onClick={() => handleDeleteChapter(selectedChapter.id)}
                    className="p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
                    aria-label="Delete chapter"
                 >
                    <TrashIcon />
                 </button>
              </div>
            </div>
            <textarea
              ref={textareaRef}
              value={selectedChapter.content}
              onChange={e => handleChapterChange('content', e.target.value)}
              className="flex-grow w-full p-6 bg-slate-900 text-slate-300 resize-none focus:outline-none leading-relaxed text-lg font-serif"
              placeholder="Start writing your story..."
            />
            <footer className="p-2 border-t border-slate-700 text-right text-sm text-slate-400 flex-shrink-0">
              <span>Word Count: {wordCount}</span>
            </footer>
          </>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>Select a chapter or create a new one to begin.</p>
          </div>
        )}
      </main>
      {isAiHelperOpen && selectedChapter && (
        <AiHelperModal
            novel={novel}
            selectedChapter={selectedChapter}
            onClose={() => setIsAiHelperOpen(false)}
            onInsert={handleInsertText}
            onReplace={handleReplaceText}
            wordCount={wordCount}
            previousPlotPointSummary={previousPlotPointSummary}
        />
      )}
    </div>
  );
};