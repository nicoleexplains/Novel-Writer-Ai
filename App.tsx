// Implementing the main App component.
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { OutlineView } from './components/OutlineView';
import { CharactersView } from './components/CharactersView';
import { ManuscriptView } from './components/ManuscriptView';
import { ProjectLoadModal } from './components/ProjectLoadModal';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import type { Novel, NovelVersion } from './types';
import { SparklesIcon, SaveIcon, HistoryIcon, FolderOpenIcon, DocumentPlusIcon, ExportIcon, ImportIcon } from './components/icons';

type View = 'outline' | 'characters' | 'manuscript';

const App: React.FC = () => {
  const [novel, setNovel] = useState<Novel | null>(null);
  const [currentView, setCurrentView] = useState<View>('manuscript');
  const [savedNovelIds, setSavedNovelIds] = useState<string[]>([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('novel-'));
    setSavedNovelIds(keys.map(k => k.replace('novel-', '')));
  }, []);

  const saveNovelToStorage = useCallback((updatedNovel: Novel) => {
    localStorage.setItem(`novel-${updatedNovel.id}`, JSON.stringify(updatedNovel));
  }, []);
  
  const handleSaveNovel = () => {
    if (!novel || saveStatus !== 'idle') return;
    setSaveStatus('saving');

    const { versionHistory, ...novelData } = novel;
    const newVersion: NovelVersion = {
      timestamp: Date.now(),
      novel: JSON.parse(JSON.stringify(novelData)),
    };

    const updatedHistory = [newVersion, ...(versionHistory || [])].slice(0, 50);
    const updatedNovel = { ...novel, versionHistory: updatedHistory };
    
    setNovel(updatedNovel);
    saveNovelToStorage(updatedNovel);

    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);
  };

  const handleCreateNovel = (title: string) => {
    const newNovel: Novel = {
      id: `${title.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
      title,
      outline: [],
      characters: [],
      chapters: [{ id: '1', title: 'Chapter 1', content: '', summary: '' }],
      versionHistory: [],
    };
    setNovel(newNovel);
    saveNovelToStorage(newNovel);
    setSavedNovelIds(ids => [...new Set([...ids, newNovel.id])]);
  };

  const handleCreateNewProject = () => {
    handleCreateNovel('Untitled Novel');
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

  const handleExportNovel = useCallback(() => {
    if (!novel) return;
    try {
        const jsonString = JSON.stringify(novel, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeTitle = novel.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
        a.download = `${safeTitle || 'novel'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Error exporting novel:", error);
        alert("Failed to export novel.");
    }
  }, [novel]);

  const handleTriggerImport = () => {
      importInputRef.current?.click();
  };

  const handleImportFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          try {
              const text = e.target?.result;
              if (typeof text !== 'string') {
                  throw new Error("File could not be read.");
              }
              const importedNovel = JSON.parse(text);

              if (
                  typeof importedNovel.id !== 'string' ||
                  typeof importedNovel.title !== 'string' ||
                  !Array.isArray(importedNovel.chapters) ||
                  !Array.isArray(importedNovel.characters) ||
                  !Array.isArray(importedNovel.outline) ||
                  !Array.isArray(importedNovel.versionHistory)
              ) {
                  throw new Error("Invalid novel file format. The file is missing required fields.");
              }

              if (window.confirm("Importing this novel will replace your current session. Unsaved changes may be lost. Are you sure?")) {
                  const novelToLoad: Novel = importedNovel as Novel;
                  saveNovelToStorage(novelToLoad);
                  setSavedNovelIds(ids => [...new Set([...ids, novelToLoad.id])]);
                  setNovel(novelToLoad);
              }
          } catch (error) {
              console.error("Error importing novel:", error);
              alert(`Failed to import novel: ${error instanceof Error ? error.message : 'Unknown error'}`);
          } finally {
              if (event.target) {
                  event.target.value = '';
              }
          }
      };
      reader.readAsText(file);
  }, [saveNovelToStorage]);


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

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving': return 'Saving...';
      case 'saved': return 'Saved!';
      default: return 'Save';
    }
  };

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
        <div className="flex items-center gap-2">
            <button
                onClick={handleSaveNovel}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors ${
                    saveStatus === 'saved'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                }`}
                disabled={saveStatus !== 'idle'}
            >
                <SaveIcon className="h-5 w-5" />
                {getSaveButtonContent()}
            </button>
            <button
                onClick={() => setIsHistoryModalOpen(true)}
                className="p-2 rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                aria-label="View version history"
                title="Version History"
            >
                <HistoryIcon className="h-5 w-5" />
            </button>
             <button
                onClick={handleCreateNewProject}
                className="p-2 rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                aria-label="Create a new project"
                title="New Project"
            >
                <DocumentPlusIcon className="h-5 w-5" />
            </button>
            <button
                onClick={() => setNovel(null)}
                className="p-2 rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                aria-label="Load an existing project"
                title="Load Project"
            >
                <FolderOpenIcon className="h-5 w-5" />
            </button>

            <div className="h-6 w-px bg-slate-600 mx-1"></div>
            
            <button
                onClick={handleTriggerImport}
                className="p-2 rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                aria-label="Import a novel from a file"
                title="Import Novel"
            >
                <ImportIcon className="h-5 w-5" />
            </button>
             <button
                onClick={handleExportNovel}
                className="p-2 rounded-md text-slate-300 hover:bg-slate-700 transition-colors"
                aria-label="Export the current novel to a file"
                title="Export Novel"
            >
                <ExportIcon className="h-5 w-5" />
            </button>
        </div>
      </header>
      <main className="flex-grow overflow-hidden">{renderView()}</main>

      <input
        type="file"
        ref={importInputRef}
        onChange={handleImportFile}
        accept="application/json"
        className="hidden"
        aria-hidden="true"
      />

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