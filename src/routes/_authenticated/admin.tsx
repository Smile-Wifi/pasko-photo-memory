import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Banknote, CheckCircle2, Clock, Image as ImageIcon, LogOut, Music, Package, Search, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import {
  checkIsAdmin, listOrders, getOrderMedia, updateOrderStatus, generateStylePhoto, deleteOrder, runCleanup,
  getAdminSettings, saveSettings, uploadMedia, deleteSample,
} from "@/lib/api/admin.functions";
import { PACKAGES, PAYMENT_METHODS, STATUS_LABEL, STYLES, peso, type OrderStatus } from "@/lib/catalog";
import { canGenerate as paymentAllowsGeneration, generationOrder } from "@/lib/order-process";
import { AdminPhotoTest } from "@/components/AdminPhotoTest";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard – Pasko Photo Magic" },
      { name: "description", content: "Manage Pasko Photo Magic orders, payments and Christmas photos." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Admin Dashboard – Pasko Photo Magic" },
      { property: "og:description", content: "Order management." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUS_STYLE: Record<OrderStatus, string> = {
  pending_payment: "bg-accent text-accent-foreground",
  payment_verified: "bg-secondary text-secondary-foreground",
  processing: "bg-gold/30 text-gold-foreground",
  completed: "bg-success/15 text-success",
  failed: "bg-destructive/10 text-destructive",
};

function readFile(file: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function AdminPage() {
  const check = useServerFn(checkIsAdmin);
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ["is-admin"], queryFn: () => check() });

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  if (!data?.isAdmin)
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-pine">No admin access</h1>
        <p className="mt-2 text-muted-foreground">This account isn't an administrator.</p>
        <Button variant="outline" className="mt-6 rounded-full" onClick={signOut}><LogOut /> Sign out</Button>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-pine">Admin Dashboard</h1>
        <div className="flex items-center gap-2"><AdminPhotoTest /><Button variant="ghost" size="sm" onClick={signOut}><LogOut /> Sign out</Button></div>
      </div>
      <Tabs defaultValue="orders">
        <TabsList className="mb-6">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="media">Samples & Music</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="orders"><OrdersTab /></TabsContent>
        <TabsContent value="media"><MediaTab /></TabsContent>
        <TabsContent value="settings"><SettingsTab /></TabsContent>
      </Tabs>
    </div>
  );
}

type Filters = { search: string; from: string; to: string; status: string };

