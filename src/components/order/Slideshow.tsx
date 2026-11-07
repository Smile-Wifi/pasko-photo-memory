import { useEffect, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Slideshow({ images, musicUrl, musicTitle }: { images: string[]; musicUrl: string | null; musicTitle: string | null }) {
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
          <img key={src} src={src} alt={`Christmas photo ${idx + 1}`} className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`} />
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
      {musicUrl && <audio ref={audio} src={musicUrl} loop preload="none" />}
    </div>
  );
}
