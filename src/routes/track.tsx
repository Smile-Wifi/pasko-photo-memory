import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trackOrder } from "@/lib/api/orders.functions";
import { normalizePhMobile } from "@/lib/catalog";

export const Route = createFileRoute("/track")({
  head: () => ({
    meta: [
      { title: "Track My Order – XmasMagic PH" },
      { name: "description", content: "Check the status of your XmasMagic PH Christmas photo order with your reference number." },
      { property: "og:title", content: "Track My Order – XmasMagic PH" },
      { property: "og:description", content: "Check your Christmas photo order status." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrackPage,
});

function TrackPage() {
  const navigate = useNavigate();
  const [reference, setReference] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const m = normalizePhMobile(mobile);
    if (!m) {
      toast.error("Enter the mobile number you used (e.g. 0917 123 4567).");
      return;
    }
    setBusy(true);
    try {
      const r = await trackOrder({ data: { reference, mobile: m } });
      if (!r) {
        toast.error("No order found with that reference and mobile number.");
        return;
      }
      navigate({ to: "/order/$reference", params: { reference: r.reference }, search: { t: r.token } });
    } catch {
      toast.error("Please check your reference number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-center text-3xl font-bold text-pine">Track My Order</h1>
      <p className="mt-2 text-center text-muted-foreground">Enter your order reference and mobile number.</p>
      <form onSubmit={submit} className="mt-8 space-y-4 rounded-3xl border border-border bg-card p-6 shadow-card">
        <div>
          <Label htmlFor="ref">Order reference</Label>
          <Input id="ref" placeholder="XM-261107-ABCDE" value={reference} onChange={(e) => setReference(e.target.value)} required className="mt-1 h-12 uppercase" />
        </div>
        <div>
          <Label htmlFor="mob">Mobile number</Label>
          <Input id="mob" inputMode="tel" placeholder="0917 123 4567" value={mobile} onChange={(e) => setMobile(e.target.value)} required className="mt-1 h-12" />
        </div>
        <Button type="submit" variant="festive" size="xl" className="w-full" disabled={busy}>
          <Search /> {busy ? "Searching…" : "Find my order"}
        </Button>
      </form>
    </section>
  );
}
