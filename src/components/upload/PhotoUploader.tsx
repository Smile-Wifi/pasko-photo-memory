import { blockIfOffline } from "@/lib/offline";
import { useRef, useState } from "react";
import { Camera, ImagePlus, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { validatePhoto, MAX_UPLOAD_MB } from "@/lib/catalog";
import { cn } from "@/lib/utils";

export type PreparedPhoto = { dataUrl: string; name: string; sizeKb: number };

/** Reads the file with real progress, then downsizes to max 2048px JPEG for fast uploads on mobile data. */
async function preparePhoto(file: File, onProgress: (p: number) => void): Promise<PreparedPhoto> {
  const raw = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 70));
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(new Error("Could not read this photo."));
    r.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(new Error("This file doesn't look like a valid image."));
    i.src = raw;
  });
  onProgress(85);
  if (img.width < 256 || img.height < 256) throw new Error("Photo is too small. Please use a photo at least 256×256 pixels.");
  const max = 2048;
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
  onProgress(100);
  return { dataUrl, name: file.name, sizeKb: Math.round((dataUrl.length * 0.75) / 1024) };
}

export function PhotoUploader({ value, onChange }: { value: PreparedPhoto | null; onChange: (p: PreparedPhoto | null) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handle(file: File | undefined) {
    if (!file) return;
    if (blockIfOffline("upload")) return;
    setError(null);
    const err = validatePhoto(file);
    if (err) return setError(err);
    setProgress(0);
    try {
      onChange(await preparePhoto(file, setProgress));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setProgress(null);
    }
  }

  const inputs = (
    <>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={camRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => { handle(e.target.files?.[0]); e.target.value = ""; }} />
    </>
  );

  if (value) {
    return (
      <div className="rounded-3xl border border-border bg-card p-4 shadow-card">
        {inputs}
        <div className="flex gap-4">
          <img src={value.dataUrl} alt="Your uploaded photo" className="h-36 w-28 rounded-2xl object-cover ring-4 ring-gold/50" />
          <div className="flex flex-1 flex-col justify-between">
            <div>
              <p className="font-semibold text-pine">Photo ready ✨</p>
              <p className="line-clamp-1 text-xs text-muted-foreground">{value.name} · {value.sizeKb} KB</p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button type="button" variant="outline" size="sm" className="rounded-full" onClick={() => fileRef.current?.click()}>
                <RefreshCw /> Replace
              </Button>
              <Button type="button" variant="ghost" size="sm" className="rounded-full text-destructive" onClick={() => onChange(null)}>
                <Trash2 /> Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {inputs}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handle(e.dataTransfer.files?.[0]); }}
        className={cn(
          "flex flex-col items-center rounded-3xl border-2 border-dashed p-8 text-center transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border bg-card",
        )}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-3xl">📸</span>
        <p className="mt-4 font-semibold text-pine">Upload ONE photo</p>
        <p className="mt-1 text-sm text-muted-foreground">Drag & drop here, or choose below. JPG, PNG or WEBP · up to {MAX_UPLOAD_MB}MB</p>
        {progress !== null ? (
          <div className="mt-6 w-full max-w-xs">
            <Progress value={progress} />
            <p className="mt-2 text-xs text-muted-foreground">Preparing photo… {progress}%</p>
          </div>
        ) : (
          <div className="mt-6 flex w-full max-w-sm flex-col gap-2 sm:flex-row">
            <Button type="button" variant="festive" size="lg" className="flex-1" onClick={() => fileRef.current?.click()}>
              <ImagePlus /> Choose photo
            </Button>
            <Button type="button" variant="outline" size="lg" className="flex-1 rounded-full" onClick={() => camRef.current?.click()}>
              <Camera /> Take a photo
            </Button>
          </div>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}
