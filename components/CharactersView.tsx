import React, { useState } from 'react';
import type { Novel, Character } from '../types';
import { generateCharacter } from '../services/geminiService';
import { PlusIcon, TrashIcon, SparklesIcon } from './icons';

interface CharactersViewProps {
  novel: Novel;
  setNovel: React.Dispatch<React.SetStateAction<Novel>>;
}

const CharacterDetailEditor: React.FC<{
    character: Character;
    onUpdate: (field: keyof Omit<Character, 'id'>, value: string) => void;
    onDelete: (id: string) => void;
}> = ({ character, onUpdate, onDelete }) => {
    return (
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
                <input
                    type="text"
                    value={character.name}
                    onChange={(e) => onUpdate('name', e.target.value)}
                    className="w-full bg-transparent text-2xl font-bold text-white focus:outline-none"
                    placeholder="Character Name"
                />
                <button
                    onClick={() => onDelete(character.id)}
                    className="ml-4 p-2 rounded-md text-slate-400 hover:bg-red-500/20 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-red-500"
                    aria-label="Delete character"
                >
                    <TrashIcon />
                </button>
            </div>

            <div className="space-y-6">
                <label className="block">
                    <span className="text-slate-400 text-sm font-medium">Age</span>
                    <input
                        type="text"
                        value={character.age}
                        onChange={(e) => onUpdate('age', e.target.value)}
                        className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </label>
                <label className="block">
                    <span className="text-slate-400 text-sm font-medium">Appearance</span>
                    <textarea
                        value={character.appearance}
                        onChange={(e) => onUpdate('appearance', e.target.value)}
                        rows={4}
                        className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                    />
                </label>
                <label className="block">
                    <span className="text-slate-400 text-sm font-medium">Personality</span>
                    <textarea
                        value={character.personality}
                        onChange={(e) => onUpdate('personality', e.target.value)}
                        rows={4}
                        className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                    />
                </label>
                <label className="block">
                    <span className="text-slate-400 text-sm font-medium">Backstory</span>
                    <textarea
                        value={character.backstory}
                        onChange={(e) => onUpdate('backstory', e.target.value)}
                        rows={6}
                        className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                    />
                </label>
                <label className="block">
                    <span className="text-slate-400 text-sm font-medium">Role in Story</span>
                    <textarea
                        value={character.roleInStory}
                        onChange={(e) => onUpdate('roleInStory', e.target.value)}
                        rows={3}
                        className="mt-1 block w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-y"
                    />
                </label>
            </div>
        </div>
    );
};


export const CharactersView: React.FC<CharactersViewProps> = ({ novel, setNovel }) => {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(novel.characters[0]?.id || null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const selectedCharacter = novel.characters.find(c => c.id === selectedCharacterId);

  const handleAddCharacter = () => {
    const newCharacter: Character = {
      id: Date.now().toString(),
      name: 'New Character',
      age: '',
      appearance: '',
      backstory: '',
      personality: '',
      roleInStory: '',
    };
    const updatedNovel = { ...novel, characters: [...novel.characters, newCharacter] };
    setNovel(updatedNovel);
    setSelectedCharacterId(newCharacter.id);
  };
  
  const handleGenerateCharacter = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    setError(null);
    try {
      const characterData = await generateCharacter(aiPrompt);
      const newCharacter: Character = { ...characterData, id: Date.now().toString() };
      const updatedNovel = { ...novel, characters: [...novel.characters, newCharacter] };
      setNovel(updatedNovel);
      setSelectedCharacterId(newCharacter.id);
      setAiPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteCharacter = (id: string) => {
    const updatedCharacters = novel.characters.filter(c => c.id !== id);
    const updatedNovel = { ...novel, characters: updatedCharacters };
    setNovel(updatedNovel);
    if (selectedCharacterId === id) {
      setSelectedCharacterId(updatedCharacters[0]?.id || null);
    }
  };

  const handleCharacterUpdate = (field: keyof Omit<Character, 'id'>, value: string) => {
    if (!selectedCharacterId) return;

    const updatedCharacters = novel.characters.map(c =>
      c.id === selectedCharacterId ? { ...c, [field]: value } : c
    );
    setNovel({ ...novel, characters: updatedCharacters });
  };
  
  return (
    <div className="flex h-full">
      {/* Character List */}
      <aside className="w-1/3 h-full bg-slate-800/50 border-r border-slate-700 flex flex-col">
        <div className="p-4 flex justify-between items-center border-b border-slate-700">
          <h2 className="text-lg font-semibold text-slate-200">Characters</h2>
          <button
            onClick={handleAddCharacter}
            className="p-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-indigo-500"
            aria-label="Add new character"
          >
            <PlusIcon />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-700 space-y-2">
            <p className="text-sm font-medium text-slate-300">Generate with AI</p>
            <textarea 
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="e.g., A grizzled space detective with a dark past"
              rows={2}
              className="w-full bg-slate-800 border border-slate-600 rounded-md p-2 text-sm text-slate-200 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            />
            <button
              onClick={handleGenerateCharacter}
              disabled={isGenerating || !aiPrompt}
              className="w-full flex justify-center items-center gap-2 px-4 py-2 rounded-md bg-emerald-600 text-white font-semibold hover:bg-emerald-500 transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-emerald-500"
            >
              <SparklesIcon />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
            {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
        </div>

        <ul className="flex-grow overflow-y-auto">
          {novel.characters.map(character => (
            <li key={character.id}>
              <button
                onClick={() => setSelectedCharacterId(character.id)}
                className={`w-full text-left p-4 ${
                  selectedCharacterId === character.id
                    ? 'bg-indigo-600/30 text-white'
                    : 'text-slate-400 hover:bg-slate-700/50'
                } transition-colors focus:outline-none focus:bg-slate-700/50`}
              >
                <p className="font-semibold truncate">{character.name}</p>
                <p className="text-sm text-slate-400 truncate">{character.roleInStory || 'No role specified'}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Character Editor */}
      <main className="w-2/3 h-full flex flex-col">
        {selectedCharacter ? (
          <CharacterDetailEditor
             character={selectedCharacter}
             onUpdate={handleCharacterUpdate}
             onDelete={handleDeleteCharacter}
           />
        ) : (
          <div className="flex-grow flex items-center justify-center text-slate-500">
            <p>Select a character or generate a new one.</p>
          </div>
        )}
      </main>
    </div>
  );
};
