import React, { useRef, useEffect, useCallback, useState } from 'react';
import { AspectRatio, Clip } from '../types';
import { formatTime } from '../data';

interface PreviewPlayerProps {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  selectedClip: Clip | null;
  tracks: { kind: string; clips: Clip[] }[];
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSkipFrame: (dir: -1 | 1) => void;
}

const ASPECT_RATIOS: { label: string; value: AspectRatio; w: number; h: number; icon: string }[] = [
  { label: 'YouTube', value: '16:9', w: 16, h: 9, icon: '🖥' },
  { label: 'TikTok', value: '9:16', w: 9, h: 16, icon: '📱' },
  { label: 'Classic', value: '4:3', w: 4, h: 3, icon: '🖼' },
  { label: 'Square', value: '1:1', w: 1, h: 1, icon: '⬜' },
];

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  currentTime, duration, isPlaying, selectedClip, tracks,
  onTogglePlay, onSeek, onSkipFrame,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('16:9');
  const [volume, setVolume] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentAspect = ASPECT_RATIOS.find(r => r.value === aspectRatio)!;

  // Render frame on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Clear
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, w, h);

    // Draw clips as colored bars with time indicator
    const visibleClips = tracks.flatMap(t => t.clips);

    // Draw a frame-accurate preview per clip
    let drawnContent = false;
    for (const clip of visibleClips) {
      const localTime = currentTime - clip.startTime;
      if (localTime < 0 || localTime > clip.duration) continue;
      drawnContent = true;

      if (clip.type === 'text') {
        // Render text overlay
        ctx.save();
        if (clip.bgColor) {
          ctx.fillStyle = clip.bgColor;
          ctx.fillRect(0, h * 0.3, w, h * 0.15);
        }
        ctx.fillStyle = clip.fontColor || '#ffffff';
        ctx.font = `bold ${(clip.fontSize || 32) * (w / 640)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(clip.text || '', w / 2, h * 0.375);
        ctx.restore();
      } else {
        // Draw video/audio clip visualization
        const progress = localTime / clip.duration;
        const gradient = ctx.createLinearGradient(0, 0, w, h);
        gradient.addColorStop(0, clip.color || '#3b82f6');
        gradient.addColorStop(progress, clip.color || '#3b82f6');
        gradient.addColorStop(progress + 0.01, '#ffffff');
        gradient.addColorStop(1, '#1e293b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Clip label
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = `600 ${Math.round(w * 0.04)}px system-ui, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(clip.label, w / 2, h / 2 - 20);

        // Time code
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.font = `${Math.round(w * 0.025)}px system-ui, sans-serif`;
        ctx.fillText(formatTime(localTime) + ' / ' + formatTime(clip.duration), w / 2, h / 2 + 20);

        // Playhead on clip
        const fw = w * 0.06;
        const fh = h * 0.03;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(w / 2 - fw / 2, h / 2 - fh / 2 + 24);
        ctx.lineTo(w / 2 + fw / 2, h / 2 - fh / 2 + 24);
        ctx.lineTo(w / 2, h / 2 + fh / 2 + 24);
        ctx.closePath();
        ctx.fill();
      }
      break; // only show top-most clip for now
    }

    if (!drawnContent) {
      // Empty state
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#475569';
      ctx.font = `${Math.round(w * 0.035)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Add media to timeline', w / 2, h / 2);
    }
  }, [currentTime, tracks]);

  // Resize canvas to container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(() => {
      const canvas = canvasRef.current;
      const rect = container.getBoundingClientRect();
      if (canvas) {
        canvas.width = rect.width - 4;
        canvas.height = rect.height - 4;
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); onTogglePlay(); }
      if (e.key === 'ArrowLeft') onSkipFrame(-1);
      if (e.key === 'ArrowRight') onSkipFrame(1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onTogglePlay, onSkipFrame]);

  return (
    <div className="flex flex-col h-full bg-surface-950">
      {/* Player container */}
      <div
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-black relative overflow-hidden group"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(true)}
      >
        <div
          className="relative bg-black/95 rounded-lg overflow-hidden shadow-2xl transition-all duration-300"
          style={{
            aspectRatio: `${currentAspect.w} / ${currentAspect.h}`,
            maxWidth: '100%',
            maxHeight: '100%',
            width: isFullscreen ? '100%' : 'auto',
            height: isFullscreen ? '100%' : 'auto',
          }}
        >
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain"
          />
        </div>

        {/* Aspect ratio selector */}
        <div className="absolute top-2 right-2 flex gap-1">
          {ASPECT_RATIOS.map(ar => (
            <button
              key={ar.value}
              onClick={() => setAspectRatio(ar.value)}
              className={`px-2 py-1 rounded text-2xs font-medium transition-all ${
                aspectRatio === ar.value
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-surface-800/80 text-surface-300 hover:bg-surface-700'
              }`}
              title={ar.label}
            >
              {ar.icon} {ar.value}
            </button>
          ))}
        </div>

        {/* Time display */}
        <div className="absolute bottom-14 left-2 bg-black/60 px-2 py-0.5 rounded text-xs font-mono text-white">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center justify-center gap-3 px-4 py-2 bg-surface-900 border-t border-surface-700">
        <button
          onClick={() => onSkipFrame(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-all"
          title="Previous frame (←)"
        >
          ⏮
        </button>
        <button
          onClick={onTogglePlay}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
          title="Play/Pause (Space)"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          onClick={() => onSkipFrame(1)}
          className="w-8 h-8 flex items-center justify-center rounded-md bg-surface-800 hover:bg-surface-700 text-surface-300 hover:text-white transition-all"
          title="Next frame (→)"
        >
          ⏭
        </button>

        {/* Seek bar */}
        <div className="flex-1 max-w-[300px] mx-2">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            className="w-full h-1 accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Volume */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-surface-400">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-16 h-1 accent-blue-500 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};

export { PreviewPlayer };
