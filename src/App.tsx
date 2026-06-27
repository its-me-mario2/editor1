import React, { useState, useCallback } from 'react';
import { SidebarTab, Clip } from './types';
import { useTimeline } from './hooks/useTimeline';
import { Timeline } from './components/Timeline';
import { PreviewPlayer } from './components/PreviewPlayer';
import { Sidebar } from './components/Sidebar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { ExportModal } from './components/ExportModal';
import { DEFAULT_TRANSITIONS, FILTER_PRESETS, AUDIO_EFFECTS } from './data';

const App: React.FC = () => {
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('media');
  const [showExport, setShowExport] = useState(false);

  const {
    tracks, setTracks,
    currentTime, duration, zoom, setZoom,
    selectedClipId, isPlaying,
    togglePlay, seek, skipFrame,
    selectClip, getSelectedClip, updateClip,
    splitClip, moveClip, trimClip, addClip, deleteClip,
    timeToX, xToTime,
  } = useTimeline();

  const selectedClip = getSelectedClip();

  const handleAddText = useCallback((text: string, trackId: string) => {
    const track = tracks.find(t => t.id === trackId);
    const lastClipEnd = track?.clips.length
      ? Math.max(...track.clips.map(c => c.startTime + c.duration))
      : 0;
    const newClip: Clip = {
      id: 'text-' + Date.now(),
      type: 'text',
      trackId,
      label: text.slice(0, 20),
      text,
      startTime: lastClipEnd,
      duration: 4,
      fontSize: 32,
      fontColor: '#ffffff',
      bgColor: 'rgba(0,0,0,0.5)',
      fadeIn: 0.5,
      fadeOut: 0.5,
    };
    addClip(newClip);
    setSidebarTab('text');
  }, [tracks, addClip]);

  const handleApplyFilter = useCallback((filterId: string) => {
    // handled via updateClip
  }, []);

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
      if (e.key.toLowerCase() === 's' && selectedClipId) {
        e.preventDefault();
        splitClip();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedClipId) {
          e.preventDefault();
          deleteClip(selectedClipId);
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedClipId, splitClip, deleteClip]);

  return (
    <div className="h-screen w-screen flex flex-col bg-surface-950 text-white overflow-hidden">
      {/* Title bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-surface-900 border-b border-surface-700 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-lg">🎬</span>
            <span className="text-sm font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              ClipForge
            </span>
          </div>
          <span className="text-2xs text-surface-500 hidden sm:inline">Beta</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-2xs text-surface-400 bg-surface-800 px-2 py-1 rounded-md">
            <span>Undo</span>
            <span className="text-surface-600">|</span>
            <span>Redo</span>
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 rounded-md text-xs font-medium text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105 active:scale-95"
          >
            <span>📤</span>
            Export
          </button>
        </div>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-1 min-h-0">
          {/* Left sidebar */}
          <aside className="w-64 shrink-0 hidden md:flex flex-col">
            <Sidebar
              activeTab={sidebarTab}
              onTabChange={setSidebarTab}
              transitions={DEFAULT_TRANSITIONS}
              filters={FILTER_PRESETS}
              audioEffects={AUDIO_EFFECTS}
              onAddText={handleAddText}
              onAddClip={addClip}
              onApplyFilter={handleApplyFilter}
              selectedClipId={selectedClipId}
              tracks={tracks}
            />
          </aside>

          {/* Center: Preview */}
          <main className="flex-1 flex flex-col min-w-0">
            <PreviewPlayer
              currentTime={currentTime}
              duration={duration}
              isPlaying={isPlaying}
              selectedClip={selectedClip}
              tracks={tracks}
              onTogglePlay={togglePlay}
              onSeek={seek}
              onSkipFrame={skipFrame}
            />
          </main>

          {/* Right properties panel */}
          <aside className="w-64 shrink-0 hidden lg:flex flex-col">
            <PropertiesPanel
              clip={selectedClip}
              onUpdateClip={updateClip}
              filters={FILTER_PRESETS}
              onApplyFilter={handleApplyFilter}
            />
          </aside>
        </div>

        {/* Bottom timeline */}
        <Timeline
          tracks={tracks}
          currentTime={currentTime}
          duration={duration}
          zoom={zoom}
          selectedClipId={selectedClipId}
          isPlaying={isPlaying}
          onSeek={seek}
          onSelectClip={selectClip}
          onMoveClip={moveClip}
          onTrimClip={trimClip}
          onSplitClip={splitClip}
          onDeleteClip={deleteClip}
          onZoomChange={setZoom}
          timeToX={timeToX}
          xToTime={xToTime}
        />
      </div>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-t border-surface-700 bg-surface-900">
        {(['media', 'text', 'transitions', 'stickers', 'audio'] as SidebarTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setSidebarTab(tab)}
            className={`flex-1 py-2 text-2xs font-medium transition-colors ${
              sidebarTab === tab ? 'text-blue-400 bg-surface-800' : 'text-surface-400'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Export modal */}
      <ExportModal isOpen={showExport} onClose={() => setShowExport(false)} />
    </div>
  );
};

export default App;
