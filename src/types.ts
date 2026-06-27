export type ClipType = 'video' | 'audio' | 'text';
export type TrackKind = 'video' | 'audio' | 'text';
export type AspectRatio = '16:9' | '9:16' | '4:3' | '1:1';
export type Resolution = '720p' | '1080p';
export type SidebarTab = 'media' | 'text' | 'transitions' | 'stickers' | 'audio';

export interface Clip {
  id: string;
  type: ClipType;
  trackId: string;
  label: string;
  startTime: number;  // seconds from track start
  duration: number;
  src?: string;
  color?: string;
  // text overlay properties
  text?: string;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  fadeIn?: number;
  fadeOut?: number;
  // effect
  filter?: string;
  speed?: number;
  volume?: number;
  opacity?: number;
}

export interface Track {
  id: string;
  kind: TrackKind;
  label: string;
  clips: Clip[];
  locked?: boolean;
  hidden?: boolean;
}

export interface TimelineState {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number; // pixels per second
  selectedClipId: string | null;
  isPlaying: boolean;
}

export interface Transition {
  id: string;
  name: string;
  icon: string;
}

export interface FilterPreset {
  id: string;
  name: string;
  class_: string;
}

export interface AudioEffect {
  id: string;
  name: string;
  icon: string;
}
