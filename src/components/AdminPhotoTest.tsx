import { deliverFile, dataUrlToBlob } from "@/lib/download";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { testPhoto } from "@/lib/api/photo-test.functions";
import { STYLES } from "@/lib/catalog";

export function AdminPhotoTest() {
  const run = useServerFn(testPhoto);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [index, setIndex] = useState("0");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [image, setImage] = useState("");
  async function generate() {
    if (!file || busy) return;
    if (file.size > 10 * 1024 * 1024) { setError("Choose a photo smaller than 10MB."); return; }
    setBusy(true); setError(""); setImage("");
    try {
      const photo = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read photo."));
        reader.onerror = () => reject(new Error("Could not read photo."));
        reader.readAsDataURL(file);
      });
      const result = await run({ data: { photo, index: Number(index) } });
      setImage(result.image);
    } catch (e) { setError(e instanceof Error ? e.message : "Photo test failed."); }
    finally { setBusy(false); }
  }
  return <>
    <Button variant="outline" onClick={() => setOpen(true)}><FlaskConical />Test Photo</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader><DialogTitle>Test Christmas Photo</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label htmlFor="test-photo">Photo</Label><Input id="test-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={e => { setFile(e.target.files?.[0] ?? null); setImage(""); setError(""); }} /></div>
          <div><Label>Template</Label><Select value={index} onValueChange={setIndex} disabled={busy}><SelectTrigger aria-label="Test template"><SelectValue /></SelectTrigger><SelectContent>{STYLES.map((style, i) => <SelectItem key={style.key} value={String(i)}>{style.name}</SelectItem>)}</SelectContent></Select></div>
          <p className="text-sm text-muted-foreground">One photo test uses the app's built-in AI. No customer order or payment is changed.</p>
          <Button disabled={!file || busy} onClick={generate} variant="festive">{busy ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}{busy ? "Generating…" : "Generate Test Photo"}</Button>
          {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
          {image && <div className="space-y-3"><img src={image} alt="Generated Christmas test photo" className="mx-auto max-h-96 w-full object-contain" /><Button type="button" variant="outline" onClick={() => void deliverFile(image.startsWith("data:") ? dataUrlToBlob(image) : new Blob(), "pasko-test-photo.png")}>Save photo</Button></div>}
        </div>
      </DialogContent>
    </Dialog>
  </>;
}