function OrdersTab() {
  const list = useServerFn(listOrders);
  const cleanup = useServerFn(runCleanup);
  const [f, setF] = useState<Filters>({ search: "", from: "", to: "", status: "all" });
  const [applied, setApplied] = useState<Filters>(f);
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, refetch } = useQuery({ queryKey: ["admin-orders", applied], queryFn: () => list({ data: applied }) });

  const stats = data?.stats;
  const cards = [
    { icon: Package, label: "Total orders", value: stats?.total ?? "–" },
    { icon: Banknote, label: "Total sales", value: stats ? peso(stats.sales) : "–" },
    { icon: Clock, label: "Pending payments", value: stats?.pending ?? "–" },
    { icon: CheckCircle2, label: "Completed", value: stats?.completed ?? "–" },
  ];
  const open = data?.orders.find((o) => o.id === openId) ?? null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <c.icon className="h-5 w-5 text-primary" />
            <p className="mt-2 text-2xl font-bold text-pine">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); setApplied(f); }}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[1fr_150px_150px_170px_auto]"
      >
        <Input placeholder="Search reference, name, mobile, email" value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
        <Input type="date" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} aria-label="From date" />
        <Input type="date" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} aria-label="To date" />
        <Select value={f.status} onValueChange={(v) => setF({ ...f, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button type="submit"><Search /> Search</Button>
      </form>

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="rounded-full"
          onClick={async () => {
            const r = await cleanup();
            toast.success(`Removed ${r.removed} expired order(s).`);
            refetch();
          }}
        >
          <Trash2 /> Delete expired orders now
        </Button>
      </div>

      <div className="space-y-2">
        {data?.orders.length === 0 && <p className="py-10 text-center text-muted-foreground">No orders found.</p>}
        {data?.orders.map((o) => (
          <button key={o.id} onClick={() => setOpenId(o.id)} className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 text-left hover:border-primary">
            <div>
              <p className="font-mono text-sm font-semibold text-pine">{o.reference}</p>
              <p className="text-sm">{o.full_name} · {o.mobile}</p>
              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("en-PH")} · {PACKAGES[o.package as "basic"].name} · {PAYMENT_METHODS[o.payment_method as "gcash"]}{o.payment_reference ? ` · Ref ${o.payment_reference}` : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold">{peso(o.amount)}</span>
              <Badge className={STATUS_STYLE[o.status as OrderStatus]}>{STATUS_LABEL[o.status as OrderStatus]}</Badge>
            </div>
          </button>
        ))}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          {open && <OrderDetail order={open} onChanged={() => refetch()} onClose={() => setOpenId(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

type AdminOrder = Awaited<ReturnType<typeof listOrders>>["orders"][number];

function OrderDetail({ order, onChanged, onClose }: { order: AdminOrder; onChanged: () => void; onClose: () => void }) {
  const media = useServerFn(getOrderMedia);
  const setStatus = useServerFn(updateOrderStatus);
  const gen = useServerFn(generateStylePhoto);
  const del = useServerFn(deleteOrder);
  const { data: m, refetch } = useQuery({ queryKey: ["order-media", order.id, order.result_paths.join()], queryFn: () => media({ data: { id: order.id } }) });
  const [genIdx, setGenIdx] = useState<number | null>(null);
  const status = order.status as OrderStatus;
  const canGenerate = paymentAllowsGeneration(status, order.payment_verified_at);

  async function change(s: OrderStatus) {
    try {
      await setStatus({ data: { id: order.id, status: s } });
      toast.success(`Status: ${STATUS_LABEL[s]}`);
      onChanged();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function generateAll(onlyMissing: boolean) {
    for (const i of generationOrder(order.template)) {
      if (onlyMissing && order.result_paths[i]) continue;
      setGenIdx(i);
      try {
        await gen({ data: { id: order.id, index: i } });
        await refetch();
      } catch (e) {
        toast.error(`${STYLES[i]?.name}: ${(e as Error).message}`);
        setGenIdx(null);
        onChanged();
        return;
      }
    }
    setGenIdx(null);
    toast.success("All 5 photos generated. Order completed!");
    onChanged();
  }

  const link = typeof window !== "undefined" ? `${window.location.origin}/order/${order.reference}?t=${order.access_token}` : "";

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-mono">{order.reference}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-2 text-sm sm:grid-cols-2">
        <p><b>Name:</b> {order.full_name}</p>
        <p><b>Mobile:</b> {order.mobile}</p>
        <p><b>Email:</b> {order.email ?? "—"}</p>
        <p><b>Package:</b> {PACKAGES[order.package as "basic"].name} ({peso(order.amount)})</p>
        <p><b>Template:</b> {STYLES.find(s => s.key === order.template)?.name}</p>
        <p><b>Method:</b> {PAYMENT_METHODS[order.payment_method as "gcash"]}</p>
        <p><b>Payment ref:</b> {order.payment_reference ?? <span className="text-destructive">not submitted</span>}</p>
        <p className="sm:col-span-2"><b>Expires:</b> {new Date(order.expires_at).toLocaleDateString("en-PH")}</p>
        {order.admin_note && <p className="sm:col-span-2 text-destructive"><b>Note:</b> {order.admin_note}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select value={status} onValueChange={(v) => change(v as OrderStatus)}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
          </SelectContent>
        </Select>
        {status === "pending_payment" && <Button size="sm" onClick={() => change("payment_verified")}><CheckCircle2 /> Mark payment verified</Button>}
        <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(link); toast.success("Customer link copied"); }}>Copy customer link</Button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold">Original photo</p>
        {m?.original ? <img src={m.original} alt="Original" className="h-40 rounded-xl object-cover" /> : <div className="h-40 w-32 animate-pulse rounded-xl bg-muted" />}
      </div>

      <div>
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">Generated Christmas photos</p>
          <div className="flex gap-2">
            <Button size="sm" variant="festive" disabled={!canGenerate || genIdx !== null} onClick={() => generateAll(true)}>
              <Wand2 /> {order.result_paths.some(Boolean) ? "Generate missing" : "Generate 5 AI photos"}
            </Button>
            {order.result_paths.some(Boolean) && (
              <Button size="sm" variant="outline" disabled={!canGenerate || genIdx !== null} onClick={() => generateAll(false)}>Regenerate all</Button>
            )}
          </div>
        </div>
        {!canGenerate && status === "pending_payment" && <p className="mb-2 text-xs text-muted-foreground">Verify the payment first to enable AI generation.</p>}
        {genIdx !== null && (
          <div className="mb-3">
            <Progress value={(genIdx / 5) * 100} />
            <p className="mt-1 text-xs text-muted-foreground"><Sparkles className="inline h-3 w-3" /> Creating {STYLES[genIdx]?.name} ({genIdx + 1}/5)… about 30–60s each</p>
          </div>
        )}
        <div className="grid grid-cols-5 gap-2">
          {STYLES.map((s, i) => (
            <div key={s.key} className="overflow-hidden rounded-lg border border-border">
              {m?.results[i] ? <img src={m.results[i]!} alt={s.name} className="aspect-[2/3] w-full object-cover" /> : <div className="flex aspect-[2/3] items-center justify-center bg-muted"><ImageIcon className="h-4 w-4 text-muted-foreground" /></div>}
              <p className="truncate p-1 text-[10px]">{s.name}</p>
            </div>
          ))}
        </div>
      </div>

      <Button
        variant="destructive"
        size="sm"
        className="w-fit"
        onClick={async () => {
          if (!confirm("Delete this order and all its photos permanently?")) return;
          await del({ data: { id: order.id } });
          toast.success("Order deleted");
          onClose();
          onChanged();
        }}
      >
        <Trash2 /> Delete order & photos
      </Button>
    </>
  );
}

function MediaTab() {
  const get = useServerFn(getAdminSettings);
  const upload = useServerFn(uploadMedia);
  const remove = useServerFn(deleteSample);
  const { data, refetch } = useQuery({ queryKey: ["admin-settings"], queryFn: () => get() });
  const qc = useQueryClient();
  const [style, setStyle] = useState<string>(STYLES[0].name);
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);

  async function up(kind: "sample" | "music", file?: File) {
    if (!file) return;
    if (file.size > 19 * 1024 * 1024) {
      toast.error("File is too large (max 19MB).");
      return;
    }
    setBusy(true);
    try {
      await upload({ data: { kind, style, title, file: await readFile(file) } });
      toast.success(kind === "sample" ? "Sample uploaded" : "Music updated");
      refetch();
      qc.invalidateQueries({ queryKey: ["site-data"] });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><ImageIcon className="h-5 w-5 text-primary" /> Sample images</h2>
        <p className="text-sm text-muted-foreground">Uploaded samples replace the default gallery image for that style.</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{STYLES.map((s) => <SelectItem key={s.key} value={s.name}>{s.name}</SelectItem>)}</SelectContent>
          </Select>
          <Button asChild variant="festive" disabled={busy}>
            <label className="cursor-pointer"><Upload /> Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => up("sample", e.target.files?.[0])} /></label>
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {data?.samples.map((s) => (
            <div key={s.id} className="relative overflow-hidden rounded-lg">
              {s.url && <img src={s.url} alt={s.style} className="aspect-[4/5] w-full object-cover" />}
              <p className="truncate bg-muted p-1 text-[10px]">{s.style}</p>
              <button className="absolute right-1 top-1 rounded-full bg-background/90 p-1" aria-label="Delete sample" onClick={async () => { await remove({ data: { id: s.id } }); refetch(); qc.invalidateQueries({ queryKey: ["site-data"] }); }}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="flex items-center gap-2 text-lg font-bold"><Music className="h-5 w-5 text-primary" /> Christmas music</h2>
        <p className="text-sm text-muted-foreground">Plays in the ₱149 slideshow. Use music you have the rights to.</p>
        {data?.musicPreview && (
          <div className="mt-3">
            <p className="text-sm font-semibold">{data.music.title}</p>
            <audio controls src={data.musicPreview} className="mt-2 w-full" />
          </div>
        )}
        <div className="mt-4 space-y-2">
          <Input placeholder="Track title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Button asChild variant="festive" disabled={busy}>
            <label className="cursor-pointer"><Upload /> Upload MP3<input type="file" accept="audio/*" className="hidden" onChange={(e) => up("music", e.target.files?.[0])} /></label>
          </Button>
        </div>
      </div>
    </div>
  );
}

function SettingsTab() {
  const get = useServerFn(getAdminSettings);
  const save = useServerFn(saveSettings);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["admin-settings"], queryFn: () => get() });
  const [form, setForm] = useState({ basic: 99, premium: 149, gcash: "", maya: "", bank: "", retentionDays: 30 });

  useEffect(() => {
    if (data)
      setForm({
        basic: data.pricing.basic, premium: data.pricing.premium,
        gcash: data.payment["gcash"] ?? "", maya: data.payment["maya"] ?? "", bank: data.payment["bank"] ?? "",
        retentionDays: data.retentionDays,
      });
  }, [data]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await save({ data: { pricing: { basic: form.basic, premium: form.premium }, payment: { gcash: form.gcash, maya: form.maya, bank: form.bank }, retentionDays: form.retentionDays } });
      toast.success("Settings saved");
      qc.invalidateQueries();
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const field = (k: keyof typeof form, label: string, type = "text") => (
    <div>
      <Label>{label}</Label>
      <Input type={type} value={form[k]} onChange={(e) => setForm({ ...form, [k]: type === "number" ? Number(e.target.value) : e.target.value })} className="mt-1" />
    </div>
  );

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-lg font-bold">Pricing (₱)</h2>
      <div className="grid grid-cols-2 gap-3">{field("basic", "Basic Magic", "number")}{field("premium", "Magic with Music", "number")}</div>
      <h2 className="pt-2 text-lg font-bold">Payment accounts shown to customers</h2>
      {field("gcash", "GCash")}
      {field("maya", "Maya")}
      {field("bank", "Bank transfer")}
      <h2 className="pt-2 text-lg font-bold">Retention policy</h2>
      {field("retentionDays", "Delete photos & orders after (days)", "number")}
      <p className="text-xs text-muted-foreground">Applies to new orders. Expired orders are deleted automatically every day.</p>
      <Button type="submit" variant="festive">Save settings</Button>
    </form>
  );
}
