import { useState, useCallback, useRef, useEffect } from 'react';
import { Clip, Track, TimelineState } from '../types';
import { createInitialTracks, clamp } from '../data';

function useTimeline() {
  const [tracks, setTracks] = useState<Track[]>(createInitialTracks());
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(21);
  const [zoom, setZoom] = useState(80); // px per second
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDraggingClip, setIsDraggingClip] = useState(false);
  const [isTrimming, setIsTrimming] = useState<'left' | 'right' | null>(null);

  const playIntervalRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // --- Playback ---
  useEffect(() => {
    if (isPlaying) {
      const startTime = performance.now();
      const startCurrentTime = currentTime;
      animFrameRef.current = requestAnimationFrame(function tick(now) {
        const elapsed = (now - startTime) / 1000;
        const next = startCurrentTime + elapsed;
        if (next >= duration) {
          setCurrentTime(duration);
          setIsPlaying(false);
          return;
        }
        setCurrentTime(next);
        animFrameRef.current = requestAnimationFrame(tick);
      });
    } else {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, duration]);

  const togglePlay = useCallback(() => {
    if (currentTime >= duration) {
      setCurrentTime(0);
    }
    setIsPlaying(p => !p);
  }, [currentTime, duration]);

  const seek = useCallback((time: number) => {
    setCurrentTime(clamp(time, 0, duration));
  }, [duration]);

  const skipFrame = useCallback((dir: -1 | 1) => {
    const frame = 1 / 30;
    setCurrentTime(t => clamp(t + dir * frame, 0, duration));
  }, [duration]);

  const updateDuration = useCallback(() => {
    let maxEnd = 0;
    tracks.forEach(t => {
      t.clips.forEach(c => {
        const end = c.startTime + c.duration;
        if (end > maxEnd) maxEnd = end;
      });
    });
    setDuration(Math.max(maxEnd, 10));
  }, [tracks]);

  // --- Clip selection ---
  const selectClip = useCallback((id: string | null) => {
    setSelectedClipId(id);
  }, []);

  const getSelectedClip = useCallback((): Clip | null => {
    if (!selectedClipId) return null;
    for (const t of tracks) {
      const found = t.clips.find(c => c.id === selectedClipId);
      if (found) return found;
    }
    return null;
  }, [tracks, selectedClipId]);

  // --- Update clip properties ---
  const updateClip = useCallback((clipId: string, changes: Partial<Clip>) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === clipId ? { ...c, ...changes } : c),
    })));
  }, []);

  // --- Clone & Split ---
  const splitClip = useCallback(() => {
    setTracks(prev => {
      const next = prev.map(t => ({ ...t, clips: [...t.clips] }));
      for (const track of next) {
        const idx = track.clips.findIndex(c =>
          c.id === selectedClipId ||
          (c.startTime < currentTime && c.startTime + c.duration > currentTime)
        );
        if (idx === -1) continue;
        const clip = track.clips[idx];
        const splitPoint = currentTime - clip.startTime;
        if (splitPoint <= 0 || splitPoint >= clip.duration) continue;

        const rightClip: Clip = {
          ...clip,
          id: clip.id + '-split-' + Date.now(),
          startTime: currentTime,
          duration: clip.duration - splitPoint,
        };
        track.clips[idx] = { ...clip, duration: splitPoint };
        track.clips.splice(idx + 1, 0, rightClip);
        break;
      }
      return next;
    });
  }, [currentTime, selectedClipId]);

  // --- Drag clip on timeline ---
  const moveClip = useCallback((clipId: string, newStart: number) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => c.id === clipId ? { ...c, startTime: Math.max(0, newStart) } : c),
    })));
  }, []);

  // --- Trim clip ---
  const trimClip = useCallback((clipId: string, edge: 'left' | 'right', delta: number) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.map(c => {
        if (c.id !== clipId) return c;
        if (edge === 'left') {
          const maxTrim = c.duration - 0.5;
          const trimAmount = clamp(delta, -c.startTime, maxTrim);
          return {
            ...c,
            startTime: c.startTime + trimAmount,
            duration: c.duration - trimAmount,
          };
        } else {
          const newDuration = clamp(c.duration + delta, 0.5, 30);
          return { ...c, duration: newDuration };
        }
      }),
    })));
  }, []);

  // --- Add clip ---
  const addClip = useCallback((clip: Clip) => {
    setTracks(prev => prev.map(t =>
      t.id === clip.trackId
        ? { ...t, clips: [...t.clips, clip] }
        : t
    ));
  }, []);

  // --- Delete clip ---
  const deleteClip = useCallback((clipId: string) => {
    setTracks(prev => prev.map(t => ({
      ...t,
      clips: t.clips.filter(c => c.id !== clipId),
    })));
    setSelectedClipId(prev => prev === clipId ? null : prev);
  }, []);

  // Timeline pixels helpers
  const timeToX = useCallback((time: number) => time * zoom, [zoom]);
  const xToTime = useCallback((x: number) => x / zoom, [zoom]);

  return {
    tracks,
    setTracks,
    currentTime,
    duration,
    zoom,
    setZoom,
    selectedClipId,
    isPlaying,
    togglePlay,
    seek,
    skipFrame,
    selectClip,
    getSelectedClip,
    updateClip,
    splitClip,
    moveClip,
    trimClip,
    addClip,
    deleteClip,
    timeToX,
    xToTime,
    isDraggingClip, setIsDraggingClip,
    isTrimming, setIsTrimming,
    updateDuration,
  };
}

export { useTimeline };
