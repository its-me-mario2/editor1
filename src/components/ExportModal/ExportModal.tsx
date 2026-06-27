import React, { useState, useEffect } from 'react';
import { Resolution } from '../../types';

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ExportModal({ open, onClose }: ExportModalProps) {
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [fps, setFps] = useState(30);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setExporting(false);
      setProgress(0);
    }
  }, [open]);

  const handleExport = () => {
    setExporting(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = prev + Math.random() * 8 + 2;
        if (next >= 100) {
          clearInterval(interval);
          return 100;
        }
        return next;
      });
    }, 300);
  };

  if (!open) return null;

  const resLabels: Record<Resolution, { w: number; h: number }> = {
    '720p': { w: 1280, h: 720 },
    '1080p': { w: 1920, h: 1080 },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-zinc-800 rounded-xl border border-zinc-700 shadow-2xl w-[400px] p-6" onClick={e => e.stopPropagation()}>
        <h2 className="text-white text-lg font-semibold mb-4">Export Video</h2>

        {!exporting ? (
          <>
            <div className="space-y-3 mb-6">
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Resolution</p>
              <div className="flex gap-2">
                {(['720p', '1080p'] as Resolution[]).map(r => (
                  <button
                    key={r}
                    onClick={() => setResolution(r)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      resolution === r
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-zinc-700/50 text-white/50 border border-transparent hover:bg-zinc-600/50'
                    }`}
                  >
                    {r} ({resLabels[r].w}×{resLabels[r].h})
                  </button>
                ))}
              </div>

              <p className="text-[10px] text-white/30 uppercase tracking-wider">FPS</p>
              <div className="flex gap-2">
                {[24, 30, 60].map(f => (
                  <button
                    key={f}
                    onClick={() => setFps(f)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm transition-colors ${
                      fps === f
                        ? 'bg-white/20 text-white border border-white/30'
                        : 'bg-zinc-700/50 text-white/50 border border-transparent hover:bg-zinc-600/50'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded text-sm text-white/60 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-2 rounded bg-blue-500 hover:bg-blue-400 text-white text-sm font-medium transition-colors"
              >
                Export
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-4">
            <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-white/40">{progress < 100 ? 'Rendering...' : 'Complete!'}</span>
              <span className="text-white/60 tabular-nums">{Math.round(progress)}%</span>
            </div>
            {progress >= 100 && (
              <button
                onClick={onClose}
                className="w-full px-4 py-2 rounded bg-white/10 hover:bg-white/20 text-white text-sm transition-colors"
              >
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
