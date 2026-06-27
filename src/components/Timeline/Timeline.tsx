import React, { useRef, useCallback, useEffect, useState } from 'react';
import { Track } from '../../types';
import TimelineTrack from './TimelineTrack';

interface TimelineProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number;
  isPlaying: boolean;
  selectedClipId: string | null;
  onSeek: (time: number) => void;
  onZoomChange: (z: number) => void;
  onSelectClip: (id: string | null) => void;
  onMoveClip: (clipId: string, newStart: number) => void;
  onTrimClip: (clipId: string, edge: 'left' | 'right', delta: number, initialStart: number, initialDuration: number) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onRemoveClip: (clipId: string) => void;
  onTogglePlayback: () => void;
  onAddTrack: (kind: Track['kind']) => void;
  onRemoveTrack: (trackId: string) => void;
  onToggleTrackHidden: (trackId: string) => void;
  onToggleTrackLocked: (trackId: string) => void;
  onReorderTrack: (trackId: string, newOrder: number) => void;
}

const TRACK_ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  text: 'Aa',
  sticker: '😀',
};

export default function Timeline({
  tracks, currentTime, duration, zoom, isPlaying, selectedClipId,
  onSeek, onZoomChange, onSelectClip, onMoveClip, onTrimClip, onSplitClip, onRemoveClip,
  onTogglePlayback, onAddTrack, onRemoveTrack, onToggleTrackHidden, onToggleTrackLocked, onReorderTrack,
}: TimelineProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragTrackRef = useRef<{ trackId: string; startY: number; startOrder: number } | null>(null);

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);
  const totalWidth = Math.max(duration * zoom, 4000);

  const handleRulerClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft || 0);
    onSeek(Math.max(0, x / zoom));
  }, [zoom, onSeek]);

  useEffect(() => {
    if (isPlaying && scrollRef.current) {
      const playheadX = currentTime * zoom;
      const cw = scrollRef.current.clientWidth;
      const sl = scrollRef.current.scrollLeft;
      if (playheadX < sl || playheadX > sl + cw - 80) {
        scrollRef.current.scrollTo({ left: playheadX - cw / 2, behavior: 'smooth' });
      }
    }
  }, [currentTime, zoom, isPlaying]);

  const handleTrackDragStart = useCallback((e: React.MouseEvent, trackId: string) => {
    e.preventDefault();
    const track = sortedTracks.find(t => t.id === trackId);
    if (!track) return;
    dragTrackRef.current = { trackId, startY: e.clientY, startOrder: track.order };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragTrackRef.current) return;
      const dy = ev.clientY - dragTrackRef.current.startY;
      const deltaOrder = Math.round(dy / 40);
      onReorderTrack(dragTrackRef.current.trackId, dragTrackRef.current.startOrder + deltaOrder);
    };

    const handleMouseUp = () => {
      dragTrackRef.current = null;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sortedTracks, onReorderTrack]);

  const ticks: React.ReactNode[] = [];
  const majorStep = Math.max(1, Math.floor(10 / (zoom / 100)));
  for (let t = 0; t <= duration; t += 0.5) {
    const isMajor = t % majorStep === 0;
    const x = t * zoom;
    ticks.push(
      <div key={`tick-${t}`} className="absolute top-0" style={{ left: `${x}px` }}>
        <div className={`${isMajor ? 'h-3 w-px bg-white/40' : 'h-1.5 w-px bg-white/20'}`} />
        {isMajor && (
          <span className="absolute top-3 left-1/2 -translate-x-1/2 text-[10px] text-white/40 tabular-nums whitespace-nowrap">
            {Math.floor(t / 60)}:{(t % 60).toString().padStart(2, '0')}
          </span>
        )}
      </div>,
    );
  }

  return (
    <div className="flex flex-col bg-zinc-900/95 border-t border-zinc-700/50">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-zinc-800">
        <button onClick={onTogglePlayback} className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors">
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span className="text-xs text-white/50 tabular-nums w-16">
          {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
        </span>
        <span className="text-xs text-white/30">/</span>
        <span className="text-xs text-white/30 tabular-nums w-16">
          {Math.floor(duration / 60)}:{(duration % 60).toFixed(1).padStart(4, '0')}
        </span>
        <div className="flex-1" />
        <button onClick={() => onAddTrack('video')} className="px-2 py-1 rounded text-[10px] bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors">+ Video</button>
        <button onClick={() => onAddTrack('text')} className="px-2 py-1 rounded text-[10px] bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 transition-colors">+ Text</button>
        <span className="text-[10px] text-white/30 mx-1">{zoom}%</span>
        <input type="range" min={50} max={500} value={zoom} onChange={e => onZoomChange(Number(e.target.value))} className="w-16 h-1 accent-white/50 cursor-pointer" />
      </div>

      <div className="flex" style={{ height: '200px' }}>
        {/* Track labels sidebar */}
        <div className="flex-shrink-0 w-32 bg-zinc-800/80 border-r border-zinc-700/50 overflow-y-auto overflow-x-hidden">
          <div className="h-6 border-b border-zinc-700/30 sticky top-0 bg-zinc-800 z-10 flex items-center px-2">
            <span className="text-[9px] text-white/20 uppercase tracking-wider">Layers</span>
          </div>
          {sortedTracks.map(track => (
            <div
              key={track.id}
              className="h-10 flex items-center gap-1 px-1.5 border-b border-zinc-700/30 bg-zinc-800/50 group cursor-grab active:cursor-grabbing"
              onMouseDown={(e) => handleTrackDragStart(e, track.id)}
            >
              <span className="text-[9px] text-white/20 cursor-grab">⠿</span>
              <span className="text-xs">{TRACK_ICONS[track.kind] || '📄'}</span>
              <span className="text-[10px] text-white/70 truncate flex-1">{track.label}</span>
              <button
                onClick={(e) => { e.stopPropagation(); onToggleTrackHidden(track.id); }}
                className={`text-[10px] p-0.5 rounded ${track.hidden ? 'text-red-400' : 'text-white/20 hover:text-white/50'}`}
                title={track.hidden ? 'Show' : 'Hide'}
              >
                {track.hidden ? '🙈' : '👁'}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onRemoveTrack(track.id); }}
                className="text-[10px] p-0.5 rounded text-white/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove track"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Scrollable timeline */}
        <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-auto relative">
          <div style={{ width: `${totalWidth}px`, minWidth: '100%', height: '100%' }}>
            {/* Ruler */}
            <div className="h-6 border-b border-zinc-700/30 sticky top-0 bg-zinc-800 z-10 cursor-pointer" onClick={handleRulerClick}>
              {ticks}
            </div>

            {/* Tracks */}
            {sortedTracks.map(track => (
              <TimelineTrack
                key={track.id}
                track={track}
                allTracks={tracks}
                isSelected={!!selectedClipId && track.clips.some(c => c.id === selectedClipId)}
                zoom={zoom}
                onSelectClip={onSelectClip}
                onMoveClip={onMoveClip}
                onTrimClip={onTrimClip}
                onSplitClip={onSplitClip}
                onRemoveClip={onRemoveClip}
                currentTime={currentTime}
              />
            ))}

            {/* Playhead line */}
            <div
              className="absolute top-6 w-0.5 bottom-0 bg-red-500/70 z-20 pointer-events-none shadow-[0_0_6px_rgba(239,68,68,0.4)]"
              style={{ left: `${currentTime * zoom}px` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
