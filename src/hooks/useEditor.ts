import { useState, useCallback, useRef } from 'react';
import { Track, Clip, ClipType } from '../types';
import { createInitialTracks, clamp } from '../data';

let _id = 0;
function id(): string { return `c${++_id}-${Math.random().toString(36).slice(2, 6)}`; }

export function useEditor() {
  const [tracks, setTracks] = useState<Track[]>(() => createInitialTracks());
  const [currentTime, setCurrentTime] = useState(0);
  const [zoom, setZoom] = useState(150);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const playRef = useRef<number>(0);
  const tracksRef = useRef(tracks);
  tracksRef.current = tracks;
  const selRef = useRef(selectedClipId);
  selRef.current = selectedClipId;

  const history = useRef<{ t: Track[]; s: string | null }[]>([]);
  const hIdx = useRef(-1);
  const skipHis = useRef(false);

  function saveHistory(next: Track[]) {
    if (skipHis.current) { skipHis.current = false; return; }
    const entry = { t: JSON.parse(JSON.stringify(next)), s: selRef.current };
    const arr = history.current;
    arr.length = hIdx.current + 1;
    arr.push(entry);
    if (arr.length > 50) arr.shift();
    hIdx.current = arr.length - 1;
  }

  const updateTracks = useCallback((fn: (prev: Track[]) => Track[]) => {
    setTracks(prev => {
      const next = fn(prev);
      saveHistory(next);
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    if (hIdx.current < 0) return;
    const entry = history.current[hIdx.current];
    hIdx.current--;
    skipHis.current = true;
    setTracks(JSON.parse(JSON.stringify(entry.t)));
    setSelectedClipId(entry.s);
  }, []);

  const redo = useCallback(() => {
    if (hIdx.current + 1 >= history.current.length) return;
    hIdx.current++;
    const entry = history.current[hIdx.current];
    skipHis.current = true;
    setTracks(JSON.parse(JSON.stringify(entry.t)));
    setSelectedClipId(entry.s);
  }, []);

  const canUndo = hIdx.current >= 0;
  const canRedo = hIdx.current + 1 < history.current.length;

  const duration = Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 10);

  const getSelectedClip = useCallback((): Clip | null => {
    const id = selRef.current;
    if (!id) return null;
    for (const t of tracksRef.current) {
      const c = t.clips.find(x => x.id === id);
      if (c) return c;
    }
    return null;
  }, []);

  const addTrack = useCallback((kind: Track['kind'], label?: string) => {
    updateTracks(prev => {
      const maxO = Math.max(...prev.map(t => t.order), -1);
      const n = prev.filter(t => t.kind === kind).length + 1;
      return [...prev, { id: `tr-${id()}`, kind, label: label || `${kind.charAt(0).toUpperCase() + kind.slice(1)} ${n}`, order: maxO + 1, clips: [] }];
    });
  }, [updateTracks]);

  const removeTrack = useCallback((tid: string) => updateTracks(prev => prev.filter(t => t.id !== tid)), [updateTracks]);
  const toggleHidden = useCallback((tid: string) => updateTracks(prev => prev.map(t => t.id === tid ? { ...t, hidden: !t.hidden } : t)), [updateTracks]);
  const toggleLocked = useCallback((tid: string) => updateTracks(prev => prev.map(t => t.id === tid ? { ...t, locked: !t.locked } : t)), [updateTracks]);
  const reorderTrack = useCallback((tid: string, order: number) => updateTracks(prev => { const t = prev.find(x => x.id === tid); if (!t) return prev; const o = prev.filter(x => x.id !== tid).sort((a, b) => a.order - b.order); o.splice(clamp(order, 0, prev.length - 1), 0, t); return o.map((x, i) => ({ ...x, order: i })); }), [updateTracks]);

  const addClip = useCallback((trackId: string, p: Partial<Clip> & { type: ClipType; label: string; duration: number }) => {
    const cid = id();
    updateTracks(prev => prev.map(t => t.id !== trackId ? t : { ...t, clips: [...t.clips, { id: cid, type: p.type, trackId, label: p.label, startTime: p.startTime ?? 0, duration: p.duration, color: p.color || '#3b82f6', speed: p.speed ?? 1, volume: p.volume ?? 1, opacity: p.opacity ?? 1, scale: p.scale ?? 1, rotation: p.rotation ?? 0, text: p.text, fontSize: p.fontSize, fontColor: p.fontColor, bgColor: p.bgColor, fadeIn: p.fadeIn, fadeOut: p.fadeOut, posX: p.posX, posY: p.posY, zIndex: p.zIndex, transition: p.transition, keyframes: undefined, colorAdjust: p.colorAdjust }] }));
    return cid;
  }, [updateTracks]);

  const updateClip = useCallback((cid: string, ch: Partial<Clip>) => updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => c.id === cid ? { ...c, ...ch } : c) }))), [updateTracks]);

  const removeClip = useCallback((cid: string) => { updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.filter(c => c.id !== cid) }))); setSelectedClipId(p => p === cid ? null : p); }, [updateTracks]);

  const moveClip = useCallback((cid: string, st: number) => updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => c.id === cid ? { ...c, startTime: Math.max(0, st) } : c) }))), [updateTracks]);

  const trimClip = useCallback((cid: string, edge: 'left' | 'right', delta: number, iStart: number, iDur: number) => updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => { if (c.id !== cid) return c; if (edge === 'left') { const ns = Math.max(0, iStart + delta); return { ...c, startTime: ns, duration: Math.max(0.5, iDur - delta) }; } return { ...c, duration: Math.max(0.5, iDur + delta) }; }) }))), [updateTracks]);

  const splitClip = useCallback((cid: string, at: number) => updateTracks(prev => prev.map(t => { const idx = t.clips.findIndex(c => c.id === cid); if (idx === -1) return t; const c = t.clips[idx]; const local = at - c.startTime; if (local <= 0 || local >= c.duration) return t; const nc = [...t.clips]; nc.splice(idx, 1, { ...c, duration: local }, { ...c, id: id(), startTime: at, duration: c.duration - local }); return { ...t, clips: nc }; })), [updateTracks]);

  const addKeyframe = useCallback((cid: string, prop: string, time: number, value: number) => {
    updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => { if (c.id !== cid) return c; const kfs = { ...(c.keyframes || {}) }; const arr = [...((kfs as any)[prop] || [])]; const ei = arr.findIndex((k: any) => Math.abs(k.time - time) < 0.05); if (ei >= 0) arr[ei] = { time, value }; else arr.push({ time, value }); arr.sort((a: any, b: any) => a.time - b.time); (kfs as any)[prop] = arr; return { ...c, keyframes: kfs }; }) })));
  }, [updateTracks]);

  const removeKeyframe = useCallback((cid: string, prop: string, time: number) => {
    updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => { if (c.id !== cid) return c; const kfs = { ...(c.keyframes || {}) }; (kfs as any)[prop] = ((kfs as any)[prop] || []).filter((k: any) => Math.abs(k.time - time) >= 0.05); return { ...c, keyframes: kfs }; }) })));
  }, [updateTracks]);

  const setTransition = useCallback((cid: string, type: string, dur: number) => {
    updateTracks(prev => prev.map(t => ({ ...t, clips: t.clips.map(c => c.id === cid ? { ...c, transition: { type: type as any, duration: dur } } : c) })));
  }, [updateTracks]);

  const startPlay = useCallback(() => {
    setIsPlaying(true);
    playRef.current = performance.now();
    const step = (now: number) => {
      const dt = (now - playRef.current) / 1000;
      playRef.current = now;
      setCurrentTime(p => { const n = p + dt; const dur = Math.max(...tracksRef.current.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 10); if (n >= dur) { setIsPlaying(false); return 0; } return n; });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, []);

  const stopPlay = useCallback(() => { setIsPlaying(false); }, []);
  const togglePlayback = useCallback(() => { if (isPlaying) stopPlay(); else startPlay(); }, [isPlaying, startPlay, stopPlay]);
  const seek = useCallback((t: number) => setCurrentTime(clamp(t, 0, Math.max(...tracks.flatMap(t => t.clips.map(c => c.startTime + c.duration)), 10))), [tracks]);
  const selectClip = useCallback((id: string | null) => setSelectedClipId(id), []);

  return {
    tracks, setTracks: updateTracks, sortedTracks: [...tracks].sort((a, b) => a.order - b.order),
    currentTime, setCurrentTime, zoom, setZoom,
    selectedClipId, setSelectedClipId, isPlaying, setIsPlaying, duration,
    getSelectedClip,
    addTrack, removeTrack, toggleHidden, toggleLocked, reorderTrack,
    addClip, updateClip, removeClip, moveClip, trimClip, splitClip,
    addKeyframe, removeKeyframe, setTransition,
    togglePlayback, seek, selectClip,
    undo, redo, canUndo, canRedo,
  };
}

export function snapTime(proposed: number, allTracks: Track[], skipId: string, threshold = 0.15): number {
  let s = proposed;
  for (const tr of allTracks) {
    for (const c of tr.clips) {
      if (c.id === skipId) continue;
      if (Math.abs(proposed - c.startTime) < threshold) s = c.startTime;
      if (Math.abs(proposed - (c.startTime + c.duration)) < threshold) s = c.startTime + c.duration;
    }
  }
  return s;
}
