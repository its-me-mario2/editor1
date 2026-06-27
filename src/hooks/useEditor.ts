import { useState, useCallback, useRef } from 'react';
import { Track, Clip, ClipType } from '../types';
import { createInitialTracks, clamp } from '../data';

function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function useEditor() {
  const [tracks, setTracks] = useState<Track[]>(() => createInitialTracks());
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(150);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playbackRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  const duration = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 10);

  const getSelectedClip = useCallback((): Clip | null => {
    if (!selectedClipId) return null;
    for (const t of tracks) {
      const c = t.clips.find(c => c.id === selectedClipId);
      if (c) return c;
    }
    return null;
  }, [tracks, selectedClipId]);

  const sortedTracks = [...tracks].sort((a, b) => a.order - b.order);

  const addTrack = useCallback((kind: Track['kind'], label?: string) => {
    setTracks(prev => {
      const maxOrder = Math.max(...prev.map(t => t.order), -1);
      return [...prev, {
        id: `track-${generateId()}`,
        kind,
        label: label || `${kind === 'video' ? 'Video' : kind === 'audio' ? 'Audio' : kind === 'sticker' ? 'Sticker' : 'Text'} ${prev.filter(t => t.kind === kind).length + 1}`,
        order: maxOrder + 1,
        clips: [],
      }];
    });
  }, []);

  const removeTrack = useCallback((trackId: string) => {
    setTracks(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const toggleTrackHidden = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, hidden: !t.hidden } : t));
  }, []);

  const toggleTrackLocked = useCallback((trackId: string) => {
    setTracks(prev => prev.map(t => t.id === trackId ? { ...t, locked: !t.locked } : t));
  }, []);

  const reorderTrack = useCallback((trackId: string, newOrder: number) => {
    setTracks(prev => {
      const track = prev.find(t => t.id === trackId);
      if (!track) return prev;
      const others = prev.filter(t => t.id !== trackId).sort((a, b) => a.order - b.order);
      const clampedOrder = clamp(newOrder, 0, prev.length - 1);
      others.splice(clampedOrder, 0, track);
      return others.map((t, i) => ({ ...t, order: i }));
    });
  }, []);

  const addClip = useCallback((trackId: string, partial: Partial<Clip> & { type: ClipType; label: string; duration: number }) => {
    const id = `clip-${generateId()}`;
    setTracks(prev => prev.map(t => {
      if (t.id !== trackId) return t;
      const newClip: Clip = {
        id,
        type: partial.type,
        trackId,
        label: partial.label,
        startTime: partial.startTime ?? 0,
        duration: partial.duration,
        color: partial.color || (partial.type === 'video' ? '#3b82f6' : partial.type === 'audio' ? '#8b5cf6' : '#f59e0b'),
        speed: partial.speed ?? 1,
        volume: partial.volume ?? 1,
        opacity: partial.opacity ?? 1,
        scale: partial.scale ?? 1,
        rotation: partial.rotation ?? 0,
        text: partial.text,
        fontSize: partial.fontSize,
        fontColor: partial.fontColor,
        bgColor: partial.bgColor,
        fadeIn: partial.fadeIn,
        fadeOut: partial.fadeOut,
        posX: partial.posX,
        posY: partial.posY,
        zIndex: partial.zIndex,
        transition: partial.transition,
        keyframes: partial.keyframes,
        colorAdjust: partial.colorAdjust,
      };
      return { ...t, clips: [...t.clips, newClip] };
    }));
    return id;
  }, []);

  const updateClip = useCallback((clipId: string, changes: Partial<Clip>) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === clipId ? { ...c, ...changes } : c),
    })));
  }, []);

  const removeClip = useCallback((clipId: string) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.filter(c => c.id !== clipId),
    })));
    setSelectedClipId(prev => prev === clipId ? null : prev);
  }, []);

  const moveClip = useCallback((clipId: string, newStart: number) => {
    setTracks(prev => prev.map(t => {
      if (!t.clips.some(c => c.id === clipId)) return t;
      return {
        ...t,
        clips: t.clips.map(c => c.id === clipId ? { ...c, startTime: Math.max(0, newStart) } : c),
      };
    }));
  }, []);

  const moveClipToTrack = useCallback((clipId: string, targetTrackId: string, newStart: number) => {
    setTracks(prev => {
      let movedClip: Clip | null = null;
      const without = prev.map(t => ({
        ...t,
        clips: t.clips.filter(c => {
          if (c.id === clipId) { movedClip = c; return false; }
          return true;
        }),
      }));
      if (!movedClip) return prev;
      return without.map(t =>
        t.id === targetTrackId
          ? { ...t, clips: [...t.clips, { ...movedClip!, startTime: Math.max(0, newStart), trackId: targetTrackId }].sort((a, b) => a.startTime - b.startTime) }
          : t
      );
    });
  }, []);

  const trimClip = useCallback((clipId: string, edge: 'left' | 'right', delta: number, initialStart: number, initialDuration: number) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        if (edge === 'left') {
          const newStart = Math.max(0, initialStart + delta);
          return { ...c, startTime: newStart, duration: Math.max(0.5, initialDuration - delta) };
        }
        return { ...c, duration: Math.max(0.5, initialDuration + delta) };
      }),
    })));
  }, []);

  const splitClip = useCallback((clipId: string, splitTime: number) => {
    setTracks(prev => prev.map(t => {
      const idx = t.clips.findIndex(c => c.id === clipId);
      if (idx === -1) return t;
      const clip = t.clips[idx];
      const localSplit = splitTime - clip.startTime;
      if (localSplit <= 0 || localSplit >= clip.duration) return t;
      const rightClip: Clip = { ...clip, id: `clip-${generateId()}`, startTime: splitTime, duration: clip.duration - localSplit };
      const leftClip: Clip = { ...clip, duration: localSplit };
      const newClips = [...t.clips];
      newClips.splice(idx, 1, leftClip, rightClip);
      return { ...t, clips: newClips };
    }));
  }, []);

  const addKeyframe = useCallback((clipId: string, property: string, time: number, value: number) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        const kfs = { ...(c.keyframes || {}) };
        const arr = [...(kfs[property as keyof typeof kfs] || [])];
        const existing = arr.findIndex(k => Math.abs(k.time - time) < 0.05);
        if (existing >= 0) arr[existing] = { time, value };
        else arr.push({ time, value });
        arr.sort((a, b) => a.time - b.time);
        kfs[property as keyof typeof kfs] = arr;
        return { ...c, keyframes: kfs as any };
      }),
    })));
  }, []);

  const removeKeyframe = useCallback((clipId: string, property: string, time: number) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        const kfs = { ...(c.keyframes || {}) };
        const arr = (kfs[property as keyof typeof kfs] || []).filter(k => Math.abs(k.time - time) >= 0.05);
        kfs[property as keyof typeof kfs] = arr;
        return { ...c, keyframes: kfs as any };
      }),
    })));
  }, []);

  const setTransition = useCallback((clipId: string, type: string, duration: number) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c =>
        c.id === clipId
          ? { ...c, transition: { type: type as any, duration } }
          : c
      ),
    })));
  }, []);

  const startPlayback = useCallback(() => {
    setIsPlaying(true);
    lastFrameRef.current = performance.now();
    const step = (now: number) => {
      const dt = (now - lastFrameRef.current) / 1000;
      lastFrameRef.current = now;
      setCurrentTime(prev => {
        const next = prev + dt;
        if (next >= duration) { setIsPlaying(false); return 0; }
        return next;
      });
      playbackRef.current = requestAnimationFrame(step);
    };
    playbackRef.current = requestAnimationFrame(step);
  }, [duration]);

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    if (playbackRef.current !== null) { cancelAnimationFrame(playbackRef.current); playbackRef.current = null; }
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) stopPlayback();
    else startPlayback();
  }, [isPlaying, startPlayback, stopPlayback]);

  const seek = useCallback((time: number) => {
    setCurrentTime(clamp(time, 0, duration));
  }, [duration]);

  const selectClip = useCallback((id: string | null) => {
    setSelectedClipId(id);
  }, []);

  return {
    tracks, setTracks, sortedTracks,
    currentTime, setCurrentTime,
    zoom, setZoom,
    selectedClipId, setSelectedClipId,
    isPlaying, setIsPlaying, duration,
    getSelectedClip,
    addTrack, removeTrack, toggleTrackHidden, toggleTrackLocked, reorderTrack,
    addClip, updateClip, removeClip,
    moveClip, moveClipToTrack,
    trimClip, splitClip,
    addKeyframe, removeKeyframe,
    setTransition,
    togglePlayback, seek, selectClip,
  };
}
