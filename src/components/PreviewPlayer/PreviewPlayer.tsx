import React, { useRef, useEffect, useCallback } from 'react';
import { Track, AspectRatio } from '../../types';
import { renderFrame } from '../../utils/canvasRenderer';

interface PreviewPlayerProps {
  tracks: Track[];
  currentTime: number;
  isPlaying: boolean;
  aspectRatio: AspectRatio;
  onAspectRatioChange: (r: AspectRatio) => void;
  onSeek: (time: number) => void;
  onTogglePlayback: () => void;
}

const ASPECT_RATIOS: { label: string; value: AspectRatio; w: number; h: number }[] = [
  { label: '16:9', value: '16:9', w: 16, h: 9 },
  { label: '9:16', value: '9:16', w: 9, h: 16 },
  { label: '4:3', value: '4:3', w: 4, h: 3 },
  { label: '1:1', value: '1:1', w: 1, h: 1 },
];

export default function PreviewPlayer({
  tracks, currentTime, isPlaying, aspectRatio, onAspectRatioChange, onSeek, onTogglePlayback,
}: PreviewPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);

  const ar = ASPECT_RATIOS.find(a => a.value === aspectRatio) || ASPECT_RATIOS[0];
  const previewW = 480;
  const previewH = Math.round(previewW * (ar.h / ar.w));

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderFrame(ctx, tracks, currentTime, canvas.width, canvas.height);
  }, [tracks, currentTime]);

  useEffect(() => {
    draw();
  }, [draw, aspectRatio]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    onSeek(x * 30);
  }, [onSeek]);

  const handleCanvasDblClick = useCallback(() => {
    onTogglePlayback();
  }, [onTogglePlayback]);

  return (
    <div ref={containerRef} className="flex flex-col items-center bg-zinc-900/80 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-2 self-start">
        <span className="text-[11px] text-white/40 uppercase tracking-wider">Preview</span>
        <div className="flex-1" />
        <div className="flex gap-1">
          {ASPECT_RATIOS.map(a => (
            <button
              key={a.value}
              onClick={() => onAspectRatioChange(a.value)}
              className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${
                aspectRatio === a.value
                  ? 'bg-white/20 text-white'
                  : 'text-white/40 hover:text-white/60 hover:bg-white/10'
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="relative rounded-lg overflow-hidden bg-black shadow-xl cursor-pointer"
        style={{ width: `${previewW}px`, height: `${previewH}px` }}
        onClick={handleCanvasClick}
        onDoubleClick={handleCanvasDblClick}
      >
        <canvas
          ref={canvasRef}
          width={previewW * 2}
          height={previewH * 2}
          className="w-full h-full"
        />
      </div>

      <div className="flex items-center gap-2 mt-2 w-full max-w-[480px]">
        <button
          onClick={onTogglePlayback}
          className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors text-sm"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <span className="text-xs text-white/40 tabular-nums">
          {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(1).padStart(4, '0')}
        </span>
        <input
          type="range"
          min={0}
          max={30}
          step={0.05}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="flex-1 h-1 accent-red-500 cursor-pointer"
        />
      </div>
    </div>
  );
}
