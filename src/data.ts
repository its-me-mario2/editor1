import { Transition, FilterPreset, AudioEffect, Track, Clip } from './types';

export const DEFAULT_TRANSITIONS: Transition[] = [
  { id: 'crossfade', name: 'Cross-fade', icon: '⟷' },
  { id: 'blur', name: 'Blur', icon: '◎' },
  { id: 'slide', name: 'Slide', icon: '⇄' },
  { id: 'dissolve', name: 'Dissolve', icon: '◑' },
  { id: 'wipe', name: 'Wipe', icon: '⇨' },
  { id: 'zoom', name: 'Zoom', icon: '⊕' },
  { id: 'fade', name: 'Fade', icon: '◐' },
  { id: 'pixelate', name: 'Pixelate', icon: '▣' },
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
  { id: 'none', name: 'None', icon: '⊘' },
  { id: 'echo', name: 'Echo', icon: '↻' },
  { id: 'reverb', name: 'Reverb', icon: '～' },
  { id: 'bassboost', name: 'Bass Boost', icon: '◢' },
  { id: 'treble', name: 'Treble', icon: '◤' },
  { id: 'robot', name: 'Robot', icon: '⚙' },
];

export function createInitialTracks(): Track[] {
  return [
    {
      id: 'track-video-1',
      kind: 'video',
      label: 'Video Track',
      clips: [
        {
          id: 'clip-1',
          type: 'video',
          trackId: 'track-video-1',
          label: 'Beach Sunset',
          startTime: 0,
          duration: 8,
          color: '#f59e0b',
          speed: 1,
          volume: 1,
          opacity: 1,
        },
        {
          id: 'clip-2',
          type: 'video',
          trackId: 'track-video-1',
          label: 'City Timelapse',
          startTime: 8,
          duration: 6,
          color: '#3b82f6',
          speed: 1,
          volume: 1,
          opacity: 1,
        },
        {
          id: 'clip-3',
          type: 'video',
          trackId: 'track-video-1',
          label: 'Mountain View',
          startTime: 14,
          duration: 7,
          color: '#10b981',
          speed: 1,
          volume: 1,
          opacity: 1,
        },
      ],
    },
    {
      id: 'track-audio-1',
      kind: 'audio',
      label: 'Audio Track',
      clips: [
        {
          id: 'clip-a1',
          type: 'audio',
          trackId: 'track-audio-1',
          label: 'Background Music',
          startTime: 0,
          duration: 21,
          color: '#8b5cf6',
          volume: 0.7,
        },
      ],
    },
    {
      id: 'track-text-1',
      kind: 'text',
      label: 'Text Overlays',
      clips: [
        {
          id: 'clip-t1',
          type: 'text',
          trackId: 'track-text-1',
          label: 'Title',
          startTime: 1,
          duration: 4,
          text: 'Amazing View',
          fontSize: 32,
          fontColor: '#ffffff',
          bgColor: 'rgba(0,0,0,0.5)',
          fadeIn: 0.5,
          fadeOut: 0.5,
        },
        {
          id: 'clip-t2',
          type: 'text',
          trackId: 'track-text-1',
          label: 'Caption',
          startTime: 10,
          duration: 3,
          text: 'Nature is beautiful',
          fontSize: 24,
          fontColor: '#ffffff',
          bgColor: 'rgba(0,0,0,0.3)',
          fadeIn: 0.3,
          fadeOut: 0.3,
        },
      ],
    },
  ];
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
