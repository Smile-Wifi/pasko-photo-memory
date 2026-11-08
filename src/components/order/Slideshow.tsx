import { useEffect, useRef, useState } from "react";
import { Clapperboard, Download, ExternalLink, Loader2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { recordSlideshow } from "@/lib/slideshow-video";
import { deliverFile, isInAppBrowser } from "@/lib/download";
import { Button } from "@/components/ui/button";

export function Slideshow({ images, musicUrl, musicTitle, blobs = {}, fileName = "PaskoPhotoMagic-slideshow" }: { images: string[]; musicUrl: string | null; musicTitle: string | null; blobs?: Record<string, Blob>; fileName?: string }) {
  const [making, setMaking] = useState<number | null>(null);
  const [video, setVideo] = useState<{ blob: Blob; ext: string; url: string } | null>(null);
  useEffect(() => () => { if (video) URL.revokeObjectURL(video.url); }, [video]);

  // Step 1 builds the video; a separate tap saves it (iPhone blocks saves that wait).
  async function makeVideo() {
    setMaking(0);
    try {
      const photos = await Promise.all(images.map(async (u) => blobs[u] ?? (await (await fetch(u)).blob())));
      const music = musicUrl ? await (await fetch(musicUrl)).blob() : null;
      const r = await recordSlideshow(photos, music, setMaking);
      setVideo({ ...r, url: URL.createObjectURL(r.blob) });
    } catch (e) {
      toast.error((e as Error).message || "Could not create the slideshow video.");
    } finally {
      setMaking(null);
    }
  }

  const [i, setI] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const audio = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setI((x) => (x + 1) % images.length), 3500);
    return () => clearInterval(id);
  }, [playing, images.length]);

  function toggle() {
    const next = !playing;
    setPlaying(next);
    if (audio.current) next ? audio.current.play().catch(() => {}) : audio.current.pause();
  }

  return (
    <div className="overflow-hidden rounded-3xl bg-festive p-3 shadow-card">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl sm:aspect-[4/5]">
        {images.map((src, idx) => (
          <img key={src} src={src} alt={`Christmas photo ${idx + 1}`} className={`absolute inset-0 h-full w-full object-cover transition-all duration-1000 ease-out ${idx === i ? "scale-100 opacity-100" : "scale-110 opacity-0"}`} />
        ))}
        <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1.5 p-3">
          {images.map((_, idx) => (
            <span key={idx} className={`h-1.5 rounded-full transition-all ${idx === i ? "w-6 bg-gold" : "w-1.5 bg-snow/60"}`} />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 p-3 text-pine-foreground">
        <div className="text-sm">
          <p className="font-semibold">🎵 Christmas Slideshow</p>
          <p className="text-xs text-pine-foreground/70">{musicUrl ? musicTitle ?? "Christmas music" : "Music will be added soon"}</p>
        </div>
        <div className="flex gap-2">
          {musicUrl && (
            <Button size="icon" variant="snow" onClick={() => { setMuted(!muted); if (audio.current) audio.current.muted = !muted; }} aria-label={muted ? "Unmute" : "Mute"}>
              {muted ? <VolumeX /> : <Volume2 />}
            </Button>
          )}
          <Button variant="gold" onClick={toggle}>{playing ? <><Pause /> Pause</> : <><Play /> Play</>}</Button>
        </div>
      </div>
      <div className="space-y-2 px-3 pb-3 text-pine-foreground">
        {making !== null ? (
          <div>
            <Progress value={making * 100} />
            <p className="mt-1 flex items-center gap-1 text-xs"><Loader2 className="h-3 w-3 animate-spin" /> Creating your slideshow video with music… about 30 seconds. Keep this page open.</p>
          </div>
        ) : video ? (
          <div className="flex flex-wrap gap-2">
            <Button variant="gold" onClick={() => void deliverFile(video.blob, `${fileName}.${video.ext}`)}><Download /> Save slideshow video</Button>
            {isInAppBrowser() && (
              <Button asChild variant="snow"><a href={video.url} target="_blank" rel="noopener noreferrer"><ExternalLink /> Open video</a></Button>
            )}
          </div>
        ) : (
          <Button variant="snow" className="w-full" onClick={makeVideo}><Clapperboard /> Create slideshow video with music</Button>
        )}
      </div>
      {musicUrl && <audio ref={audio} src={musicUrl} loop preload="none" />}
    </div>
  );
}
