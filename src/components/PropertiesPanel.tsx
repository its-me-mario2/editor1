import React, { useState, useEffect } from 'react';
import { Clip, FilterPreset } from '../types';
import { FILTER_PRESETS } from '../data';

interface PropertiesPanelProps {
  clip: Clip | null;
  onUpdateClip: (clipId: string, changes: Partial<Clip>) => void;
  filters: FilterPreset[];
  onApplyFilter: (filterId: string) => void;
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  clip, onUpdateClip, filters, onApplyFilter,
}) => {
  if (!clip) {
    return (
      <div className="flex flex-col h-full bg-surface-900 border-l border-surface-700">
        <div className="p-3 border-b border-surface-700">
          <h3 className="text-xs font-medium text-surface-300">Properties</h3>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="text-center">
            <span className="text-2xl text-surface-600 block mb-2">👆</span>
            <p className="text-xs text-surface-500">Select a clip on the timeline to view its properties</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface-900 border-l border-surface-700 overflow-y-auto">
      <div className="p-3 border-b border-surface-700">
        <h3 className="text-xs font-medium text-surface-300">Properties</h3>
        <p className="text-2xs text-surface-500 mt-0.5">{clip.label}</p>
      </div>

      <div className="p-3 space-y-4">
        {/* Common properties */}
        {clip.type === 'video' && (
          <>
            <PropertySlider
              label="Speed"
              value={clip.speed ?? 1}
              min={0.25}
              max={4}
              step={0.25}
              display={`${clip.speed ?? 1}x`}
              onChange={(v) => onUpdateClip(clip.id, { speed: v })}
            />
            <PropertySlider
              label="Volume"
              value={clip.volume ?? 1}
              min={0}
              max={2}
              step={0.05}
              display={`${Math.round((clip.volume ?? 1) * 100)}%`}
              onChange={(v) => onUpdateClip(clip.id, { volume: v })}
            />
            <PropertySlider
              label="Opacity"
              value={clip.opacity ?? 1}
              min={0}
              max={1}
              step={0.05}
              display={`${Math.round((clip.opacity ?? 1) * 100)}%`}
              onChange={(v) => onUpdateClip(clip.id, { opacity: v })}
            />
          </>
        )}

        {clip.type === 'audio' && (
          <>
            <PropertySlider
              label="Volume"
              value={clip.volume ?? 1}
              min={0}
              max={2}
              step={0.05}
              display={`${Math.round((clip.volume ?? 1) * 100)}%`}
              onChange={(v) => onUpdateClip(clip.id, { volume: v })}
            />
          </>
        )}

        {clip.type === 'text' && (
          <>
            <div className="space-y-1.5">
              <label className="text-2xs text-surface-400 font-medium">Text Content</label>
              <input
                type="text"
                value={clip.text || ''}
                onChange={(e) => onUpdateClip(clip.id, { text: e.target.value })}
                className="w-full px-2 py-1.5 bg-surface-800 border border-surface-600 rounded text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <PropertySlider
              label="Font Size"
              value={clip.fontSize ?? 24}
              min={10}
              max={96}
              step={1}
              display={`${clip.fontSize ?? 24}px`}
              onChange={(v) => onUpdateClip(clip.id, { fontSize: v })}
            />
            <div className="space-y-1.5">
              <label className="text-2xs text-surface-400 font-medium">Text Color</label>
              <input
                type="color"
                value={clip.fontColor || '#ffffff'}
                onChange={(e) => onUpdateClip(clip.id, { fontColor: e.target.value })}
                className="w-full h-8 rounded cursor-pointer bg-surface-800 border border-surface-600"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-2xs text-surface-400 font-medium">Background</label>
              <input
                type="color"
                value={clip.bgColor && clip.bgColor !== 'rgba(0,0,0,0.5)' ? clip.bgColor : '#000000'}
                onChange={(e) => onUpdateClip(clip.id, { bgColor: e.target.value + '80' })}
                className="w-full h-8 rounded cursor-pointer bg-surface-800 border border-surface-600"
              />
            </div>
            <PropertySlider
              label="Fade In"
              value={clip.fadeIn ?? 0}
              min={0}
              max={3}
              step={0.1}
              display={`${clip.fadeIn ?? 0}s`}
              onChange={(v) => onUpdateClip(clip.id, { fadeIn: v })}
            />
            <PropertySlider
              label="Fade Out"
              value={clip.fadeOut ?? 0}
              min={0}
              max={3}
              step={0.1}
              display={`${clip.fadeOut ?? 0}s`}
              onChange={(v) => onUpdateClip(clip.id, { fadeOut: v })}
            />
          </>
        )}

        {/* Filters (for video) */}
        {clip.type === 'video' && (
          <div className="space-y-2">
            <label className="text-2xs text-surface-400 font-medium block">Filters</label>
            <div className="grid grid-cols-4 gap-1.5">
              {FILTER_PRESETS.map(f => (
                <button
                  key={f.id}
                  onClick={() => {
                    onUpdateClip(clip.id, { filter: f.id });
                    onApplyFilter(f.id);
                  }}
                  className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-colors ${
                    clip.filter === f.id
                      ? 'bg-blue-600/30 ring-1 ring-blue-500'
                      : 'bg-surface-800 hover:bg-surface-700'
                  }`}
                >
                  <div className={`w-full aspect-square rounded bg-gradient-to-br from-surface-600 to-surface-500 flex items-center justify-center ${f.class_}`}>
                    <span className="text-lg opacity-60">◉</span>
                  </div>
                  <span className="text-2xs text-surface-400 truncate w-full text-center">{f.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Clip timing info */}
        <div className="pt-2 border-t border-surface-700 space-y-1">
          <div className="flex justify-between text-2xs">
            <span className="text-surface-500">Start</span>
            <span className="text-surface-300 font-mono">{clip.startTime.toFixed(2)}s</span>
          </div>
          <div className="flex justify-between text-2xs">
            <span className="text-surface-500">Duration</span>
            <span className="text-surface-300 font-mono">{clip.duration.toFixed(2)}s</span>
          </div>
          <div className="flex justify-between text-2xs">
            <span className="text-surface-500">End</span>
            <span className="text-surface-300 font-mono">{(clip.startTime + clip.duration).toFixed(2)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const PropertySlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}> = ({ label, value, min, max, step, display, onChange }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between items-center">
      <label className="text-2xs text-surface-400 font-medium">{label}</label>
      <span className="text-2xs text-surface-500 font-mono">{display}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full h-1 accent-blue-500 cursor-pointer"
    />
  </div>
);

export { PropertiesPanel };
