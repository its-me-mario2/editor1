import React, { useState, useRef } from 'react';
import { SidebarTab, Transition, FilterPreset, AudioEffect, Clip, Track } from '../types';
import { DEFAULT_TRANSITIONS, FILTER_PRESETS, AUDIO_EFFECTS } from '../data';

interface SidebarProps {
  activeTab: SidebarTab;
  onTabChange: (tab: SidebarTab) => void;
  transitions: Transition[];
  filters: FilterPreset[];
  audioEffects: AudioEffect[];
  onAddText: (text: string, trackId: string) => void;
  onAddClip: (clip: Clip) => void;
  onApplyFilter: (filterId: string) => void;
  selectedClipId: string | null;
  tracks: Track[];
}

const TABS: { id: SidebarTab; label: string; icon: string }[] = [
  { id: 'media', label: 'Media', icon: '📁' },
  { id: 'text', label: 'Text', icon: '📝' },
  { id: 'transitions', label: 'Transitions', icon: '🔄' },
  { id: 'stickers', label: 'Stickers', icon: '🌟' },
  { id: 'audio', label: 'Audio', icon: '🎵' },
];

const STICKERS = [
  { id: 's1', name: 'Fire', emoji: '🔥' },
  { id: 's2', name: 'Heart', emoji: '❤️' },
  { id: 's3', name: 'Star', emoji: '⭐' },
  { id: 's4', name: 'Like', emoji: '👍' },
  { id: 's5', name: 'Clap', emoji: '👏' },
  { id: 's6', name: 'Rocket', emoji: '🚀' },
  { id: 's7', name: 'Crown', emoji: '👑' },
  { id: 's8', name: 'Check', emoji: '✅' },
];

