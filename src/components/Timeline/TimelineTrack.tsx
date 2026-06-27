import React, { memo, useCallback, useRef } from 'react';
import Draggable, { DraggableData, DraggableEvent } from 'react-draggable';
import { Track, Clip } from '../../types';
import { snapTime } from '../../hooks/useEditor';

interface TimelineTrackProps {
  track: Track;
  allTracks: Track[];
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
  video: '🎬', audio: '🎵', text: 'Aa',
};

const BAR_COLORS: Record<string, string> = {
  video: 'from-blue-500/30 to-blue-600/10 border-blue-500/40',
  audio: 'from-purple-500/30 to-purple-600/10 border-purple-500/40',
  text: 'from-amber-500/30 to-amber-600/10 border-amber-500/40',
};

function TimelineTrackInner({ track, allTracks, zoom, onSelectClip, onMoveClip, onTrimClip }: TimelineTrackProps) {
  const moveDataRef = useRef<{ clipId: string; initialStart: number }>({ clipId: '', initialStart: 0 });
  const trimDataRef = useRef<{ clipId: string; edge: 'left' | 'right'; initialStart: number; initialDuration: number; startX: number } | null>(null);

  const handleDrag = useCallback((e: DraggableEvent, data: DraggableData) => {
    if (!moveDataRef.current.clipId) return;
    const proposed = moveDataRef.current.initialStart + data.x / zoom;
    const snapped = snapTime(proposed, allTracks, moveDataRef.current.clipId, 0.12);
    onMoveClip(moveDataRef.current.clipId, snapped);
  }, [zoom, onMoveClip, allTracks]);

  const handleTrimMouseDown = useCallback((e: React.MouseEvent, clipId: string, edge: 'left' | 'right') => {
    e.stopPropagation();
    const clip = track.clips.find(c => c.id === clipId);
    if (!clip) return;
    trimDataRef.current = { clipId, edge, initialStart: clip.startTime, initialDuration: clip.duration, startX: e.clientX };
    const handleMove = (ev: MouseEvent) => {
      if (!trimDataRef.current) return;
      const dx = ev.clientX - trimDataRef.current.startX;
      const deltaSec = dx / zoom;
      onTrimClip(trimDataRef.current.clipId, trimDataRef.current.edge, deltaSec, trimDataRef.current.initialStart, trimDataRef.current.initialDuration);
    };
    const handleUp = () => { trimDataRef.current = null; document.removeEventListener('mousemove', handleMove); document.removeEventListener('mouseup', handleUp); };
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [track.clips, zoom, onTrimClip]);

  return (
    <div
      data-track-id={track.id}
      className={`relative h-9 bg-zinc-800/30 border-b border-white/[0.03] flex border-l-2 ${TRACK_COLORS[track.kind] || 'border-l-zinc-500/50'} ${track.hidden ? 'opacity-30' : ''}`}
    >
      {track.clips.map(clip => {
        const left = clip.startTime * zoom;
        const width = Math.max(4, clip.duration * zoom);
        const barColor = BAR_COLORS[clip.type] || BAR_COLORS.video;
        const kfMarkers: { time: number; prop: string }[] = [];
        if (clip.keyframes) {
          for (const [prop, arr] of Object.entries(clip.keyframes)) {
            if (arr) for (const k of arr) kfMarkers.push({ time: k.time, prop });
          }
        }
        kfMarkers.sort((a, b) => a.time - b.time);
        const uniqueMarkers = kfMarkers.filter((m, i, a) => i === 0 || m.time !== a[i-1].time);

        return (
          // @ts-ignore - react-draggable v4 types are strict with position prop
          <Draggable
            key={clip.id}
            axis="x"
            position={{ x: clip.startTime * zoom, y: 0 }}
            onStart={() => { moveDataRef.current = { clipId: clip.id, initialStart: clip.startTime }; }}
            onDrag={handleDrag}
            onStop={() => { moveDataRef.current = { clipId: '', initialStart: 0 }; }}
          >
            <div
              className={`absolute h-[calc(100%-3px)] top-[1.5px] rounded cursor-grab active:cursor-grabbing select-none
                bg-gradient-to-r ${barColor} border border-white/[0.08]
                flex items-center px-1.5 overflow-hidden group
                ${(clip.transition?.type && clip.transition.type !== 'none') ? 'ring-1 ring-white/20' : ''}`}
              style={{ left: 0, width: `${width}px`, minWidth: '24px' }}
              onClick={(e) => { e.stopPropagation(); onSelectClip(clip.id); }}
            >
              {uniqueMarkers.map(m => (
                <div key={`${m.prop}-${m.time}`}
                  className="absolute top-0 bottom-0 w-0.5 bg-blue-400/70 z-10 pointer-events-none"
                  style={{ left: `${(m.time / clip.duration) * 100}%` }} />
              ))}
              <span className="text-[10px] mr-1 opacity-70">{ICONS[clip.type]}</span>
              <span className="text-[10px] text-white/80 font-medium truncate flex-1">{clip.label}</span>
              {width > 40 && <span className="text-[8px] text-white/30 tabular-nums ml-auto">{clip.duration.toFixed(1)}s</span>}

              <div className="absolute left-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-white/20 transition-colors z-10 hidden group-hover:flex items-center justify-center"
                onMouseDown={(e) => handleTrimMouseDown(e, clip.id, 'left')}>
                <div className="w-0.5 h-3 bg-white/40 rounded" />
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-2.5 cursor-col-resize hover:bg-white/20 transition-colors z-10 hidden group-hover:flex items-center justify-center"
                onMouseDown={(e) => handleTrimMouseDown(e, clip.id, 'right')}>
                <div className="w-0.5 h-3 bg-white/40 rounded" />
              </div>
            </div>
          </Draggable>
        );
      })}
    </div>
  );
}

const TimelineTrack = memo(TimelineTrackInner);
export default TimelineTrack;
