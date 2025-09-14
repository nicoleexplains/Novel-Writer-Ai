// Implementing the VersionHistoryModal component.
import React from 'react';
import type { NovelVersion } from '../types';

interface VersionHistoryModalProps {
  history: NovelVersion[];
  onRestore: (version: NovelVersion) => void;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({ history, onRestore, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 max-h-[90vh] flex flex-col">
        <header className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-100">Version History</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-2xl leading-none" aria-label="Close">&times;</button>
        </header>
        <div className="p-6 flex-grow overflow-y-auto">
          {history.length > 0 ? (
            <ul className="space-y-3">
              {history.map((version) => (
                <li key={version.timestamp} className="p-4 bg-slate-700/50 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-200">
                      Saved on: {new Date(version.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-400">
                      {version.novel.chapters.length} chapters, {version.novel.characters.length} characters, {version.novel.outline.length} plot points
                    </p>
                  </div>
                  <button
                    onClick={() => onRestore(version)}
                    className="px-3 py-1.5 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500"
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-400 text-center py-8">No version history available. Versions are saved automatically every 5 minutes.</p>
          )}
        </div>
        <footer className="p-4 border-t border-slate-700 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md text-slate-300 bg-slate-700 hover:bg-slate-600">
            Close
          </button>
        </footer>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
