export type ClipType = 'video' | 'audio' | 'text';
export type TrackKind = 'video' | 'audio' | 'text' | 'sticker';
export type AspectRatio = '16:9' | '9:16' | '4:3' | '1:1';
export type Resolution = '720p' | '1080p';
export type SidebarTab = 'media' | 'text' | 'transitions' | 'stickers' | 'audio';
export type TransitionType = 'crossfade' | 'dissolve' | 'slide' | 'wipe' | 'fade' | 'none';

export interface Keyframe {
  time: number;
  value: number;
}

export interface ColorAdjustment {
  brightness: number;
  contrast: number;
  saturation: number;
}

export interface ClipTransition {
  type: TransitionType;
  duration: number;
}

export interface Clip {
  id: string;
  type: ClipType;
  trackId: string;
  label: string;
  startTime: number;
  duration: number;
  src?: string;
  color?: string;
  text?: string;
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
  fadeIn?: number;
  fadeOut?: number;
  filter?: string;
  speed?: number;
  volume?: number;
  opacity?: number;
  posX?: number;
  posY?: number;
  scale?: number;
  rotation?: number;
  zIndex?: number;
  transition?: ClipTransition;
  keyframes?: {
    posX?: Keyframe[];
    posY?: Keyframe[];
    opacity?: Keyframe[];
    scale?: Keyframe[];
    rotation?: Keyframe[];
  };
  colorAdjust?: ColorAdjustment;
}

export interface Track {
  id: string;
  kind: TrackKind;
  label: string;
  order: number;
  clips: Clip[];
  locked?: boolean;
  hidden?: boolean;
}

export interface EditorState {
  tracks: Track[];
  currentTime: number;
  duration: number;
  zoom: number;
  selectedClipId: string | null;
  isPlaying: boolean;
}

export interface TransitionDef {
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
