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

  const handleGenerateOutline = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      if (novel.outline.length > 0 && !window.confirm('This will replace the current outline. Are you sure?')) {
        setIsGenerating(false);
        return;
      }
      const plotPointsData = await generateOutline(aiPrompt);
      const newPlotPoints: PlotPoint[] = plotPointsData.map((pp, index) => ({
        ...pp,
        id: `${Date.now()}-${index}`,
      }));
      setNovel({ ...novel, outline: newPlotPoints });
      setAiPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddPlotPoint = () => {
    const newPlotPoint: PlotPoint = {
      id: Date.now().toString(),
      title: 'New Plot Point',
      description: '',
    };
    setNovel({ ...novel, outline: [...novel.outline, newPlotPoint] });
  };

  const handleDeletePlotPoint = (id: string) => {
    setNovel({ ...novel, outline: novel.outline.filter(p => p.id !== id) });
  };

  const handleUpdatePlotPoint = (id: string, field: 'title' | 'description', value: string) => {
    const updatedOutline = novel.outline.map(p =>
      p.id === id ? { ...p, [field]: value } : p
    );
    setNovel({ ...novel, outline: updatedOutline });
  };

  const handleMovePlotPoint = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === novel.outline.length - 1)
    ) {
      return;
    }
    const newOutline = [...novel.outline];
    const item = newOutline.splice(index, 1)[0];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    newOutline.splice(newIndex, 0, item);
    setNovel({ ...novel, outline: newOutline });
  };


  return (
    <div className="flex h-full">
      {/* AI Generator and Controls */}
      <aside className="w-1/3 h-full bg-slate-800/50 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Story Outline</h2>
        </div>

        <div className="p-4 border-b border-slate-700 space-y-3">
          <p className="text-sm font-medium text-slate-300">Generate New Outline with AI</p>
          <textarea
            value={aiPrompt}
            onChange={e => setAiPrompt(e.target.value)}
            placeholder="e.g., A high-fantasy epic about a lost magical artifact"
            rows={3}
            className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
          />
          <button
            onClick={handleGenerateOutline}
            disabled={isGenerating || !aiPrompt}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500"
          >
            <SparklesIcon />
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <div className="p-4 flex-shrink-0">
          <button
            onClick={handleAddPlotPoint}
            className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
          >
            <PlusIcon />
            Add Plot Point Manually
          </button>
        </div>
      </aside>

      {/* Outline Editor */}
      <main className="w-2/3 h-full overflow-y-auto">
        {novel.outline.length > 0 ? (
          <ul className="p-6 space-y-6">
            {novel.outline.map((plotPoint, index) => (
              <li key={plotPoint.id} className="bg-slate-800/50 rounded-lg border border-slate-700 p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-grow space-y-2">
                    <input
                      type="text"
                      value={plotPoint.title}
                      onChange={(e) => handleUpdatePlotPoint(plotPoint.id, 'title', e.target.value)}
                      className="w-full bg-transparent text-xl font-bold text-white focus:outline-none"
                      placeholder="Plot Point Title"
                    />
                    <textarea
                      value={plotPoint.description}
                      onChange={(e) => handleUpdatePlotPoint(plotPoint.id, 'description', e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-600 rounded-md p-2 text-slate-300 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                      placeholder="Describe what happens here..."
                    />
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => handleMovePlotPoint(index, 'up')}
                      disabled={index === 0}
                      className="p-2 rounded-md text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Move up"
                    >
                      <ArrowUpIcon />
                    </button>
                    <button
                      onClick={() => handleDeletePlotPoint(plotPoint.id)}
                      className="p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                      aria-label="Delete plot point"
                    >
                      <TrashIcon />
                    </button>
                    <button
                      onClick={() => handleMovePlotPoint(index, 'down')}
                      disabled={index === novel.outline.length - 1}
                      className="p-2 rounded-md text-slate-400 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-label="Move down"
                    >
                      <ArrowDownIcon />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500 h-full">
            <p>Generate an outline with AI or add plot points manually to begin.</p>
          </div>
        )}
      </main>
    </div>
  );
};
