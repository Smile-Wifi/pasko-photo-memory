import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type Ctx = { supabase: { rpc: (fn: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }; userId: string };

async function assertAdmin(context: Ctx) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden: admin access only");
}

export const checkIsAdmin = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    return { isAdmin: !!data };
  });

export const listOrders = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ search: z.string().max(100).optional(), from: z.string().optional(), to: z.string().optional(), status: z.string().optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    let q = context.supabase
      .from("orders")
      .select("id, reference, access_token, full_name, mobile, email, package, amount, payment_method, payment_reference, status, original_path, result_paths, created_at, expires_at, admin_note")
      .order("created_at", { ascending: false })
      .limit(500);
    if (data.search) {
      const s = data.search.replace(/[%,()]/g, "");
      q = q.or(`reference.ilike.%${s}%,full_name.ilike.%${s}%,mobile.ilike.%${s}%,email.ilike.%${s}%`);
    }
    if (data.from) q = q.gte("created_at", new Date(data.from).toISOString());
    if (data.to) q = q.lte("created_at", new Date(new Date(data.to).getTime() + 86400_000).toISOString());
    if (data.status && data.status !== "all") q = q.eq("status", data.status as "completed");
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    // stats across all orders
    const { data: all } = await context.supabase.from("orders").select("status, amount");
    const paidStatuses = ["payment_verified", "processing", "completed"];
    const stats = {
      total: all?.length ?? 0,
      sales: (all ?? []).filter((o) => paidStatuses.includes(o.status)).reduce((s, o) => s + o.amount, 0),
      pending: (all ?? []).filter((o) => o.status === "pending_payment").length,
      completed: (all ?? []).filter((o) => o.status === "completed").length,
    };
    return { orders: rows ?? [], stats };
  });

export const getOrderMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { data: o } = await context.supabase.from("orders").select("original_path, result_paths").eq("id", data.id).single();
    if (!o) throw new Error("Not found");
    const { signPaths, ORDER_BUCKET } = await import("@/server/storage.server");
    const signed = await signPaths(ORDER_BUCKET, [o.original_path, ...o.result_paths]);
    return { original: signed[o.original_path] ?? null, results: o.result_paths.map((p) => signed[p] ?? null) };
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ id: z.string().uuid(), status: z.enum(["pending_payment", "payment_verified", "processing", "completed", "failed"]), note: z.string().max(500).optional() }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { data: o } = await context.supabase.from("orders").select("result_paths").eq("id", data.id).single();
    if (data.status === "completed" && (o?.result_paths.filter(Boolean).length ?? 0) < 5)
      throw new Error("Generate all 5 photos before marking as Completed.");
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status, admin_note: data.note ?? null, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Generates one of the 5 styles with the AI image service. Only for paid (verified) orders. */
export const generateStylePhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid(), index: z.number().int().min(0).max(4) }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ORDER_BUCKET } = await import("@/server/storage.server");
    const { editPhoto } = await import("@/server/ai.server");
    const { STYLES, IDENTITY_RULE } = await import("@/lib/catalog");

    const { data: o } = await supabaseAdmin.from("orders").select("id, reference, status, original_path, result_paths").eq("id", data.id).single();
    if (!o) throw new Error("Order not found");
    if (!["payment_verified", "processing", "failed"].includes(o.status))
      throw new Error("Verify the payment before generating photos.");

    await supabaseAdmin.from("orders").update({ status: "processing", updated_at: new Date().toISOString() }).eq("id", o.id);

    const dl = await supabaseAdmin.storage.from(ORDER_BUCKET).download(o.original_path);
    if (dl.error || !dl.data) throw new Error("Original photo is missing");

    const style = STYLES[data.index]!;
    try {
      const png = await editPhoto(dl.data, `${style.prompt} ${IDENTITY_RULE}`);
      const path = `results/${o.reference}/${data.index + 1}-${style.key}.png`;
      const up = await supabaseAdmin.storage.from(ORDER_BUCKET).upload(path, png, { contentType: "image/png", upsert: true });
      if (up.error) throw new Error(up.error.message);
      const { data: fresh } = await supabaseAdmin.from("orders").select("result_paths").eq("id", o.id).single();
      const paths = [...(fresh?.result_paths ?? [])];
      while (paths.length < 5) paths.push("");
      paths[data.index] = path;
      const complete = paths.every(Boolean);
      await supabaseAdmin
        .from("orders")
        .update({ result_paths: paths, status: complete ? "completed" : "processing", updated_at: new Date().toISOString() })
        .eq("id", o.id);
      return { ok: true, complete };
    } catch (e) {
      await supabaseAdmin.from("orders").update({ status: "failed", admin_note: (e as Error).message.slice(0, 400) }).eq("id", o.id);
      throw e;
    }
  });

