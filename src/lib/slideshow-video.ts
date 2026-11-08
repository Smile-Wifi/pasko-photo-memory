// Records the 5-photo Christmas slideshow with music into a video file, fully in the browser.
const W = 720;
const H = 1080;
const PER_PHOTO = 6; // seconds — 5 photos ≈ 30 s, matching the song length
const FADE = 1;

export function pickVideoType(): { mime: string; ext: "mp4" | "webm" } | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const mime of ["video/mp4;codecs=avc1,mp4a.40.2", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"]) {
    if (MediaRecorder.isTypeSupported(mime)) return { mime, ext: mime.startsWith("video/mp4") ? "mp4" : "webm" };
  }
  return null;
}

function drawCover(ctx: CanvasRenderingContext2D, img: ImageBitmap, alpha: number, zoom: number) {
  const scale = Math.max(W / img.width, H / img.height) * zoom;
  const w = img.width * scale;
  const h = img.height * scale;
  ctx.globalAlpha = alpha;
  ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  ctx.globalAlpha = 1;
}

export async function recordSlideshow(photos: Blob[], music: Blob | null, onProgress: (p: number) => void): Promise<{ blob: Blob; ext: string }> {
  const type = pickVideoType();
  if (!type) throw new Error("This browser can't create videos. Please try Chrome or Safari.");
  const bitmaps = await Promise.all(photos.map((b) => createImageBitmap(b)));
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const stream = canvas.captureStream(30);

  const total = bitmaps.length * PER_PHOTO;
  let audioCtx: AudioContext | null = null;
  let source: AudioBufferSourceNode | null = null;
  if (music) {
    audioCtx = new AudioContext();
    const buf = await audioCtx.decodeAudioData(await music.arrayBuffer());
    const dest = audioCtx.createMediaStreamDestination();
    const gain = audioCtx.createGain();
    source = audioCtx.createBufferSource();
    source.buffer = buf;
    source.loop = true;
    source.connect(gain).connect(dest);
    // Gentle fade-out at the end.
    gain.gain.setValueAtTime(1, audioCtx.currentTime + total - 2);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + total);
    dest.stream.getAudioTracks().forEach((t) => stream.addTrack(t));
  }

  const rec = new MediaRecorder(stream, { mimeType: type.mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
  const done = new Promise<void>((r) => (rec.onstop = () => r()));

  const draw = (t: number) => {
    const idx = Math.min(Math.floor(t / PER_PHOTO), bitmaps.length - 1);
    const local = t - idx * PER_PHOTO;
    ctx.fillStyle = "#16402b";
    ctx.fillRect(0, 0, W, H);
    drawCover(ctx, bitmaps[idx]!, 1, 1 + 0.06 * (local / PER_PHOTO));
    const next = bitmaps[idx + 1];
    if (next && local > PER_PHOTO - FADE) {
      const p = (local - (PER_PHOTO - FADE)) / FADE;
      drawCover(ctx, next, p, 1.12 - 0.12 * p); // cheerful pop-in
    }
    // Twinkling gold sparkles for a festive, magical feel.
    for (let s = 0; s < 28; s++) {
      const x = ((s * 97.3) % W);
      const y = (((s * 53.7) + t * 60 * (1 + (s % 3))) % H);
      const a = 0.35 + 0.35 * Math.sin(t * 4 + s);
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = s % 2 ? "#f5c542" : "#ffffff";
      ctx.beginPath();
      ctx.arc(x, y, 2 + (s % 3), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };

  draw(0);
  rec.start(500);
  source?.start();
  const start = performance.now();
  await new Promise<void>((resolve) => {
    const tick = () => {
      const t = (performance.now() - start) / 1000;
      if (t >= total) return resolve();
      draw(t);
      onProgress(t / total);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  rec.stop();
  await done;
  source?.stop();
  await audioCtx?.close();
  stream.getTracks().forEach((t) => t.stop());
  onProgress(1);
  return { blob: new Blob(chunks, { type: type.mime.split(";")[0] ?? type.mime }), ext: type.ext };
}
