import { blockIfOffline } from "@/lib/offline";
import { deliverFile, dataUrlToBlob } from "@/lib/download";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Download, FlaskConical, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { testCheckoutPhoto } from "@/lib/api/photo-test.functions";
import { STYLES } from "@/lib/catalog";
import type { TemplateId } from "@/lib/order-process";

type Slot = { image: string; error: string; busy: boolean };

const emptySlots = (): Slot[] => STYLES.map(() => ({ image: "", error: "", busy: false }));

export function CheckoutPhotoTest({ photo, template }: { photo: string; template: TemplateId }) {
  const run = useServerFn(testCheckoutPhoto);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [slots, setSlots] = useState<Slot[]>(emptySlots);
  const first = STYLES.findIndex(style => style.key === template);
  // Selected template first, then the remaining styles — same order as paid orders.
  const order = [first < 0 ? 0 : first, ...STYLES.map((_, i) => i).filter(i => i !== (first < 0 ? 0 : first))];

  async function generate() {
    if (busy || blockIfOffline("generate")) return;
    setBusy(true);
    setSlots(emptySlots());
    for (const index of order) {
      setSlots(prev => prev.map((slot, i) => (i === index ? { ...slot, busy: true } : slot)));
      try {
        const result = await run({ data: { photo, index } });
        setSlots(prev => prev.map((slot, i) => (i === index ? { image: result.image, error: "", busy: false } : slot)));
      } catch (e) {
        const message = e instanceof Error ? e.message : "Photo test failed. Please try again.";
        setSlots(prev => prev.map((slot, i) => (i === index ? { image: "", error: message, busy: false } : slot)));
      }
    }
    setBusy(false);
  }

  const done = slots.some(slot => slot.image || slot.error);

  return <>
    <Button type="button" variant="festive" size="lg" className="mt-4 h-16 w-full text-lg font-bold shadow-lg" onClick={() => { setOpen(true); setSlots(emptySlots()); }}><FlaskConical className="size-6" />TEST PHOTO — Try 5 styles</Button>
    <Dialog open={open} onOpenChange={value => { if (!busy) setOpen(value); }}>
      <DialogContent className="max-h-[90svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Test Christmas Photos</DialogTitle>
          <DialogDescription>Generates all 5 styles, one at a time, using the app's built-in AI. No payment or customer order is created.</DialogDescription>
        </DialogHeader>
        {!done && <img src={photo} alt="Your uploaded photo" className="mx-auto max-h-60 w-full object-contain" />}
        <div className="grid grid-cols-2 gap-3">
          {STYLES.map((style, index) => {
            const slot = slots[index] ?? { image: "", error: "", busy: false };
            return (
              <div key={style.key} className="space-y-1">
                <p className="text-xs font-semibold text-pine">{style.name}{index === first ? " (selected)" : ""}</p>
                {slot.image ? (
                  <img src={slot.image} alt={`${style.name} test photo`} className="w-full rounded-xl object-contain" />
                ) : (
                  <div className="flex h-32 items-center justify-center rounded-xl bg-snow/60 text-xs text-pine/70">
                    {slot.busy ? <LoaderCircle className="animate-spin" /> : slot.error ? <span role="alert" className="break-words p-2 text-destructive">{slot.error}</span> : "Waiting…"}
                  </div>
                )}
                {slot.image && (
                  <Button type="button" variant="outline" size="sm" className="w-full" onClick={() => void deliverFile(dataUrlToBlob(slot.image!), `pasko-test-${style.key}.png`)}>
                    <Download />Save photo
                  </Button>
                )}
              </div>
            );
          })}
        </div>
        <Button type="button" variant="festive" disabled={busy} onClick={generate}>
          {busy ? <LoaderCircle className="animate-spin" /> : <FlaskConical />}
          {busy ? "Generating…" : done ? "Test again" : "Generate 5 Test Photos"}
        </Button>
      </DialogContent>
    </Dialog>
  </>;
}
