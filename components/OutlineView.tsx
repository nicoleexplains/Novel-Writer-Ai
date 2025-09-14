import React, { useState } from 'react';
import type { Novel, PlotPoint } from '../types';
import { generateOutline } from '../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon, ArrowUpIcon, ArrowDownIcon } from './icons';

interface OutlineViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
}

export const OutlineView: React.FC<OutlineViewProps> = ({ novel, setNovel }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddPlotPoint = () => {
    const newPlotPoint: PlotPoint = {
      id: Date.now().toString(),
      title: 'New Plot Point',
      description: '',
    };
    setNovel({ ...novel, outline: [...novel.outline, newPlotPoint] });
  };
  
  const handleGenerateOutline = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const outlineData = await generateOutline(aiPrompt);
      const newPlotPoints: PlotPoint[] = outlineData.map(p => ({ ...p, id: Date.now().toString() + Math.random() }));
      setNovel({ ...novel, outline: [...novel.outline, ...newPlotPoints] });
      setAiPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlotPointChange = (id: string, field: 'title' | 'description', value: string) => {
    const updatedOutline = novel.outline.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setNovel({ ...novel, outline: updatedOutline });
  };

  const handleDeletePlotPoint = (id: string) => {
    const updatedOutline = novel.outline.filter(p => p.id !== id);
    setNovel({ ...novel, outline: updatedOutline });
  };
  
  const movePlotPoint = (index: number, direction: 'up' | 'down') => {
    const newOutline = [...novel.outline];
    const item = newOutline[index];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= newOutline.length) return;
    
    newOutline.splice(index, 1);
    newOutline.splice(newIndex, 0, item);
    setNovel({ ...novel, outline: newOutline });
  };

  return (
    <div className="h-full flex flex-col">
      <header className="p-4 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-slate-100">Story Outline</h2>
        <p className="text-slate-400">Map out your narrative structure and key events.</p>
      </header>
      
      <div className="p-4 border-b border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="space-y-2">
            <label htmlFor="ai-prompt" className="text-sm font-medium text-slate-300">Generate Outline with AI</label>
            <textarea 
              id="ai-prompt"
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g., A sci-fi noir about a detective solving a murder on a Martian colony."
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
             {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
          </div>
          <div className="flex gap-4">
            <button
              onClick={handleGenerateOutline}
              disabled={isGenerating || !aiPrompt}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500"
            >
              <SparklesIcon />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            <button
              onClick={handleAddPlotPoint}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
            >
              <PlusIcon />
              Add Manually
            </button>
          </div>
      </div>
      
      <main className="flex-grow overflow-y-auto p-6 space-y-4">
        {novel.outline.length === 0 ? (
           <div className="text-center text-slate-500 py-16">
             <p>Your outline is empty.</p>
             <p>Generate one with AI or add plot points manually to get started.</p>
           </div>
        ) : (
          novel.outline.map((point, index) => (
            <div key={point.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <input
                  type="text"
                  value={point.title}
                  onChange={e => handlePlotPointChange(point.id, 'title', e.target.value)}
                  className="w-full bg-transparent text-lg font-semibold text-slate-100 focus:outline-none"
                  placeholder="Plot Point Title"
                />
                <div className="flex items-center gap-1 ml-4">
                  <button
                     onClick={() => movePlotPoint(index, 'up')}
                     disabled={index === 0}
                     className="p-1 rounded-md text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                     aria-label="Move up"
                  >
                    <ArrowUpIcon />
                  </button>
                  <button
                     onClick={() => movePlotPoint(index, 'down')}
                     disabled={index === novel.outline.length - 1}
                     className="p-1 rounded-md text-slate-400 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                     aria-label="Move down"
                  >
                    <ArrowDownIcon />
                  </button>
                  <button
                    onClick={() => handleDeletePlotPoint(point.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-400 hover:bg-red-500/20"
                    aria-label="Delete plot point"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
              <textarea
                value={point.description}
                onChange={e => handlePlotPointChange(point.id, 'description', e.target.value)}
                rows={3}
                className="w-full bg-slate-800 border-none rounded-md p-2 text-slate-300 focus:ring-1 focus:ring-indigo-500 resize-y"
                placeholder="Describe what happens in this plot point..."
              />
            </div>
          ))
        )}
      </main>
    </div>
  );
};
