import React, { useState } from 'react';
import { SidebarTab, Clip } from '../../types';
import { DEFAULT_TRANSITIONS, AUDIO_EFFECTS } from '../../data';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  onAddTextClip: (text: string) => void;
  onAddSticker: (emoji: string) => void;
  onAddTransition: (type: string) => void;
  selectedClip: Clip | null;
}

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: 'media', label: 'Media', icon: '📁' },
  { id: 'text', label: 'Text', icon: 'Aa' },
  { id: 'transitions', label: 'Transitions', icon: '⟷' },
  { id: 'stickers', label: 'Stickers', icon: '😀' },
  { id: 'audio', label: 'Audio', icon: '🎵' },
];

const STICKERS = ['😀', '😂', '🔥', '❤️', '👍', '🎉', '⭐', '🌈', '💪', '🦋', '🌺', '🍕', '🚀', '👑', '💎', '🌟', '🎵', '🎬', '📷', '✨'];

export default function Sidebar({ activeTab, onTabChange, onAddTextClip, onAddSticker, onAddTransition, selectedClip }: SidebarProps) {
  const [textInput, setTextInput] = useState('');

  const handleAddText = () => {
    if (textInput.trim()) { onAddTextClip(textInput.trim()); setTextInput(''); }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'media':
        return (
          <div className="p-3 space-y-3">
            <div className="border-2 border-dashed border-zinc-600 rounded-lg p-6 text-center cursor-pointer hover:border-zinc-500 transition-colors">
              <p className="text-white/40 text-sm">Drop media here</p>
              <p className="text-white/20 text-xs mt-1">or click to browse</p>
            </div>
          </div>
        );

      case 'text':
        return (
          <div className="p-3 space-y-3">
            <div className="flex gap-1">
              <input type="text" value={textInput} onChange={e => setTextInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddText()} placeholder="Enter text..."
                className="flex-1 bg-zinc-700/50 border border-zinc-600 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-white/40" />
              <button onClick={handleAddText}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded text-white text-xs transition-colors">Add</button>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] text-white/30 uppercase">Quick Styles</p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { name: 'Title Large', size: 48, color: '#ffffff', bg: 'rgba(0,0,0,0.6)', y: 0.3 },
                  { name: 'Caption', size: 24, color: '#ffffff', bg: 'rgba(0,0,0,0.3)', y: 0.85 },
                  { name: 'Neon Glow', size: 36, color: '#00ff88', bg: 'rgba(0,0,0,0.5)', y: 0.5 },
                  { name: 'Gradient', size: 32, color: '#ff6b6b', bg: 'rgba(0,0,0,0.4)', y: 0.5 },
                ].map((style, i) => (
                  <button key={i} onClick={() => onAddTextClip(style.name)}
                    className="px-2 py-3 rounded bg-zinc-700/50 hover:bg-zinc-600/50 text-white text-xs text-center transition-colors">
                    <span style={{ fontSize: 10 }}>{style.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'transitions':
        return (
          <div className="p-3 space-y-3">
            <p className="text-[10px] text-white/30 uppercase">Apply to selected clip</p>
            {selectedClip ? (
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_TRANSITIONS.map(t => (
                  <button key={t.id} onClick={() => onAddTransition(t.id)}
                    className="flex flex-col items-center gap-1 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-zinc-700/30 hover:border-zinc-600/50 transition-all">
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-[10px] text-white/60">{t.name}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-white/30 text-xs">Select a clip on the timeline first</p>
            )}
          </div>
        );

      case 'stickers':
        return (
          <div className="p-3">
            <div className="grid grid-cols-5 gap-2">
              {STICKERS.map(emoji => (
                <button key={emoji} onClick={() => onAddSticker(emoji)}
                  className="text-2xl p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 hover:scale-110 transition-all">
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="p-3 space-y-1">
            {AUDIO_EFFECTS.map(e => (
              <button key={e.id}
                className="w-full flex items-center gap-3 p-2 rounded-lg bg-zinc-800/50 hover:bg-zinc-700/50 border border-transparent hover:border-zinc-600/50 transition-all">
                <span className="text-lg w-6 text-center">{e.icon}</span>
                <span className="text-xs text-white/70">{e.name}</span>
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="w-64 flex flex-col bg-zinc-800/90 border-r border-zinc-700/50">
      <div className="flex border-b border-zinc-700/50">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 text-[10px] transition-colors ${
              activeTab === tab.id ? 'text-white border-b-2 border-blue-400' : 'text-white/40 hover:text-white/60'
            }`}>
            <span>{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">{renderTabContent()}</div>
    </div>
  );
}
