import { Track, Clip, TransitionType } from '../types';

interface RenderableClip {
  clip: Clip;
  elapsed: number;
  z: number;
}

export function renderFrame(
  ctx: CanvasRenderingContext2D,
  tracks: Track[],
  currentTime: number,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height);

  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, '#0f172a');
  bg.addColorStop(1, '#1e293b');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.scale(2, 2);

  const w = width / 2;
  const h = height / 2;

  const sorted = [...tracks].sort((a, b) => a.order - b.order);

  const toRender: RenderableClip[] = [];

  for (const track of sorted) {
    if (track.hidden) continue;
    for (const clip of track.clips) {
      if (currentTime >= clip.startTime && currentTime < clip.startTime + clip.duration) {
        const elapsed = currentTime - clip.startTime;
        const z = (clip.zIndex ?? 0) + track.order * 100;
        toRender.push({ clip, elapsed, z });
      }
    }
  }

  toRender.sort((a, b) => a.z - b.z);

  let prevClip: Clip | null = null;
  let prevTrack: Track | null = null;

  for (const { clip, elapsed } of toRender) {
    if (clip.type === 'audio') continue;

    if (clip.transition && clip.transition.type !== 'none' && prevClip && canTransition(prevClip, clip)) {
      const overlap = prevClip.startTime + prevClip.duration - clip.startTime;
      if (overlap > 0) {
        const t = Math.min(1, (currentTime - clip.startTime) / overlap);
        renderTransition(ctx, prevClip, clip, t, clip.transition.type, w, h);
        prevClip = clip;
        continue;
      }
    }

    renderSingleClip(ctx, clip, elapsed, w, h);
    prevClip = clip;
  }

  ctx.restore();
}

function canTransition(a: Clip, b: Clip): boolean {
  return Math.abs(a.startTime + a.duration - b.startTime) < 0.1;
}

function renderSingleClip(ctx: CanvasRenderingContext2D, clip: Clip, elapsed: number, w: number, h: number) {
  const opacity = clip.opacity ?? 1;
  ctx.globalAlpha = opacity;

  switch (clip.type) {
    case 'video':
      renderVideoClip(ctx, clip, elapsed, w, h);
      break;
    case 'text':
      renderTextClip(ctx, clip, elapsed, w, h);
      break;
  }

  ctx.globalAlpha = 1;
}

function renderTransition(
  ctx: CanvasRenderingContext2D,
  outClip: Clip,
  inClip: Clip,
  t: number,
  type: TransitionType,
  w: number,
  h: number,
) {
  switch (type) {
    case 'crossfade':
      renderSingleClip(ctx, outClip, outClip.duration, w, h);
      ctx.globalAlpha = t;
      renderSingleClip(ctx, inClip, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    case 'dissolve':
      renderSingleClip(ctx, outClip, outClip.duration, w, h);
      const grain = createGrain(ctx, w, h, t);
      ctx.drawImage(grain, 0, 0);
      ctx.globalAlpha = t;
      renderSingleClip(ctx, inClip, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    case 'slide':
      ctx.save();
      ctx.translate(-w * (1 - t), 0);
      renderSingleClip(ctx, inClip, 0, w, h);
      ctx.restore();
      ctx.save();
      ctx.translate(w * t, 0);
      ctx.globalAlpha = 1 - t;
      renderSingleClip(ctx, outClip, outClip.duration, w, h);
      ctx.restore();
      break;
    case 'wipe':
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, w * t, h);
      ctx.clip();
      renderSingleClip(ctx, inClip, 0, w, h);
      ctx.restore();
      ctx.save();
      ctx.beginPath();
      ctx.rect(w * t, 0, w, h);
      ctx.clip();
      renderSingleClip(ctx, outClip, outClip.duration, w, h);
      ctx.restore();
      break;
    case 'fade':
      ctx.globalAlpha = 1 - t;
      renderSingleClip(ctx, outClip, outClip.duration, w, h);
      ctx.globalAlpha = t;
      const fadeColor = t < 0.5 ? '#000000' : '#000000';
      ctx.fillStyle = fadeColor;
      ctx.globalAlpha = t < 0.5 ? t * 2 : (1 - t) * 2;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = t;
      renderSingleClip(ctx, inClip, 0, w, h);
      ctx.globalAlpha = 1;
      break;
    default:
      renderSingleClip(ctx, inClip, 0, w, h);
      break;
  }
}

function createGrain(ctx: CanvasRenderingContext2D, w: number, h: number, intensity: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const cctx = canvas.getContext('2d')!;
  const imageData = cctx.createImageData(w, h);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const v = Math.random() * 255 * intensity;
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
    data[i + 3] = 200 * intensity;
  }
  cctx.putImageData(imageData, 0, 0);
  return canvas;
}

