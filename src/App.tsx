import React, { useState, useEffect } from 'react';
import { Sidebar, PreviewPlayer, Timeline, PropertiesPanel, ExportModal } from './components';
import { Track, AspectRatio, SidebarTab } from './types';
import { useEditor } from './hooks/useEditor';

let _gid = 0;
function gid(): string { return `g${++_gid}`; }

export default function App() {
  const editor = useEditor();
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('media');
  const [exportOpen, setExportOpen] = useState(false);

  const selectedClip = editor.getSelectedClip();

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') { e.preventDefault(); editor.togglePlayback(); }
      if (e.code === 'KeyS' && !e.ctrlKey && !e.metaKey && editor.selectedClipId) { e.preventDefault(); editor.splitClip(editor.selectedClipId, editor.currentTime); }
      if (e.code === 'KeyZ' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); e.shiftKey ? editor.redo() : editor.undo(); }
      if (e.code === 'KeyY' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); editor.redo(); }
      if (e.code === 'ArrowLeft') { e.preventDefault(); editor.seek(editor.currentTime - 0.25); }
      if (e.code === 'ArrowRight') { e.preventDefault(); editor.seek(editor.currentTime + 0.25); }
      if ((e.code === 'Delete' || e.code === 'Backspace') && editor.selectedClipId) { e.preventDefault(); editor.removeClip(editor.selectedClipId); }
      if (e.code === 'KeyK' && editor.selectedClipId && selectedClip) { e.preventDefault(); editor.addKeyframe(editor.selectedClipId, 'posX', Math.max(0, editor.currentTime - selectedClip.startTime), selectedClip.posX ?? 0.5); }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [editor, selectedClip]);

  const ensureTrack = (kind: Track['kind'], label: string): string => {
    const existing = editor.tracks.find(t => t.kind === kind && t.label === label);
    if (existing) return existing.id;
    const maxOrder = Math.max(...editor.tracks.map(t => t.order), -1);
    const id = `tr-${gid()}`;
    editor.setTracks((prev: Track[]) => [...prev, { id, kind, label, order: maxOrder + 1, clips: [] }]);
    return id;
  };

  const handleAddTextClip = (text: string) => {
    const trackId = ensureTrack('text', 'Text Overlays');
    editor.addClip(trackId, { type: 'text', label: text.slice(0, 20), startTime: Math.max(0, editor.currentTime), duration: 4, text, fontSize: 36, fontColor: '#ffffff', bgColor: 'rgba(0,0,0,0.5)', posX: 0.5, posY: 0.4, fadeIn: 0.5, fadeOut: 0.5 });
  };

  const handleAddSticker = (emoji: string) => {
    const trackId = ensureTrack('text', 'Stickers');
    editor.addClip(trackId, { type: 'text', label: emoji, startTime: Math.max(0, editor.currentTime), duration: 4, text: emoji, fontSize: 48, posX: 0.5, posY: 0.5 });
  };

  const handleAddTransition = (type: string) => {
    if (selectedClip) editor.setTransition(selectedClip.id, type, 0.5);
  };

  return (
    <div className="h-screen flex flex-col bg-zinc-900 text-white overflow-hidden select-none">
      <header className="flex items-center px-4 py-1.5 bg-zinc-800/90 border-b border-zinc-700/50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎬</span>
          <span className="font-bold text-sm">ClipForge</span>
        </div>
        <div className="flex items-center gap-1 ml-4">
          <button onClick={editor.undo} disabled={!editor.canUndo} className="px-1.5 py-1 rounded text-[11px] bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-colors" title="Undo Ctrl+Z">↩</button>
          <button onClick={editor.redo} disabled={!editor.canRedo} className="px-1.5 py-1 rounded text-[11px] bg-white/5 hover:bg-white/10 disabled:opacity-20 transition-colors" title="Redo Ctrl+Shift+Z">↪</button>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-2 text-[10px] text-white/20">
          <kbd className="px-1 py-0.5 rounded bg-white/5 text-white/30">Space</kbd><span>Play</span>
          <kbd className="px-1 py-0.5 rounded bg-white/5 text-white/30">S</kbd><span>Split</span>
          <kbd className="px-1 py-0.5 rounded bg-white/5 text-white/30">K</kbd><span>KF</span>
        </div>
        <div className="ml-4">
          <button onClick={() => setExportOpen(true)} className="px-3 py-1 rounded bg-blue-500 hover:bg-blue-400 text-white text-xs font-medium transition-colors shadow-lg shadow-blue-500/20">Export</button>
        </div>
      </header>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar activeTab={sidebarTab} onTabChange={setSidebarTab} onAddTextClip={handleAddTextClip} onAddSticker={handleAddSticker} onAddTransition={handleAddTransition} selectedClip={selectedClip} />
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-zinc-900/50">
            <PreviewPlayer tracks={editor.sortedTracks} currentTime={editor.currentTime} isPlaying={editor.isPlaying} aspectRatio={aspectRatio} onAspectRatioChange={setAspectRatio} onSeek={editor.seek} onTogglePlayback={editor.togglePlayback} />
          </div>
          <PropertiesPanel clip={selectedClip} tracks={editor.tracks} currentTime={editor.currentTime} onUpdateClip={editor.updateClip} onRemoveClip={editor.removeClip} onAddKeyframe={editor.addKeyframe} onRemoveKeyframe={editor.removeKeyframe} onSetTransition={editor.setTransition} />
        </div>
        <Timeline tracks={editor.tracks} currentTime={editor.currentTime} duration={editor.duration} zoom={editor.zoom} isPlaying={editor.isPlaying} selectedClipId={editor.selectedClipId} onSeek={editor.seek} onZoomChange={editor.setZoom} onSelectClip={editor.selectClip} onMoveClip={editor.moveClip} onTrimClip={editor.trimClip} onSplitClip={editor.splitClip} onRemoveClip={editor.removeClip} onTogglePlayback={editor.togglePlayback} onAddTrack={editor.addTrack} onRemoveTrack={editor.removeTrack} onToggleTrackHidden={editor.toggleHidden} onToggleTrackLocked={editor.toggleLocked} onReorderTrack={editor.reorderTrack} />
      </div>

      <ExportModal open={exportOpen} onClose={() => setExportOpen(false)} />
    </div>
  );
}
