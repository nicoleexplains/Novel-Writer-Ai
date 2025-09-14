import React, { useState, useEffect } from 'react';
import type { Novel, NovelVersion } from '../types';

interface VersionHistoryModalProps {
  onClose: () => void;
  onRevert: (novel: Novel) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ onClose, onRevert }) => {
  const [history, setHistory] = useState<NovelVersion[]>([]);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('novel-weaver-history');
      setHistory(savedHistory ? JSON.parse(savedHistory) : []);
    } catch (error) {
      console.error("Failed to parse history from localStorage", error);
      setHistory([]);
    }
  }, []);

  const handleRevertClick = (novel: Novel) => {
    if (window.confirm('Are you sure you want to revert to this version? Any unsaved changes will be lost.')) {
      onRevert(novel);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col border border-slate-700">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-100">Version History</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
        </header>
        
        <div className="flex-grow p-6 overflow-y-auto">
          {history.length > 0 ? (
            <ul className="space-y-3">
              {[...history].reverse().map((version) => (
                <li key={version.timestamp} className="bg-slate-900/50 p-4 rounded-md border border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-200">
                      {new Date(version.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">
                      {version.novel.title} &bull; {version.novel.chapters.length} Chapters &bull; {version.novel.characters.length} Characters
                    </p>
                  </div>
                  <button
                    onClick={() => handleRevertClick(version.novel)}
                    className="px-3 py-1.5 rounded-md text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 transition-colors"
                  >
                    Revert
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500">
              <p>No saved versions found. Click 'Save Novel' to create one.</p>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-slate-700 bg-slate-800/50 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};
