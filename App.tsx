// Implementing the main App component.
import React, { useState, useEffect, useCallback } from 'react';
import { OutlineView } from './components/OutlineView';
import { CharactersView } from './components/CharactersView';
import { ManuscriptView } from './components/ManuscriptView';
import { ProjectLoadModal } from './components/ProjectLoadModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import type { Novel, NovelVersion } from './types';
import { SparklesIcon } from './components/icons';

type View = 'outline' | 'characters' | 'manuscript';

const SAVE_DEBOUNCE_TIME = 2000;
const VERSION_HISTORY_INTERVAL = 5 * 60 * 1000; // 5 minutes

const App: React.FC = () => {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [currentView, setCurrentView] = useState<View>('manuscript');
  const [savedNovelIds, setSavedNovelIds] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('novel-'));
    setSavedNovelIds(keys.map(k => k.replace('novel-', '')));
  }, []);

  const saveNovel = useCallback((updatedNovel: Novel) => {
    localStorage.setItem(`novel-${updatedNovel.id}`, JSON.stringify(updatedNovel));
  }, []);

  useEffect(() => {
    if (!novel) return;
    const handler = setTimeout(() => {
      saveNovel(novel);
    }, SAVE_DEBOUNCE_TIME);
    return () => clearTimeout(handler);
  }, [novel, saveNovel]);
  
  useEffect(() => {
    if (!novel?.id) return;
    const interval = setInterval(() => {
      setNovel(currentNovel => {
        if (!currentNovel) return null;
        const { versionHistory, ...novelData } = currentNovel;
        const newVersion: NovelVersion = {
            timestamp: Date.now(),
            novel: JSON.parse(JSON.stringify(novelData)), // deep copy
        };
        const updatedHistory = [newVersion, ...(versionHistory || [])].slice(0, 50); // limit history size
        return { ...currentNovel, versionHistory: updatedHistory };
      });
    }, VERSION_HISTORY_INTERVAL);

    return () => clearInterval(interval);
  }, [novel?.id]);

  const handleCreateNovel = (title: string) => {
    const newNovel: Novel = {
      id: title.toLowerCase().replace(/\s+/g, '-'),
      title,
      outline: [],
      characters: [],
      chapters: [{ id: '1', title: 'Chapter 1', content: '', summary: '' }],
      versionHistory: [],
    };
    setNovel(newNovel);
    localStorage.setItem(`novel-${newNovel.id}`, JSON.stringify(newNovel));
    setSavedNovelIds(ids => [...new Set([...ids, newNovel.id])]);
  };

  const handleLoadNovel = (id: string) => {
    const savedData = localStorage.getItem(`novel-${id}`);
    if (savedData) {
      setNovel(JSON.parse(savedData));
    }
  };
  
  const handleRestoreVersion = (version: NovelVersion) => {
    setNovel(currentNovel => {
        if (!currentNovel) return null;
        return {
            ...version.novel,
            id: currentNovel.id,
            versionHistory: currentNovel.versionHistory,
        };
    });
    setIsHistoryModalOpen(false);
  };

  if (!novel) {
    return (
      <ProjectLoadModal
        savedNovelIds={savedNovelIds}
        onLoadNovel={handleLoadNovel}
        onCreateNovel={handleCreateNovel}
      />
    );
  }

  const renderView = () => {
    switch (currentView) {
      case 'outline':
        return <OutlineView novel={novel} setNovel={setNovel} />;
      case 'characters':
        return <CharactersView novel={novel} setNovel={setNovel} />;
      case 'manuscript':
        return <ManuscriptView novel={novel} setNovel={setNovel} />;
      default:
        return null;
    }
  };

  const NavButton: React.FC<{ view: View; label: string }> = ({ view, label }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
        currentView === view
          ? 'bg-indigo-600 text-white'
          : 'text-slate-300 hover:bg-slate-700'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-slate-900 text-slate-200 h-screen flex flex-col font-sans">
      <header className="flex-shrink-0 flex justify-between items-center p-3 bg-slate-800/50 border-b border-slate-700">
        <div className="flex items-center gap-2">
           <SparklesIcon className="h-6 w-6 text-indigo-400"/>
           <h1 className="text-xl font-bold text-white">{novel.title}</h1>
        </div>
        <nav className="flex items-center gap-2">
          <NavButton view="manuscript" label="Manuscript" />
          <NavButton view="outline" label="Outline" />
          <NavButton view="characters" label="Characters" />
        </nav>
        <div className="flex items-center gap-4">
            <button 
                onClick={() => setIsHistoryModalOpen(true)}
                className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
            >
                Version History
            </button>
            <button 
                onClick={() => setNovel(null)}
                className="px-3 py-1.5 text-sm font-medium rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
            >
                Switch Project
            </button>
        </div>
      </header>
      <main className="flex-grow overflow-hidden">{renderView()}</main>

      {isHistoryModalOpen && (
          <VersionHistoryModal 
            history={novel.versionHistory || []}
            onRestore={handleRestoreVersion}
            onClose={() => setIsHistoryModalOpen(false)}
          />
      )}
    </div>
  );
};

export default App;