const Sidebar: React.FC<SidebarProps> = ({
  activeTab, onTabChange, transitions, filters, audioEffects,
  onAddText, onAddClip, onApplyFilter, selectedClipId, tracks,
}) => {
  const [textInput, setTextInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    for (const file of Array.from(files)) {
      const type = file.type.startsWith('video') ? 'video' : file.type.startsWith('audio') ? 'audio' : null;
      if (!type) continue;
      const trackId = type === 'video' ? 'track-video-1' : 'track-audio-1';
      const clip: Clip = {
        id: `clip-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        trackId,
        label: file.name.replace(/\.[^/.]+$/, ''),
        startTime: Math.max(...tracks.find(t => t.id === trackId)?.clips.map(c => c.startTime + c.duration) || [0]),
        duration: 5,
        color: type === 'video' ? '#3b82f6' : '#8b5cf6',
        volume: 1,
        speed: 1,
        opacity: 1,
      };
      onAddClip(clip);
    }
    e.target.value = '';
  };

  const handleAddText = () => {
    if (!textInput.trim()) return;
    const track = tracks.find(t => t.kind === 'text');
    if (!track) return;
    onAddText(textInput.trim(), track.id);
    setTextInput('');
  };

  return (
    <div className="flex flex-col h-full bg-surface-900 border-r border-surface-700">
      {/* Tabs */}
      <div className="flex border-b border-surface-700">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 text-2xs font-medium transition-all ${
              activeTab === tab.id
                ? 'text-blue-400 bg-surface-800 border-b-2 border-blue-500'
                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
            }`}
          >
            <span className="text-sm">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-3">
        {activeTab === 'media' && (
          <div className="space-y-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 border-2 border-dashed border-surface-600 rounded-lg hover:border-blue-500 hover:bg-surface-800/50 transition-all group cursor-pointer"
            >
              <div className="flex flex-col items-center gap-1">
                <span className="text-2xl text-surface-400 group-hover:text-blue-400 transition-colors">📤</span>
                <span className="text-xs text-surface-400 group-hover:text-surface-200">Upload Media</span>
                <span className="text-2xs text-surface-500">MP4, MOV, MP3, WAV</span>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept="video/*,audio/*" multiple className="hidden" onChange={handleFileUpload} />
            <div className="space-y-1">
              <span className="text-xs text-surface-400 font-medium">Stock Videos</span>
              {['Beach Sunset', 'City Timelapse', 'Mountain View', 'Ocean Waves'].map((name, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-md bg-surface-800 hover:bg-surface-700 cursor-pointer transition-colors"
                  onClick={() => {
                    const trackId = 'track-video-1';
                    const start = Math.max(...tracks.find(t => t.id === trackId)?.clips.map(c => c.startTime + c.duration) || [0]);
                    onAddClip({
                      id: `stock-${Date.now()}-${i}`,
                      type: 'video',
                      trackId,
                      label: name,
                      startTime: start,
                      duration: 5,
                      color: ['#f59e0b', '#3b82f6', '#10b981', '#06b6d4'][i],
                      volume: 1,
                      speed: 1,
                      opacity: 1,
                    });
                  }}
                >
                  <div className={`w-10 h-10 rounded bg-gradient-to-br ${['from-amber-400 to-orange-500', 'from-blue-400 to-indigo-500', 'from-emerald-400 to-teal-500', 'from-cyan-400 to-blue-500'][i]} flex items-center justify-center text-white text-xs`}>
                    🎬
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-surface-200 truncate">{name}</div>
                    <div className="text-2xs text-surface-500">00:05</div>
                  </div>
                  <span className="text-surface-500 text-xs">+</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'text' && (
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs text-surface-400 font-medium">Add Text Overlay</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddText()}
                  placeholder="Enter text..."
                  className="flex-1 px-3 py-1.5 bg-surface-800 border border-surface-600 rounded text-xs text-white placeholder-surface-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddText}
                  disabled={!textInput.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-surface-700 disabled:text-surface-500 rounded text-xs font-medium transition-colors"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-surface-400 font-medium">Templates</span>
              {['Title', 'Subtitle', 'Caption', 'Quote'].map((t, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 rounded-md bg-surface-800 hover:bg-surface-700 cursor-pointer transition-colors"
                  onClick={() => {
                    const track = tracks.find(t => t.kind === 'text');
                    if (!track) return;
                    onAddText(t + ' Text', track.id);
                  }}
                >
                  <div className="w-8 h-8 rounded bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white text-xs">
                    T
                  </div>
                  <span className="text-xs text-surface-200">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'transitions' && (
          <div className="space-y-1">
            <span className="text-xs text-surface-400 font-medium mb-2 block">Transitions</span>
            <div className="grid grid-cols-2 gap-2">
              {transitions.map(t => (
                <div
                  key={t.id}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-surface-800 hover:bg-surface-700 cursor-pointer transition-colors group"
                >
                  <div className="w-full aspect-video rounded bg-surface-700 flex items-center justify-center text-xl text-surface-300 group-hover:text-blue-400 transition-colors">
                    {t.icon}
                  </div>
                  <span className="text-2xs text-surface-400">{t.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'stickers' && (
          <div className="space-y-1">
            <span className="text-xs text-surface-400 font-medium mb-2 block">Stickers</span>
            <div className="grid grid-cols-3 gap-2">
              {STICKERS.map(s => (
                <div
                  key={s.id}
                  className="flex flex-col items-center gap-1 p-3 rounded-lg bg-surface-800 hover:bg-surface-700 cursor-pointer transition-colors group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{s.emoji}</span>
                  <span className="text-2xs text-surface-400">{s.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <span className="text-xs text-surface-400 font-medium">Sound Effects</span>
              {audioEffects.map(e => (
                <div
                  key={e.id}
                  className="flex items-center gap-2 p-2 rounded-md bg-surface-800 hover:bg-surface-700 cursor-pointer transition-colors"
                >
                  <span className="text-sm text-surface-300">{e.icon}</span>
                  <span className="text-xs text-surface-200">{e.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export { Sidebar };
