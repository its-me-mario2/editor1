import { TransitionDef, FilterPreset, AudioEffect, Track } from './types';

export const DEFAULT_TRANSITIONS: TransitionDef[] = [
  { id: 'crossfade', name: 'Cross-fade', icon: String.fromCharCode(0x27F7) },
  { id: 'blur', name: 'Blur', icon: String.fromCharCode(0x25CE) },
  { id: 'slide', name: 'Slide', icon: String.fromCharCode(0x21C4) },
  { id: 'dissolve', name: 'Dissolve', icon: String.fromCharCode(0x25D1) },
  { id: 'wipe', name: 'Wipe', icon: String.fromCharCode(0x21E8) },
  { id: 'zoom', name: 'Zoom', icon: String.fromCharCode(0x2295) },
  { id: 'fade', name: 'Fade', icon: String.fromCharCode(0x25D0) },
  { id: 'pixelate', name: 'Pixelate', icon: String.fromCharCode(0x25A3) },
];

export const FILTER_PRESETS: FilterPreset[] = [
  { id: 'normal', name: 'Normal', class_: '' },
  { id: 'grayscale', name: 'Grayscale', class_: 'grayscale' },
  { id: 'sepia', name: 'Sepia', class_: 'sepia' },
  { id: 'invert', name: 'Invert', class_: 'invert' },
  { id: 'vintage', name: 'Vintage', class_: 'sepia brightness-90 contrast-110' },
  { id: 'vivid', name: 'Vivid', class_: 'saturate-150 contrast-110' },
  { id: 'noir', name: 'Noir', class_: 'grayscale contrast-130 brightness-90' },
  { id: 'pastel', name: 'Pastel', class_: 'saturate-50 brightness-110' },
];

export const AUDIO_EFFECTS: AudioEffect[] = [
  { id: 'none', name: 'None', icon: String.fromCharCode(0x2298) },
  { id: 'echo', name: 'Echo', icon: String.fromCharCode(0x21BB) },
  { id: 'reverb', name: 'Reverb', icon: '\uFF5E' },
  { id: 'bassboost', name: 'Bass Boost', icon: String.fromCharCode(0x25E2) },
  { id: 'treble', name: 'Treble', icon: String.fromCharCode(0x25E4) },
  { id: 'robot', name: 'Robot', icon: String.fromCharCode(0x2699) },
];

export function createInitialTracks(): Track[] {
  return [
    {
      id: 'track-video-1', kind: 'video', label: 'Video 1', order: 0,
      clips: [
        { id: 'clip-1', type: 'video', trackId: 'track-video-1', label: 'Beach Sunset', startTime: 0, duration: 8, color: '#f59e0b', speed: 1, volume: 1, opacity: 1 },
        { id: 'clip-2', type: 'video', trackId: 'track-video-1', label: 'City Timelapse', startTime: 8, duration: 6, color: '#3b82f6', speed: 1, volume: 1, opacity: 1 },
        { id: 'clip-3', type: 'video', trackId: 'track-video-1', label: 'Mountain View', startTime: 14, duration: 7, color: '#10b981', speed: 1, volume: 1, opacity: 1 },
      ],
    },
    {
      id: 'track-video-2', kind: 'video', label: 'Video 2', order: 1,
      clips: [
        { id: 'clip-v2', type: 'video', trackId: 'track-video-2', label: 'Overlay Clip', startTime: 3, duration: 5, color: '#ec4899', speed: 1, volume: 1, opacity: 0.8 },
      ],
    },
    {
      id: 'track-audio-1', kind: 'audio', label: 'Audio', order: 2,
      clips: [
        { id: 'clip-a1', type: 'audio', trackId: 'track-audio-1', label: 'Background Music', startTime: 0, duration: 21, color: '#8b5cf6', volume: 0.7 },
      ],
    },
    {
      id: 'track-text-1', kind: 'text', label: 'Text', order: 3,
      clips: [
        { id: 'clip-t1', type: 'text', trackId: 'track-text-1', label: 'Title', startTime: 1, duration: 4, text: 'Amazing View', fontSize: 36, fontColor: '#ffffff', bgColor: 'rgba(0,0,0,0.5)', fadeIn: 0.5, fadeOut: 0.5, posX: 0.5, posY: 0.3 },
        { id: 'clip-t2', type: 'text', trackId: 'track-text-1', label: 'Caption', startTime: 10, duration: 3, text: 'Nature is beautiful', fontSize: 24, fontColor: '#ffffff', bgColor: 'rgba(0,0,0,0.3)', fadeIn: 0.3, fadeOut: 0.3, posX: 0.5, posY: 0.85 },
      ],
    },
  ];
}

export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 100);
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
}

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}
