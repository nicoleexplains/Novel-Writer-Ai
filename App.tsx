import React, { useState, useCallback } from 'react';
import type { Novel } from './types';
import { View } from './types';
import { ManuscriptView } from './components/ManuscriptView';
import { CharactersView } from './components/CharactersView';
import { OutlineView } from './components/OutlineView';
import { BookIcon, UsersIcon, ListIcon } from './components/icons';

const initialNovel: Novel = {
  title: "Untitled Novel",
  chapters: [],
  characters: [],
  outline: [],
};

const Sidebar: React.FC<{ activeView: View; setActiveView: (view: View) => void }> = ({ activeView, setActiveView }) => {
  const navItems = [
    { view: View.MANUSCRIPT, label: 'Manuscript', icon: <BookIcon /> },
    { view: View.CHARACTERS, label: 'Characters', icon: <UsersIcon /> },
    { view: View.OUTLINE, label: 'Outline', icon: <ListIcon /> },
  ];

  return (
    <nav className="w-20 bg-slate-900 border-r border-slate-700 flex flex-col items-center py-6 space-y-6 flex-shrink-0">
      <h1 className="text-xl font-bold text-indigo-400">NW</h1>
      <div className="flex flex-col space-y-4">
        {navItems.map(item => (
          <button
            key={item.view}
            onClick={() => setActiveView(item.view)}
            className={`p-3 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500 ${
              activeView === item.view
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
            }`}
            aria-label={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [novel, setNovel] = useState<Novel>(() => {
    try {
      const savedNovel = localStorage.getItem('novel-weaver-data');
      return savedNovel ? JSON.parse(savedNovel) : initialNovel;
    } catch (error) {
      console.error("Failed to parse novel data from localStorage", error);
      return initialNovel;
    }
  });

  const [activeView, setActiveView] = useState<View>(View.MANUSCRIPT);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  const handleSetNovel = useCallback((newNovelState: React.SetStateAction<Novel>) => {
      setNovel(newNovelState);
  }, []);
  
  const handleSaveNovel = () => {
    setSaveStatus('saving');
    try {
      localStorage.setItem('novel-weaver-data', JSON.stringify(novel));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000); // Reset status after 2 seconds
    } catch (error) {
      console.error("Failed to save novel data to localStorage", error);
      setSaveStatus('idle'); // Reset on error
    }
  };

  const renderActiveView = () => {
    switch (activeView) {
      case View.MANUSCRIPT:
        return <ManuscriptView novel={novel} setNovel={handleSetNovel} />;
      case View.CHARACTERS:
        return <CharactersView novel={novel} setNovel={handleSetNovel} />;
      case View.OUTLINE:
        return <OutlineView novel={novel} setNovel={handleSetNovel} />;
      default:
        return null;
    }
  };
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNovel(prevNovel => ({...prevNovel, title: e.target.value}));
  }

  return (
    <div className="h-screen w-screen bg-slate-900 text-white flex font-sans">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="flex-grow h-full flex flex-col">
        <header className="px-6 py-4 border-b border-slate-700 flex-shrink-0 flex justify-between items-center gap-4">
            <input
                type="text"
                value={novel.title}
                onChange={handleTitleChange}
                className="w-full bg-transparent text-3xl font-bold text-white placeholder-slate-500 focus:outline-none"
                placeholder="Untitled Novel"
                aria-label="Novel Title"
            />
            <button
              onClick={handleSaveNovel}
              className={`px-4 py-2 rounded-md font-semibold text-white transition-colors flex-shrink-0 w-32 ${
                saveStatus === 'saved'
                  ? 'bg-emerald-600 cursor-default'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              } ${saveStatus === 'saving' ? 'bg-slate-600 cursor-not-allowed' : ''}`}
              disabled={saveStatus === 'saving' || saveStatus === 'saved'}
            >
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Novel'}
            </button>
        </header>
        <div className="flex-grow overflow-auto">
            {renderActiveView()}
        </div>
      </main>
    </div>
  );
};

export default App;
