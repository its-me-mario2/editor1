import React, { useRef, useCallback, useState, useEffect } from 'react';
import { Track, Clip } from '../types';
import { formatTime } from '../data';

interface TimelineProps {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number;
  selectedClipId: string | null;
  isPlaying: boolean;
  onSeek: (time: number) => void;
  onSelectClip: (id: string | null) => void;
  onMoveClip: (clipId: string, newStart: number) => void;
  onTrimClip: (clipId: string, edge: 'left' | 'right', delta: number) => void;
  onSplitClip: () => void;
  onDeleteClip: (clipId: string) => void;
  onZoomChange: (zoom: number) => void;
  timeToX: (time: number) => number;
  xToTime: (x: number) => number;
}

const RULER_HEIGHT = 28;
const TRACK_HEIGHT = 56;
const TRACK_GAP = 6;
const CLIP_MIN_WIDTH = 20;

const TIMELINE_BG = '#1e293b';
const TRACK_BG = '#0f172a';
const CLIP_COLORS: Record<string, string> = {
  video: 'from-amber-500 to-orange-500',
  audio: 'from-violet-500 to-purple-500',
  text: 'from-emerald-500 to-teal-500',
};

const TrackClip: React.FC<{
  clip: Clip;
  zoom: number;
  isSelected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent, clipId: string) => void;
  onTrimStart: (e: React.MouseEvent, clipId: string, edge: 'left' | 'right') => void;
  onDelete: () => void;
}> = ({ clip, zoom, isSelected, onSelect, onDragStart, onTrimStart, onDelete }) => {
  const x = clip.startTime * zoom;
  const w = clip.duration * zoom;

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-md cursor-grab active:cursor-grabbing group select-none
        bg-gradient-to-r ${CLIP_COLORS[clip.type] || 'from-gray-500 to-gray-600'}
        ${isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-surface-900' : 'opacity-90'}
        hover:opacity-100 transition-opacity`}
      style={{ left: x, width: Math.max(w, CLIP_MIN_WIDTH) }}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      onMouseDown={(e) => { if (e.button === 0 && !(e.target as HTMLElement).dataset.trim) onDragStart(e, clip.id); }}
    >
      {/* Trim left handle */}
      <div
        data-trim="left"
        className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 rounded-l-md z-10"
        onMouseDown={(e) => { e.stopPropagation(); onTrimStart(e, clip.id, 'left'); }}
      />
      {/* Trim right handle */}
      <div
        data-trim="right"
        className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-white/30 rounded-r-md z-10"
        onMouseDown={(e) => { e.stopPropagation(); onTrimStart(e, clip.id, 'right'); }}
      />

      <div className="flex items-center h-full px-2 gap-2 text-white text-2xs font-medium truncate">
        <span className="shrink-0 text-[10px]">
          {clip.type === 'video' ? '🎬' : clip.type === 'audio' ? '🎵' : '📝'}
        </span>
        <span className="truncate">{clip.label}</span>
        <span className="shrink-0 ml-auto opacity-70">{formatTime(clip.duration)}</span>
      </div>

      {/* Delete button */}
      {isSelected && (
        <button
          className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full text-[10px] leading-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
        >
          ✕
        </button>
      )}
    </div>
  );
};

const TimelineRuler: React.FC<{
  duration: number;
  zoom: number;
  currentTime: number;
  onSeek: (time: number) => void;
}> = ({ duration, zoom, currentTime, onSeek }) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);

  const getTimeFromEvent = useCallback((e: React.MouseEvent) => {
    if (!rulerRef.current) return 0;
    const rect = rulerRef.current.getBoundingClientRect();
    return Math.max(0, (e.clientX - rect.left) / zoom);
  }, [zoom]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    onSeek(getTimeFromEvent(e));
  }, [getTimeFromEvent, onSeek]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    setHoverTime(getTimeFromEvent(e));
  }, [getTimeFromEvent]);

  // Generate tick marks
  const totalWidth = duration * zoom;
  const majorInterval = zoom >= 150 ? 1 : zoom >= 60 ? 2 : 5;
  const minorInterval = majorInterval / 2;

  const ticks: { time: number; isMajor: boolean }[] = [];
  for (let t = 0; t <= duration; t += minorInterval) {
    ticks.push({ time: t, isMajor: Math.abs(t % majorInterval) < 0.001 });
  }

  return (
    <div
      ref={rulerRef}
      className="relative h-full select-none"
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoverTime(null)}
    >
      {ticks.map(({ time, isMajor }) => (
        <div
          key={time}
          className="absolute top-0 flex flex-col items-center"
          style={{ left: time * zoom }}
        >
          <div className={`${isMajor ? 'h-3 w-px bg-surface-400' : 'h-1.5 w-px bg-surface-600'}`} />
          {isMajor && (
            <span className="text-2xs text-surface-400 mt-0.5">{formatTime(time)}</span>
          )}
        </div>
      ))}
      {/* Hover indicator */}
      {hoverTime !== null && (
        <div
          className="absolute top-0 h-full w-px bg-white/20 z-10 pointer-events-none"
          style={{ left: hoverTime * zoom }}
        />
      )}
    </div>
  );
};

const Timeline: React.FC<TimelineProps> = ({
  tracks, currentTime, duration, zoom, selectedClipId, isPlaying,
  onSeek, onSelectClip, onMoveClip, onTrimClip, onSplitClip, onDeleteClip, onZoomChange,
  timeToX, xToTime,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    type: 'move' | 'trim';
    clipId: string;
    edge?: 'left' | 'right';
    startX: number;
    initialValue: number;
  } | null>(null);

  const handleDragStart = useCallback((e: React.MouseEvent, clipId: string) => {
    e.preventDefault();
    const clip = tracks.flatMap(t => t.clips).find(c => c.id === clipId);
    if (!clip) return;
    setDragState({
      type: 'move',
      clipId,
      startX: e.clientX,
      initialValue: clip.startTime,
    });
  }, [tracks]);

  const handleTrimStart = useCallback((e: React.MouseEvent, clipId: string, edge: 'left' | 'right') => {
    e.preventDefault();
    const clip = tracks.flatMap(t => t.clips).find(c => c.id === clipId);
    if (!clip) return;
    setDragState({
      type: 'trim',
      clipId,
      edge,
      startX: e.clientX,
      initialValue: edge === 'left' ? clip.startTime : clip.duration,
    });
  }, [tracks]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState) return;
      const delta = (e.clientX - dragState.startX) / zoom;
      if (dragState.type === 'move') {
        onMoveClip(dragState.clipId, dragState.initialValue + delta);
      } else if (dragState.type === 'trim' && dragState.edge) {
        const deltaTrim = (e.clientX - dragState.startX) / zoom;
        onTrimClip(dragState.clipId, dragState.edge, deltaTrim);
      }
    };
    const handleMouseUp = () => setDragState(null);
    if (dragState) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, zoom, onMoveClip, onTrimClip]);

  const totalWidth = Math.max(duration * zoom + 100, 800);

  const handleTimelineClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left + containerRef.current.scrollLeft;
    onSeek(x / zoom);
    onSelectClip(null);
  }, [zoom, onSeek, onSelectClip]);

  return (
    <div className="flex flex-col bg-surface-900 border-t border-surface-700 select-none">
      {/* Timeline toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-surface-700 bg-surface-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-surface-300">Timeline</span>
          <button
            onClick={onSplitClip}
            disabled={!selectedClipId}
            className="px-2 py-0.5 text-2xs bg-surface-700 hover:bg-surface-600 rounded text-surface-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Split (S)
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xs text-surface-400">{formatTime(currentTime)}</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onZoomChange(Math.max(20, zoom - 20))}
              className="w-5 h-5 flex items-center justify-center text-xs bg-surface-700 hover:bg-surface-600 rounded text-surface-300"
            >
              −
            </button>
            <input
              type="range"
              min={20}
              max={300}
              step={10}
              value={zoom}
              onChange={(e) => onZoomChange(Number(e.target.value))}
              className="w-20 h-1 accent-blue-500 cursor-pointer"
            />
            <button
              onClick={() => onZoomChange(Math.min(300, zoom + 20))}
              className="w-5 h-5 flex items-center justify-center text-xs bg-surface-700 hover:bg-surface-600 rounded text-surface-300"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Timeline body */}
      <div
        ref={containerRef}
        className="overflow-x-auto overflow-y-auto relative"
        style={{ maxHeight: '260px' }}
        onClick={handleTimelineClick}
      >
        <div style={{ width: totalWidth }}>
          {/* Ruler */}
          <div style={{ height: RULER_HEIGHT }} className="bg-surface-900 border-b border-surface-700 sticky top-0 z-10">
            <TimelineRuler duration={duration} zoom={zoom} currentTime={currentTime} onSeek={onSeek} />
          </div>

          {/* Tracks */}
          {tracks.map((track, index) => (
            <div
              key={track.id}
              className="relative"
              style={{ height: TRACK_HEIGHT, marginTop: index > 0 ? TRACK_GAP : 0 }}
            >
              {/* Track background */}
              <div className="absolute inset-0 bg-surface-900/80 border-b border-surface-800" />
              {/* Track label */}
              <div className="absolute left-0 top-0 bottom-0 w-24 flex items-center px-2 z-10 bg-surface-900/90 border-r border-surface-700">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px]">
                    {track.kind === 'video' ? '🎬' : track.kind === 'audio' ? '🎵' : '📝'}
                  </span>
                  <span className="text-2xs text-surface-300 truncate">{track.label}</span>
                </div>
              </div>
              {/* Drop zone */}
              <div className="absolute inset-0" style={{ left: 96 }}>
                {track.clips.map(clip => (
                  <TrackClip
                    key={clip.id}
                    clip={clip}
                    zoom={zoom}
                    isSelected={selectedClipId === clip.id}
                    onSelect={() => onSelectClip(clip.id)}
                    onDragStart={handleDragStart}
                    onTrimStart={handleTrimStart}
                    onDelete={() => onDeleteClip(clip.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 w-0.5 bg-red-500 z-20 pointer-events-none shadow-lg shadow-red-500/30"
          style={{
            left: currentTime * zoom,
            height: RULER_HEIGHT + (tracks.length * (TRACK_HEIGHT + TRACK_GAP)),
          }}
        >
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full -ml-[4.5px] -mt-1" />
        </div>
      </div>
    </div>
  );
};

export { Timeline };
