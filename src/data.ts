import { Track, TransitionDef, FilterPreset, AudioEffect } from './types';

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
  return [];
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
