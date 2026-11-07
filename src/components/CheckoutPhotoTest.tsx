import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FlaskConical, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { testCheckoutPhoto } from "@/lib/api/photo-test.functions";
import { STYLES } from "@/lib/catalog";
import type { TemplateId } from "@/lib/order-process";

export function CheckoutPhotoTest({ photo, template }: { photo: string; template: TemplateId }) {
  const run = useServerFn(testCheckoutPhoto);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");
  const index = STYLES.findIndex(style => style.key === template);
  async function generate() {
    if (busy || index < 0) return;
    setBusy(true); setImage(""); setError("");
    try {
      const result = await run({ data: { photo, index } });
      setImage(result.image);
    } catch (e) { setError(e instanceof Error ? e.message : "Photo test failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <>
    <Button type="button" variant="outline" className="mt-4" onClick={() => { setOpen(true); setImage(""); setError(""); }}><FlaskConical />Test Photo</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Christmas Photo</DialogTitle>
          <DialogDescription>One test uses Replicate credit. No payment or customer order is created.</DialogDescription>
        </DialogHeader>
        <p className="font-semibold text-pine">{STYLES[index]?.name}</p>
        <img src={image || photo} alt={image ? "Generated Christmas test photo" : "Your uploaded photo"} className="mx-auto max-h-80 w-full object-contain" />
        {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
        <Button type="button" variant="festive" disabled={busy} onClick={generate}>{busy ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}{busy ? "Generating…" : image ? "Test again" : "Generate Test Photo"}</Button>
        {image && <Button asChild variant="outline"><a href={image} download="pasko-test-photo.png"><Download />Download photo</a></Button>}
      </DialogContent>
    </Dialog>
  </>;
}