import React, { useState } from 'react';
import { Sidebar, PreviewPlayer, Timeline, PropertiesPanel, ExportModal } from './components';
import { Track, AspectRatio, SidebarTab } from './types';
import { useEditor } from './hooks/useEditor';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export default function App() {
  const editor = useEditor();
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('media');
  const [exportOpen, setExportOpen] = useState(false);

  const selectedClip = editor.getSelectedClip();

  const handleAddTextClip = (text: string) => {
    let textTrack = editor.tracks.find((t: Track) => t.kind === 'text');
    if (!textTrack) {
      const id = `track-${generateId()}`;
      const maxOrder = Math.max(...editor.tracks.map((t: Track) => t.order), -1);
      editor.setTracks((prev: Track[]) => [...prev, {
        id, kind: 'text', label: 'Text Overlays', order: maxOrder + 1, clips: [],
      }]);
      textTrack = { id, kind: 'text', label: 'Text Overlays', order: maxOrder + 1, clips: [] };
    }
    if (textTrack) {
      const startTime = Math.max(0, editor.currentTime);
      editor.addClip(textTrack.id, {
        type: 'text', label: text.slice(0, 20), startTime, duration: 4, text,
        fontSize: 36, fontColor: '#ffffff', bgColor: 'rgba(0,0,0,0.5)',
        posX: 0.5, posY: 0.4, fadeIn: 0.5, fadeOut: 0.5,
      });
    }
  };

  const handleAddSticker = (emoji: string) => {
    let stickerTrack = editor.tracks.find((t: Track) => t.label === 'Stickers');
    if (!stickerTrack) {
      const id = `track-${generateId()}`;
      const maxOrder = Math.max(...editor.tracks.map((t: Track) => t.order), -1);
      editor.setTracks((prev: Track[]) => [...prev, {
        id, kind: 'text', label: 'Stickers', order: maxOrder + 1, clips: [],
      }]);
      stickerTrack = { id, kind: 'text', label: 'Stickers', order: maxOrder + 1, clips: [] };
    }
    if (stickerTrack) {
      const startTime = Math.max(0, editor.currentTime);
      editor.addClip(stickerTrack.id, {
        type: 'text', label: emoji, startTime, duration: 4, text: emoji,
        fontSize: 48, posX: 0.5, posY: 0.5,
      });
    }
  };

  const handleAddTransition = (type: string) => {
    if (!selectedClip) return;
    editor.setTransition(selectedClip.id, type, 0.5);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white overflow-hidden">
      {/* Header */}
      <header className="flex items-center px-4 py-2 bg-zinc-800/90 border-b border-zinc-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎬</span>
          <span className="font-bold text-sm">ClipForge</span>
        </div>
        <div className="flex-1" />
        <button onClick={() => setExportOpen(true)} className="px-4 py-1.5 rounded bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-colors">
          Export
        </button>
      </header>

      {/* Main workspace */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            activeTab={sidebarTab}
            onTabChange={setSidebarTab}
            onAddTextClip={handleAddTextClip}
            onAddSticker={handleAddSticker}
            onAddTransition={handleAddTransition}
            selectedClip={selectedClip}
          />

          <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-900/50">
            <PreviewPlayer
              tracks={editor.sortedTracks}
              currentTime={editor.currentTime}
              isPlaying={editor.isPlaying}
              aspectRatio={aspectRatio}
              onAspectRatioChange={setAspectRatio}
              onSeek={editor.seek}
              onTogglePlayback={editor.togglePlayback}
            />
          </div>

          <PropertiesPanel
            clip={selectedClip}
            tracks={editor.tracks}
            currentTime={editor.currentTime}
            onUpdateClip={editor.updateClip}
            onRemoveClip={editor.removeClip}
            onAddKeyframe={editor.addKeyframe}
            onRemoveKeyframe={editor.removeKeyframe}
            onSetTransition={editor.setTransition}
          />
        </div>

        <Timeline
          tracks={editor.tracks}
          currentTime={editor.currentTime}
          duration={editor.duration}
          zoom={editor.zoom}
          isPlaying={editor.isPlaying}
          selectedClipId={editor.selectedClipId}
          onSeek={editor.seek}
          onZoomChange={editor.setZoom}
          onSelectClip={editor.selectClip}
          onMoveClip={editor.moveClip}
          onTrimClip={editor.trimClip}
          onSplitClip={editor.splitClip}
          onRemoveClip={editor.removeClip}
          onTogglePlayback={editor.togglePlayback}
          onAddTrack={editor.addTrack}
          onRemoveTrack={editor.removeTrack}
          onToggleTrackHidden={editor.toggleTrackHidden}
          onToggleTrackLocked={editor.toggleTrackLocked}
          onReorderTrack={editor.reorderTrack}
        />
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