export const deleteOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { ORDER_BUCKET } = await import("@/server/storage.server");
    const { data: o } = await supabaseAdmin.from("orders").select("original_path, result_paths").eq("id", data.id).single();
    if (o) await supabaseAdmin.storage.from(ORDER_BUCKET).remove([o.original_path, ...o.result_paths].filter(Boolean));
    await supabaseAdmin.from("orders").delete().eq("id", data.id);
    return { ok: true };
  });

export const runCleanup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { cleanupExpiredOrders } = await import("@/server/storage.server");
    return { removed: await cleanupExpiredOrders() };
  });

export const getAdminSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { getSettings, signPaths, MEDIA_BUCKET } = await import("@/server/storage.server");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const s = await getSettings();
    const { data: samples } = await supabaseAdmin.from("samples").select("id, style, image_url").order("created_at");
    const signed = await signPaths(MEDIA_BUCKET, [...(samples ?? []).map((x) => x.image_url), s.music.path ?? ""]);
    return {
      ...s,
      musicPreview: s.music.path ? signed[s.music.path] ?? null : null,
      samples: (samples ?? []).map((x) => ({ id: x.id, style: x.style, url: signed[x.image_url] ?? null })),
    };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({
      pricing: z.object({ basic: z.number().int().min(1).max(100000), premium: z.number().int().min(1).max(100000) }),
      payment: z.object({ gcash: z.string().max(200), maya: z.string().max(200), bank: z.string().max(200) }),
      retentionDays: z.number().int().min(1).max(365),
    }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const now = new Date().toISOString();
    const { error } = await context.supabase.from("app_settings").upsert([
      { key: "pricing", value: data.pricing, updated_at: now },
      { key: "payment", value: data.payment, updated_at: now },
      { key: "retention_days", value: data.retentionDays, updated_at: now },
    ]);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const uploadMedia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ kind: z.enum(["sample", "music"]), style: z.string().max(80).optional(), title: z.string().max(120).optional(), file: z.string().max(28_000_000) }).parse(i),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decodeDataUrl, MEDIA_BUCKET } = await import("@/server/storage.server");
    const { bytes, type } = decodeDataUrl(data.file);
    if (data.kind === "sample" && !type.startsWith("image/")) throw new Error("Samples must be images");
    if (data.kind === "music" && !type.startsWith("audio/")) throw new Error("Music must be an audio file (MP3)");
    const ext = type.split("/")[1]?.replace("mpeg", "mp3") ?? "bin";
    const path = `${data.kind}/${crypto.randomUUID()}.${ext}`;
    const up = await supabaseAdmin.storage.from(MEDIA_BUCKET).upload(path, bytes, { contentType: type });
    if (up.error) throw new Error(up.error.message);
    if (data.kind === "sample") {
      await context.supabase.from("samples").insert({ style: data.style || "Christmas", image_url: path });
    } else {
      await context.supabase.from("app_settings").upsert({ key: "music", value: { path, title: data.title || "Christmas music", url: null }, updated_at: new Date().toISOString() });
    }
    return { ok: true };
  });

export const deleteSample = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ data, context }) => {
    await assertAdmin(context as unknown as Ctx);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { MEDIA_BUCKET } = await import("@/server/storage.server");
    const { data: s } = await supabaseAdmin.from("samples").select("image_url").eq("id", data.id).single();
    if (s) await supabaseAdmin.storage.from(MEDIA_BUCKET).remove([s.image_url]);
    await context.supabase.from("samples").delete().eq("id", data.id);
    return { ok: true };
  });
