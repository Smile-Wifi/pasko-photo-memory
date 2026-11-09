// Records Christmas photos and music locally; never uploads customer media.
const W = 720;
const H = 1280;
const MAIN_H = Math.round(H * 0.75);
const PER_PHOTO = 3;
const FADE = 1;

const VIDEO_TYPES = ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4;codecs=avc1.42E01E,mp4a.40.2", "video/webm;codecs=vp8,opus", "video/webm;codecs=vp9,opus"];

export function pickVideoType(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  // Generic video/mp4 can silently select VP9 + Opus, which iPhone Photos cannot play.
  for (const mime of VIDEO_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  }
  return null;
}

export function createSlideshowRecorder(stream: MediaStream): MediaRecorder {
  if (typeof MediaRecorder !== "undefined") {
    for (const mimeType of VIDEO_TYPES) {
      if (!MediaRecorder.isTypeSupported(mimeType)) continue;
      // Some phones advertise a codec but cannot initialize its encoder.
      for (const options of [{ mimeType, videoBitsPerSecond: 4_000_000 }, { mimeType }]) {
        try { return new MediaRecorder(stream, options); } catch { /* Try safer options, then the next codec. */ }
      }
    }
  }
  throw new Error("This browser can't create a playable video. Please open the page in Safari or Chrome.");
}

export async function wakeSlideshowAudio(ctx: AudioContext) {
  const isRunning = () => ctx.state === "running";
  if (isRunning()) return;
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      ctx.resume(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error("Tap Create slideshow video to enable the music, and keep this page open.")), 1500); }),
    ]);
    if (!isRunning()) throw new Error("Tap Create slideshow video to enable the music, and keep this page open.");
  } finally {
    clearTimeout(timer);
  }
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, alpha: number, zoom: number, x = 0, y = 0, w = W, h = H) {
  const scale = Math.max(w / img.width, h / img.height) * zoom;
  const dw = img.width * scale;
  const dh = img.height * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  ctx.restore();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function makeGrain(): HTMLCanvasElement {
  const g = document.createElement("canvas");
  g.width = 256; g.height = 256;
  const gctx = g.getContext("2d");
  if (gctx) {
    const data = gctx.createImageData(256, 256);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = Math.random() * 255;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = 22;
    }
    gctx.putImageData(data, 0, 0);
  }
  return g;
}

// Vintage film-strip layout: main photo (top 75%), scrolling strip (bottom 25%), fixed greeting.
export function drawFilmFrame(ctx: CanvasRenderingContext2D, bitmaps: ImageBitmap[], t: number, grain: HTMLCanvasElement) {
  const idx = Math.min(Math.floor(t / PER_PHOTO), bitmaps.length - 1);
  const local = t - idx * PER_PHOTO;
  ctx.filter = "sepia(0.55) saturate(0.85) contrast(0.9) brightness(1.03)";
  ctx.fillStyle = "#2a1f16";
  ctx.fillRect(0, 0, W, H);
  const current = bitmaps[idx];
  if (current) drawCover(ctx, current, 1, 1 + 0.08 * (local / PER_PHOTO), 0, 0, W, MAIN_H);
  const next = bitmaps[idx + 1];
  if (next && local > PER_PHOTO - FADE) drawCover(ctx, next, (local - (PER_PHOTO - FADE)) / FADE, 1, 0, 0, W, MAIN_H);

  // Film strip
  const stripY = MAIN_H;
  const stripH = H - MAIN_H;
  ctx.fillStyle = "#14100c";
  ctx.fillRect(0, stripY, W, stripH);
  ctx.fillStyle = "#e8dcc4";
  for (let x = ((t * 40) % 36) - 36; x < W; x += 36) {
    roundRect(ctx, x, stripY + 10, 18, 12, 3); ctx.fill();
    roundRect(ctx, x, stripY + stripH - 22, 18, 12, 3); ctx.fill();
  }
  const cellW = W / 3;
  const pad = 14;
  const offset = (t * 40) % cellW;
  const first = Math.floor((t * 40) / cellW);
  for (let k = -1; k < 4; k++) {
    const img = bitmaps[(((k - first) % bitmaps.length) + bitmaps.length * 10) % bitmaps.length];
    const x = k * cellW + offset + pad;
    const y = stripY + 32;
    const w = cellW - pad * 2;
    const h = stripH - 64;
    ctx.save();
    roundRect(ctx, x, y, w, h, 14);
    ctx.fillStyle = "#000";
    ctx.fill();
    roundRect(ctx, x + 4, y + 4, w - 8, h - 8, 11);
    ctx.clip();
    if (img) drawCover(ctx, img, 1, 1, x + 4, y + 4, w - 8, h - 8);
    ctx.restore();
  }
  ctx.filter = "none";

  // Warm tint + vignette + grain
  ctx.fillStyle = "rgba(196, 150, 80, 0.16)";
  ctx.fillRect(0, 0, W, H);
  const vg = ctx.createRadialGradient(W / 2, MAIN_H / 2, W * 0.3, W / 2, MAIN_H / 2, W * 0.95);
  vg.addColorStop(0, "rgba(0,0,0,0)");
  vg.addColorStop(1, "rgba(30,18,8,0.45)");
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, W, MAIN_H);
  ctx.save();
  ctx.translate(-Math.random() * 128, -Math.random() * 128);
  ctx.fillStyle = ctx.createPattern(grain, "repeat") ?? "transparent";
  ctx.fillRect(0, 0, W + 128, H + 128);
  ctx.restore();

  // Fixed greeting
  const cy = MAIN_H / 2;
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 12;
  ctx.font = "600 22px Outfit, sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText("TO MY LOVING FAMILY", W / 2, cy - 150);
  ctx.font = "700 64px Outfit, sans-serif";
  ctx.letterSpacing = "18px";
  ctx.fillText("MERRY", W / 2, cy - 70);
  ctx.letterSpacing = "0px";
  ctx.font = "130px 'Great Vibes', cursive";
  ctx.fillText("Christmas", W / 2, cy + 30);
  ctx.font = "600 17px Outfit, sans-serif";
  ctx.letterSpacing = "3px";
  ctx.fillText("WISHING YOU LOVE, JOY AND PEACE THIS CHRISTMAS", W / 2, cy + 130);
  ctx.letterSpacing = "0px";
  ctx.shadowBlur = 0;
}

