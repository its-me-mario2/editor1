import React, { useState, useEffect, useRef } from 'react';
import { Resolution } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RESOLUTIONS: { label: Resolution; w: number; h: number }[] = [
  { label: '720p', w: 1280, h: 720 },
  { label: '1080p', w: 1920, h: 1080 },
];

const FPS_OPTIONS = [24, 30, 60];

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [fps, setFps] = useState(30);
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsExporting(false);
      setProgress(0);
      setShowComplete(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isExporting) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isExporting, onClose]);

  const startExport = () => {
    setIsExporting(true);
    setProgress(0);
    setShowComplete(false);

    let p = 0;
    intervalRef.current = window.setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 100) {
        p = 100;
        if (intervalRef.current) clearInterval(intervalRef.current);
        setIsExporting(false);
        setShowComplete(true);
      }
      setProgress(Math.min(p, 100));
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const res = RESOLUTIONS.find(r => r.label === resolution)!;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-surface-800 rounded-xl shadow-2xl border border-surface-700 w-full max-w-md mx-4 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">📤</span>
            <h2 className="text-sm font-semibold text-surface-100">Export Video</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="w-7 h-7 flex items-center justify-center rounded-md bg-surface-700 hover:bg-surface-600 text-surface-400 hover:text-white disabled:opacity-40 transition-colors text-xs"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Resolution */}
          <div>
            <label className="text-2xs text-surface-400 font-medium mb-2 block">Resolution</label>
            <div className="grid grid-cols-2 gap-2">
              {RESOLUTIONS.map(r => (
                <button
                  key={r.label}
                  onClick={() => setResolution(r.label)}
                  className={`flex flex-col items-center py-3 rounded-lg border transition-all ${
                    resolution === r.label
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-surface-600 bg-surface-900 text-surface-400 hover:border-surface-500'
                  }`}
                >
                  <span className="text-sm font-semibold">{r.label}</span>
                  <span className="text-2xs opacity-70">{r.w}×{r.h}</span>
                </button>
              ))}
            </div>
          </div>

          {/* FPS */}
          <div>
            <label className="text-2xs text-surface-400 font-medium mb-2 block">Frame Rate</label>
            <div className="flex gap-2">
              {FPS_OPTIONS.map(f => (
                <button
                  key={f}
                  onClick={() => setFps(f)}
                  className={`flex-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                    fps === f
                      ? 'border-blue-500 bg-blue-600/20 text-blue-300'
                      : 'border-surface-600 bg-surface-900 text-surface-400 hover:border-surface-500'
                  }`}
                >
                  {f} FPS
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-surface-900 rounded-lg p-3 space-y-1.5">
            <div className="flex justify-between text-2xs">
              <span className="text-surface-500">Format</span>
              <span className="text-surface-300">MP4 (H.264)</span>
            </div>
            <div className="flex justify-between text-2xs">
              <span className="text-surface-500">Dimensions</span>
              <span className="text-surface-300">{res.w} × {res.h}</span>
            </div>
            <div className="flex justify-between text-2xs">
              <span className="text-surface-500">FPS</span>
              <span className="text-surface-300">{fps}</span>
            </div>
          </div>

          {/* Progress */}
          {(isExporting || showComplete) && (
            <div className="space-y-2">
              <div className="flex justify-between text-2xs">
                <span className="text-surface-400">
                  {showComplete ? 'Render complete!' : 'Rendering...'}
                </span>
                <span className="text-surface-300 font-mono">{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-surface-900 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    showComplete ? 'bg-green-500' : 'bg-gradient-to-r from-blue-500 to-purple-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              {showComplete && (
                <div className="flex items-center gap-1.5 text-green-400 text-2xs">
                  <span>✅</span>
                  <span>Export complete — video saved</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-surface-700 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-1.5 text-xs text-surface-300 bg-surface-700 hover:bg-surface-600 disabled:opacity-40 rounded-md transition-colors"
          >
            {showComplete ? 'Close' : 'Cancel'}
          </button>
          {!isExporting && !showComplete && (
            <button
              onClick={startExport}
              className="px-5 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-md transition-colors shadow-lg shadow-blue-600/20"
            >
              Export
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export { ExportModal };
