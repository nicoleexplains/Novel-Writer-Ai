import React, { useState, useCallback, useRef } from 'react';
import type { Novel, NovelVersion } from './types';
import { View } from './types';
import { ManuscriptView } from './components/ManuscriptView';
import { CharactersView } from './components/CharactersView';
import { OutlineView } from './components/OutlineView';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { BookIcon, UsersIcon, ListIcon, HistoryIcon, ExportIcon, ImportIcon } from './components/icons';

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
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSetNovel = useCallback((newNovelState: React.SetStateAction<Novel>) => {
      setNovel(newNovelState);
  }, []);
  
  const handleSaveNovel = () => {
    setSaveStatus('saving');
    try {
      // Save current state
      localStorage.setItem('novel-weaver-data', JSON.stringify(novel));

      // Update history
      const historyString = localStorage.getItem('novel-weaver-history');
      const history: NovelVersion[] = historyString ? JSON.parse(historyString) : [];
      
      const newVersion: NovelVersion = {
        timestamp: Date.now(),
        novel: novel,
      };

      // Add new version and keep only the last 20
      const updatedHistory = [...history, newVersion].slice(-20);
      localStorage.setItem('novel-weaver-history', JSON.stringify(updatedHistory));
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Failed to save novel data to localStorage", error);
      setSaveStatus('idle');
    }
  };
  
  const handleRevert = (historicalNovel: Novel) => {
    setNovel(historicalNovel);
    setIsHistoryModalOpen(false);
    // Trigger a save of the reverted state to mark it as the current version
    handleSaveNovel();
  };

  const handleImportNovel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json') {
      alert('Please select a valid JSON file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Failed to read file content.');
        
        const importedNovel = JSON.parse(text);

        // Basic validation
        if (
          typeof importedNovel.title !== 'string' ||
          !Array.isArray(importedNovel.chapters) ||
          !Array.isArray(importedNovel.characters) ||
          !Array.isArray(importedNovel.outline)
        ) {
          throw new Error('Invalid novel file format.');
        }
        
        if (window.confirm('Importing this file will replace your current novel. Are you sure you want to continue?')) {
          setNovel(importedNovel as Novel);
        }
      } catch (error) {
        console.error("Failed to import novel:", error);
        alert(`Could not import the novel. Please ensure it's a valid novel JSON file. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        if (event.target) event.target.value = '';
      }
    };
    reader.readAsText(file);
  };
  
  const handleExportNovel = () => {
    try {
        const jsonString = JSON.stringify(novel, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const fileName = novel.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.href = url;
        link.download = `${fileName || 'novel'}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch(error) {
        console.error("Failed to export novel:", error);
        alert("Could not export the novel. See console for details.");
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
            <div className="flex items-center gap-2 flex-shrink-0">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="application/json"
                    className="hidden"
                    aria-hidden="true"
                />
                <button
                    onClick={handleImportNovel}
                    className="p-2 rounded-md font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2"
                    aria-label="Import novel"
                >
                    <ImportIcon />
                    Import
                </button>
                <button
                    onClick={handleExportNovel}
                    className="p-2 rounded-md font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2"
                    aria-label="Export novel"
                >
                    <ExportIcon />
                    Export
                </button>
                <button
                    onClick={() => setIsHistoryModalOpen(true)}
                    className="p-2 rounded-md font-semibold text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors flex items-center gap-2"
                    aria-label="View version history"
                >
                    <HistoryIcon />
                    History
                </button>
                <button
                  onClick={handleSaveNovel}
                  className={`px-4 py-2 rounded-md font-semibold text-white transition-colors w-32 ${
                    saveStatus === 'saved'
                      ? 'bg-emerald-600 cursor-default'
                      : 'bg-indigo-600 hover:bg-indigo-500'
                  } ${saveStatus === 'saving' ? 'bg-slate-600 cursor-not-allowed' : ''}`}
                  disabled={saveStatus === 'saving' || saveStatus === 'saved'}
                >
                  {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save Novel'}
                </button>
            </div>
        </header>
        <div className="flex-grow overflow-auto">
            {renderActiveView()}
        </div>
      </main>
      {isHistoryModalOpen && (
        <VersionHistoryModal
            onClose={() => setIsHistoryModalOpen(false)}
            onRevert={handleRevert}
        />
      )}
    </div>
  );
};

export default App;