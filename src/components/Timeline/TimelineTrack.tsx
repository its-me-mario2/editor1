import React, { useRef, useCallback } from 'react';
import { Track } from '../../types';

interface TimelineTrackProps {
  track: Track;
  isSelected: boolean;
  zoom: number;
  onSelectClip: (id: string | null) => void;
  onMoveClip: (clipId: string, newStart: number) => void;
  onTrimClip: (clipId: string, edge: 'left' | 'right', delta: number, initialStart: number, initialDuration: number) => void;
  onSplitClip: (clipId: string, splitTime: number) => void;
  onRemoveClip: (clipId: string) => void;
  currentTime: number;
}

const TRACK_COLORS: Record<string, string> = {
  video: 'border-l-blue-500/50',
  audio: 'border-l-purple-500/50',
  text: 'border-l-amber-500/50',
};

const ICONS: Record<string, string> = {
  video: '🎬',
  audio: '🎵',
  text: 'Aa',
};

const BAR_COLORS: Record<string, string> = {
  video: 'from-blue-500/40 to-blue-600/20 border-blue-500/50',
  audio: 'from-purple-500/40 to-purple-600/20 border-purple-500/50',
  text: 'from-amber-500/40 to-amber-600/20 border-amber-500/50',
};

interface DragState {
  clipId: string;
  type: 'move' | 'trim';
  edge?: 'left' | 'right';
  startX: number;
  initialStart: number;
  initialDuration: number;
}

export default function TimelineTrack({
  track, zoom, onSelectClip, onMoveClip, onTrimClip,
}: TimelineTrackProps) {
  const dragRef = useRef<DragState | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragRef.current || !trackRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const deltaSec = dx / zoom;

    if (dragRef.current.type === 'move') {
      onMoveClip(dragRef.current.clipId, dragRef.current.initialStart + deltaSec);
    } else if (dragRef.current.type === 'trim' && dragRef.current.edge) {
      onTrimClip(
        dragRef.current.clipId,
        dragRef.current.edge,
        deltaSec,
        dragRef.current.initialStart,
        dragRef.current.initialDuration,
      );
    }
  }, [zoom, onMoveClip, onTrimClip]);

  const handleMouseUp = useCallback(() => {
    dragRef.current = null;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  const onClipMoveStart = useCallback((e: React.MouseEvent, clipId: string) => {
    e.stopPropagation();
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    dragRef.current = {
      clipId, type: 'move', startX: e.clientX, initialStart: clip.startTime, initialDuration: clip.duration,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [track.clips, handleMouseMove, handleMouseUp]);

  const onClipTrimStart = useCallback((e: React.MouseEvent, clipId: string, edge: 'left' | 'right') => {
    e.stopPropagation();
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    dragRef.current = {
      clipId, type: 'trim', edge, startX: e.clientX, initialStart: clip.startTime, initialDuration: clip.duration,
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [track.clips, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={trackRef}
      data-track-id={track.id}
      className={`relative h-10 bg-zinc-800/50 border-b border-zinc-700/50 flex border-l-2 ${
        TRACK_COLORS[track.kind] || 'border-l-zinc-500/50'
      } ${track.hidden ? 'opacity-40' : ''}`}
    >
      {track.clips.map(clip => {
        const left = clip.startTime * zoom;
        const width = Math.max(4, clip.duration * zoom);
        const barColor = BAR_COLORS[clip.type] || BAR_COLORS.video;

        return (
          <div
            key={clip.id}
            className={`absolute h-[calc(100%-4px)] top-[2px] rounded cursor-grab active:cursor-grabbing select-none
              bg-gradient-to-r ${barColor} border border-white/15
              flex items-center px-1.5 overflow-hidden group`}
            style={{ left: `${left}px`, width: `${width}px`, minWidth: '20px' }}
            onClick={(e) => { e.stopPropagation(); onSelectClip(clip.id); }}
            onMouseDown={(e) => { if (e.button === 0) onClipMoveStart(e, clip.id); }}
          >
            <span className="text-[10px] mr-1">{ICONS[clip.type]}</span>
            <span className="text-[11px] text-white/90 font-medium truncate flex-1">{clip.label}</span>
            {width > 50 && (
              <span className="text-[9px] text-white/40 tabular-nums">{clip.duration.toFixed(1)}s</span>
            )}

            <div
              className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-white/25 transition-colors z-10 hidden group-hover:flex items-center justify-center"
              onMouseDown={(e) => { e.stopPropagation(); onClipTrimStart(e, clip.id, 'left'); }}
            >
              <div className="w-0.5 h-4 bg-white/60 rounded" />
            </div>
            <div
              className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-white/25 transition-colors z-10 hidden group-hover:flex items-center justify-center"
              onMouseDown={(e) => { e.stopPropagation(); onClipTrimStart(e, clip.id, 'right'); }}
            >
              <div className="w-0.5 h-4 bg-white/60 rounded" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
