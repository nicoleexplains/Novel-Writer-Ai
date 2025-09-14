// Implementing the ProjectLoadModal component.
import React, { useState } from 'react';

interface ProjectLoadModalProps {
  savedNovelIds: string[];
  onLoadNovel: (id: string) => void;
  onCreateNovel: (title: string) => void;
}

export const ProjectLoadModal: React.FC<ProjectLoadModalProps> = ({
  savedNovelIds,
  onLoadNovel,
  onCreateNovel,
}) => {
  const [newNovelTitle, setNewNovelTitle] = useState('');

  const handleCreate = () => {
    if (newNovelTitle.trim()) {
      onCreateNovel(newNovelTitle.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-md border border-slate-700">
        <header className="p-4 border-b border-slate-700">
          <h2 className="text-xl font-bold text-white">Novel Writer AI</h2>
        </header>
        <div className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-200">Create New Novel</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newNovelTitle}
                onChange={(e) => setNewNovelTitle(e.target.value)}
                placeholder="Enter novel title..."
                className="flex-grow bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-100 focus:ring-indigo-500 focus:border-indigo-500"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
              <button
                onClick={handleCreate}
                disabled={!newNovelTitle.trim()}
                className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 disabled:bg-slate-600"
              >
                Create
              </button>
            </div>
          </div>
          {savedNovelIds.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold text-slate-200 border-t border-slate-700 pt-6">Or Load Existing Project</h3>
              <ul className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                {savedNovelIds.map((id) => (
                  <li key={id}>
                    <button
                      onClick={() => onLoadNovel(id)}
                      className="w-full text-left p-3 rounded-md bg-slate-700/50 hover:bg-indigo-600/50 transition-colors"
                    >
                      {id}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectLoadModal;