export async function recordSlideshow(photos: Blob[], music: Blob | null, onProgress: (p: number) => void, preparedAudio?: AudioContext, signal?: AbortSignal): Promise<{ blob: Blob; ext: string }> {
  const type = pickVideoType();
  if (!type) throw new Error("This browser can't create a playable video. Please open the page in Safari or Chrome.");
  if (!photos.length) throw new Error("Your photos are not ready yet.");
  let bitmaps: ImageBitmap[] = [];
  let audioCtx: AudioContext | null = preparedAudio ?? null;
  let source: AudioBufferSourceNode | null = null;
  let stream: MediaStream | null = null;
  let rec: MediaRecorder | null = null;
  let frame = 0;
  try {
    signal?.throwIfAborted();
    if (music) {
      audioCtx ??= new AudioContext();
      await wakeSlideshowAudio(audioCtx);
    }
    await Promise.all(["130px 'Great Vibes'", "700 64px Outfit", "600 22px Outfit"].map(f => document.fonts?.load(f).catch(() => {})));
    for (const photo of photos) bitmaps.push(await createImageBitmap(photo));
    signal?.throwIfAborted();
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx || !canvas.captureStream) throw new Error("Video recording is unavailable here. Please open this page in Safari or Chrome.");
    stream = canvas.captureStream(30);
    const total = bitmaps.length * PER_PHOTO;
    if (music && audioCtx) {
      const buf = await audioCtx.decodeAudioData(await music.arrayBuffer());
      const dest = audioCtx.createMediaStreamDestination();
      const gain = audioCtx.createGain();
      source = audioCtx.createBufferSource();
      source.buffer = buf;
      source.loop = true;
      source.connect(gain).connect(dest);
      gain.gain.setValueAtTime(1, audioCtx.currentTime);
      gain.gain.setValueAtTime(1, audioCtx.currentTime + total - 2);
      gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + total);
      dest.stream.getAudioTracks().forEach(t => stream?.addTrack(t));
    }
    rec = createSlideshowRecorder(stream);
    const chunks: Blob[] = [];
    const recorder = rec;
    const grain = makeGrain();
    const draw = (t: number) => drawFilmFrame(ctx, bitmaps, t, grain);
    await new Promise<void>((resolve, reject) => {
      let stopped = false;
      const cleanup = () => {
        stopped = true;
        cancelAnimationFrame(frame);
        document.removeEventListener("visibilitychange", visibility);
        signal?.removeEventListener("abort", abort);
      };
      const fail = (error: Error) => {
        cleanup();
        reject(error);
        if (recorder.state !== "inactive") recorder.stop();
      };
      const abort = () => fail(new DOMException("Slideshow cancelled", "AbortError"));
      recorder.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
      recorder.onstop = () => { cleanup(); resolve(); };
      recorder.onerror = () => fail(new Error("Video recording failed. Please try again in Safari or Chrome."));
      const visibility = () => {
        if (!document.hidden) return;
        fail(new Error("Recording was interrupted. Keep this page open and tap Create slideshow video again."));
      };
      document.addEventListener("visibilitychange", visibility);
      signal?.addEventListener("abort", abort, { once: true });
      try {
        signal?.throwIfAborted();
        draw(0);
        recorder.start();
        source?.start();
      } catch (error) {
        fail(error instanceof Error ? error : new Error("Could not start video recording."));
        return;
      }
      const start = performance.now();
      const tick = () => {
        if (stopped) return;
        const t = (performance.now() - start) / 1000;
        if (t >= total) { recorder.stop(); return; }
        draw(t);
        onProgress(t / total);
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    });
    const mime = recorder.mimeType || type.mime;
    const blob = new Blob(chunks, { type: mime.split(";")[0] ?? type.mime });
    if (blob.size < 1024) throw new Error("The video recording was empty. Please try again.");
    onProgress(1);
    return { blob, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  } finally {
    cancelAnimationFrame(frame);
    if (rec && rec.state !== "inactive") rec.stop();
    try { source?.stop(); } catch { /* A source can fail before it has started. */ }
    stream?.getTracks().forEach(t => t.stop());
    if (audioCtx && audioCtx.state !== "closed") await audioCtx.close().catch(() => {});
    bitmaps.forEach(b => b.close());
  }
}
