import React, { useCallback } from 'react';
import { Clip, Track } from '../../types';
import { FILTER_PRESETS } from '../../data';

interface PropertiesPanelProps {
  clip: Clip | null;
  tracks: Track[];
  currentTime: number;
  onUpdateClip: (clipId: string, changes: Partial<Clip>) => void;
  onRemoveClip: (clipId: string) => void;
  onAddKeyframe: (clipId: string, property: string, time: number, value: number) => void;
  onRemoveKeyframe: (clipId: string, property: string, time: number) => void;
  onSetTransition: (clipId: string, type: string, duration: number) => void;
}

export default function PropertiesPanel({
  clip, tracks, currentTime, onUpdateClip, onRemoveClip, onAddKeyframe, onRemoveKeyframe, onSetTransition,
}: PropertiesPanelProps) {
  if (!clip) {
    return (
      <div className="w-64 flex flex-col bg-zinc-800/90 border-l border-zinc-700/50 p-4 overflow-y-auto">
        <p className="text-white/30 text-xs text-center mt-8">Select a clip to edit properties</p>
      </div>
    );
  }

  const track = tracks.find(t => t.id === clip.trackId);
  const trackLabel = track ? track.label : 'Unknown';
  const clipTime = currentTime - clip.startTime;

  const handleChange = useCallback(
    (key: string, value: number | string) => onUpdateClip(clip.id, { [key]: value }),
    [clip.id, onUpdateClip],
  );

  const toggleKeyframe = useCallback((property: string, value: number) => {
    const kfs = clip.keyframes?.[property as keyof typeof clip.keyframes] as { time: number; value: number }[] | undefined;
    const exists = kfs?.some(k => Math.abs(k.time - clipTime) < 0.05);
    if (exists) {
      onRemoveKeyframe(clip.id, property, clipTime);
    } else {
      onAddKeyframe(clip.id, property, clipTime, value);
    }
  }, [clip, clipTime, onAddKeyframe, onRemoveKeyframe]);

  const hasKf = (prop: string) =>
    clip.keyframes?.[prop as keyof typeof clip.keyframes]?.some((k: any) => Math.abs(k.time - clipTime) < 0.05);

  return (
    <div className="w-64 flex flex-col bg-zinc-800/90 border-l border-zinc-700/50 overflow-y-auto">
      <div className="p-3 border-b border-zinc-700/50">
        <h3 className="text-white text-sm font-medium truncate">{clip.label}</h3>
        <p className="text-[10px] text-white/30 mt-0.5">{trackLabel} · {clip.duration.toFixed(1)}s</p>
      </div>

      <div className="p-3 space-y-3">
        {/* Core properties */}
        <PropRow label="Start" value={`${clip.startTime.toFixed(1)}s`}>
          <input
            type="number" min={0} step={0.1} value={Number(clip.startTime.toFixed(1))}
            onChange={e => handleChange('startTime', Math.max(0, Number(e.target.value)))}
            className="w-full bg-zinc-700/50 border border-zinc-600 rounded px-2 py-1 text-white text-xs text-right outline-none focus:border-white/40"
          />
        </PropRow>

        <PropRow label="Duration" value={`${clip.duration.toFixed(1)}s`}>
          <input type="range" min={0.5} max={30} step={0.1} value={clip.duration}
            onChange={e => handleChange('duration', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
        </PropRow>

        {/* Section: Transform */}
        <SectionLabel>Transform</SectionLabel>

        <AnimPropRow label="Position X" value={`${Math.round((clip.posX ?? 0.5) * 100)}%`}
          hasKf={!!hasKf('posX')} onToggleKf={() => toggleKeyframe('posX', clip.posX ?? 0.5)}>
          <input type="range" min={0} max={1} step={0.01} value={clip.posX ?? 0.5}
            onChange={e => handleChange('posX', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
        </AnimPropRow>

        <AnimPropRow label="Position Y" value={`${Math.round((clip.posY ?? 0.5) * 100)}%`}
          hasKf={!!hasKf('posY')} onToggleKf={() => toggleKeyframe('posY', clip.posY ?? 0.5)}>
          <input type="range" min={0} max={1} step={0.01} value={clip.posY ?? 0.5}
            onChange={e => handleChange('posY', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
        </AnimPropRow>

        <AnimPropRow label="Scale" value={`${(clip.scale ?? 1).toFixed(2)}x`}
          hasKf={!!hasKf('scale')} onToggleKf={() => toggleKeyframe('scale', clip.scale ?? 1)}>
          <input type="range" min={0.1} max={3} step={0.05} value={clip.scale ?? 1}
            onChange={e => handleChange('scale', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
        </AnimPropRow>

        <AnimPropRow label="Rotation" value={`${(clip.rotation ?? 0).toFixed(0)}°`}
          hasKf={!!hasKf('rotation')} onToggleKf={() => toggleKeyframe('rotation', clip.rotation ?? 0)}>
          <input type="range" min={-180} max={180} step={1} value={clip.rotation ?? 0}
            onChange={e => handleChange('rotation', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
        </AnimPropRow>

        <AnimPropRow label="Opacity" value={`${Math.round((clip.opacity ?? 1) * 100)}%`}
          hasKf={!!hasKf('opacity')} onToggleKf={() => toggleKeyframe('opacity', clip.opacity ?? 1)}>
          <input type="range" min={0} max={1} step={0.05} value={clip.opacity ?? 1}
            onChange={e => handleChange('opacity', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
        </AnimPropRow>

        {/* Section: Color Adjust */}
        {clip.type === 'video' && (
          <>
            <SectionLabel>Color Adjust</SectionLabel>
            <ColorSlider label="Brightness" value={clip.colorAdjust?.brightness ?? 0} min={-100} max={100}
              onChange={v => onUpdateClip(clip.id, { colorAdjust: { ...clip.colorAdjust, brightness: v } as any })} />
            <ColorSlider label="Contrast" value={clip.colorAdjust?.contrast ?? 0} min={-100} max={100}
              onChange={v => onUpdateClip(clip.id, { colorAdjust: { ...clip.colorAdjust, contrast: v } as any })} />
            <ColorSlider label="Saturation" value={clip.colorAdjust?.saturation ?? 0} min={-100} max={100}
              onChange={v => onUpdateClip(clip.id, { colorAdjust: { ...clip.colorAdjust, saturation: v } as any })} />
          </>
        )}

        {/* Section: Transition */}
        <SectionLabel>Transition</SectionLabel>
        <div className="grid grid-cols-2 gap-1">
          {['none', 'crossfade', 'dissolve', 'slide', 'wipe', 'fade'].map(t => (
            <button
              key={t}
              onClick={() => onSetTransition(clip.id, t, 0.5)}
              className={`px-1.5 py-1 rounded text-[9px] transition-colors ${
                (clip.transition?.type || 'none') === t
                  ? 'bg-white/20 text-white'
                  : 'bg-zinc-700/50 text-white/40 hover:bg-zinc-600/50'
              }`}
            >
              {t === 'none' ? 'None' : t}
            </button>
          ))}
        </div>

        {/* Filter presets */}
        {clip.type === 'video' && (
          <>
            <SectionLabel>Filter</SectionLabel>
            <div className="grid grid-cols-2 gap-1">
              {FILTER_PRESETS.map(f => (
                <button key={f.id} onClick={() => handleChange('filter', f.class_)}
                  className={`px-1.5 py-1 rounded text-[9px] transition-colors ${(clip.filter || '') === f.class_ ? 'bg-white/20 text-white' : 'bg-zinc-700/50 text-white/40 hover:bg-zinc-600/50'}`}>
                  {f.name}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Text-specific */}
        {clip.type === 'text' && (
          <>
            <SectionLabel>Text</SectionLabel>
            <textarea value={clip.text || ''} onChange={e => handleChange('text', e.target.value)}
              className="w-full bg-zinc-700/50 border border-zinc-600 rounded px-2 py-1.5 text-white text-xs outline-none focus:border-white/40 resize-none" rows={3} />
            <PropRow label="Font Size" value={`${clip.fontSize || 32}px`}>
              <input type="range" min={12} max={120} value={clip.fontSize || 32}
                onChange={e => handleChange('fontSize', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
            </PropRow>
            <div className="space-y-1">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Color</span>
              <input type="color" value={clip.fontColor || '#ffffff'}
                onChange={e => handleChange('fontColor', e.target.value)} className="w-full h-8 rounded cursor-pointer bg-transparent border border-zinc-600" />
            </div>
            <PropRow label="Fade In" value={`${(clip.fadeIn ?? 0).toFixed(1)}s`}>
              <input type="range" min={0} max={2} step={0.1} value={clip.fadeIn ?? 0}
                onChange={e => handleChange('fadeIn', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
            </PropRow>
            <PropRow label="Fade Out" value={`${(clip.fadeOut ?? 0).toFixed(1)}s`}>
              <input type="range" min={0} max={2} step={0.1} value={clip.fadeOut ?? 0}
                onChange={e => handleChange('fadeOut', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
            </PropRow>
          </>
        )}

        {/* Speed & Volume (not text) */}
        {clip.type !== 'text' && (
          <>
            <PropRow label="Speed" value={`${(clip.speed ?? 1).toFixed(1)}x`}>
              <input type="range" min={0.25} max={4} step={0.25} value={clip.speed ?? 1}
                onChange={e => handleChange('speed', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
            </PropRow>
            <PropRow label="Volume" value={`${Math.round((clip.volume ?? 1) * 100)}%`}>
              <input type="range" min={0} max={2} step={0.05} value={clip.volume ?? 1}
                onChange={e => handleChange('volume', Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
            </PropRow>
          </>
        )}

        {/* Delete */}
        <button onClick={() => onRemoveClip(clip.id)} className="w-full px-3 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs transition-colors mt-2">
          Delete Clip
        </button>
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[9px] text-white/20 uppercase tracking-wider pt-2 border-t border-zinc-700/30">{children}</p>;
}

function PropRow({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
        {value && <span className="text-[10px] text-white/40">{value}</span>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function AnimPropRow({ label, value, hasKf, onToggleKf, children }: {
  label: string; value?: string; hasKf: boolean; onToggleKf: () => void; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleKf}
            className={`w-3 h-3 rounded-full border transition-colors ${hasKf ? 'bg-blue-400 border-blue-400' : 'border-white/20 hover:border-white/40'}`}
            title={hasKf ? 'Remove keyframe' : 'Add keyframe'}
          />
          <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
        </div>
        {value && <span className="text-[10px] text-white/40">{value}</span>}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

function ColorSlider({ label, value, min, max, onChange }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <PropRow label={label} value={`${value > 0 ? '+' : ''}${value}`}>
      <input type="range" min={min} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))} className="flex-1 h-1 accent-white/50" />
    </PropRow>
  );
}
