// Records Christmas photos and music locally; never uploads customer media.
const W = 720;
const H = 1080;
const PER_PHOTO = 6;
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

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, alpha: number, zoom: number) {
  const scale = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  ctx.globalAlpha = 1;
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
  const theme = getComputedStyle(document.documentElement);
  const colors = [theme.getPropertyValue("--pine"), theme.getPropertyValue("--gold"), theme.getPropertyValue("--snow")];
  try {
    signal?.throwIfAborted();
    if (music) {
      audioCtx ??= new AudioContext();
      await wakeSlideshowAudio(audioCtx);
    }
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
    const draw = (t: number) => {
      const idx = Math.min(Math.floor(t / PER_PHOTO), bitmaps.length - 1);
      const local = t - idx * PER_PHOTO;
      ctx.fillStyle = colors[0] ?? "";
      ctx.fillRect(0, 0, W, H);
      const current = bitmaps[idx];
      if (current) drawCover(ctx, current, 1, 1 + 0.06 * local / PER_PHOTO);
      const next = bitmaps[idx + 1];
      if (next && local > PER_PHOTO - FADE) {
        const p = (local - (PER_PHOTO - FADE)) / FADE;
        drawCover(ctx, next, p, 1.12 - 0.12 * p);
      }
      for (let s = 0; s < 28; s++) {
        ctx.globalAlpha = Math.max(0, 0.35 + 0.35 * Math.sin(t * 4 + s));
        ctx.fillStyle = colors[s % 2 ? 1 : 2] ?? "";
        ctx.beginPath();
        ctx.arc((s * 97.3) % W, (s * 53.7 + t * 60 * (1 + s % 3)) % H, 2 + s % 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
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