function keyframeValue(keyframes: Clip['keyframes'], key: string, elapsed: number, defaultValue: number): number {
  if (!keyframes) return defaultValue;
  const kfs = (keyframes as any)[key] as { time: number; value: number }[] | undefined;
  if (!kfs || kfs.length === 0) return defaultValue;

  if (kfs.length === 1) return kfs[0].value;

  let prev = kfs[0];
  for (let i = 1; i < kfs.length; i++) {
    if (elapsed <= kfs[i].time) {
      const range = kfs[i].time - prev.time;
      const frac = range > 0 ? (elapsed - prev.time) / range : 0;
      return prev.value + (kfs[i].value - prev.value) * frac;
    }
    prev = kfs[i];
  }
  return prev.value;
}

function renderVideoClip(ctx: CanvasRenderingContext2D, clip: Clip, elapsed: number, w: number, h: number) {
  const kfPosX = keyframeValue(clip.keyframes, 'posX', elapsed, clip.posX ?? 0.5);
  const kfPosY = keyframeValue(clip.keyframes, 'posY', elapsed, clip.posY ?? 0.5);
  const kfScale = keyframeValue(clip.keyframes, 'scale', elapsed, clip.scale ?? 1);
  const kfRot = keyframeValue(clip.keyframes, 'rotation', elapsed, clip.rotation ?? 0);
  const kfOpacity = keyframeValue(clip.keyframes, 'opacity', elapsed, clip.opacity ?? 1);

  ctx.save();
  ctx.globalAlpha = kfOpacity;
  ctx.translate(w / 2, h / 2);
  ctx.rotate(kfRot * Math.PI / 180);
  ctx.scale(kfScale, kfScale);
  ctx.translate(-w / 2, -h / 2);

  const vw = w - 32;
  const vh = h - 32;
  const vx = 16;
  const vy = 16;

  const grad = ctx.createLinearGradient(vx, vy, vx, vy + vh);
  grad.addColorStop(0, clip.color || '#3b82f6');
  grad.addColorStop(1, darkenColor(clip.color || '#3b82f6', 40));
  ctx.fillStyle = grad;
  ctx.fillRect(vx, vy, vw, vh);

  const ca = clip.colorAdjust;
  if (ca && (ca.brightness !== 0 || ca.contrast !== 0 || ca.saturation !== 0)) {
    ctx.fillStyle = `rgba(255,255,255,${ca.brightness / 200})`;
    ctx.fillRect(vx, vy, vw, vh);
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(clip.label, w / 2, h / 2 - 10);

  ctx.font = '13px system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fillText(`${clip.duration.toFixed(1)}s`, w / 2, h / 2 + 18);

  ctx.restore();
}

function renderTextClip(ctx: CanvasRenderingContext2D, clip: Clip, elapsed: number, w: number, h: number) {
  const text = clip.text || '';
  const fontSize = clip.fontSize || 32;
  const fontColor = clip.fontColor || '#ffffff';
  const bgColor = clip.bgColor || 'rgba(0,0,0,0.5)';
  const fadeIn = clip.fadeIn ?? 0;
  const fadeOut = clip.fadeOut ?? 0;
  const duration = clip.duration || 1;

  const kfPosX = keyframeValue(clip.keyframes, 'posX', elapsed, clip.posX ?? 0.5);
  const kfPosY = keyframeValue(clip.keyframes, 'posY', elapsed, clip.posY ?? 0.5);
  const kfScale = keyframeValue(clip.keyframes, 'scale', elapsed, clip.scale ?? 1);
  const kfRot = keyframeValue(clip.keyframes, 'rotation', elapsed, clip.rotation ?? 0);
  const kfOpacity = keyframeValue(clip.keyframes, 'opacity', elapsed, clip.opacity ?? 1);

  let alpha = kfOpacity;
  if (fadeIn > 0 && elapsed < fadeIn) alpha *= elapsed / fadeIn;
  if (fadeOut > 0 && elapsed > duration - fadeOut) alpha *= Math.max(0, (duration - elapsed) / fadeOut);

  const px = kfPosX * w;
  const py = kfPosY * h;

  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.translate(px, py);
  ctx.rotate(kfRot * Math.PI / 180);
  ctx.scale(kfScale, kfScale);

  ctx.font = `bold ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const metrics = ctx.measureText(text);
  const tw = metrics.width + 28;
  const th = fontSize + 28;

  const isTransparent = bgColor === 'transparent' || bgColor === 'rgba(0,0,0,0)' || bgColor === 'rgba(0,0,0,0)';
  if (!isTransparent) {
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = bgColor;
    roundRect(ctx, -tw / 2, -th / 2, tw, th, 10);
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
  }

  ctx.fillStyle = fontColor;
  ctx.fillText(text, 0, 0);

  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xFF) - amount);
  const b = Math.max(0, (num & 0xFF) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}
