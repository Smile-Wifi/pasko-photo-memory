import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PACKAGES } from "@/lib/catalog";

const input = z.object({
  packageId: z.enum(["basic", "premium"]),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  paymentMethod: z.enum(["bank", "gcash_qr"]),
  referenceNumber: z.string().trim().min(4).max(60),
  amount: z.number().positive().max(1_000_000),
  senderName: z.string().trim().min(2).max(100),
  proof: z.string().max(12_000_000),
});

/** Public: stores a manual payment as PENDING. Never marks anything paid. */
export const submitManualPayment = createServerFn({ method: "POST" })
  .inputValidator((i: unknown) => input.parse(i))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { decodeDataUrl, getSettings, ORDER_BUCKET } = await import("@/server/storage.server");
    const { bytes, type } = decodeDataUrl(data.proof);
    if (!["image/jpeg", "image/png"].includes(type)) throw new Error("Proof must be a JPG or PNG screenshot");
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Proof image is larger than 8MB");
    const path = `payment-proofs/${crypto.randomUUID()}.${type === "image/png" ? "png" : "jpg"}`;
    const up = await supabaseAdmin.storage.from(ORDER_BUCKET).upload(path, bytes, { contentType: type });
    if (up.error) throw new Error("Upload failed. Please try again.");
    const price = (await getSettings()).pricing[data.packageId];
    const { error } = await supabaseAdmin.from("payments").insert({
      customer_name: data.customerName,
      phone: data.phone,
      email: data.email,
      package_name: `${PACKAGES[data.packageId].name} - ₱${price}`,
      payment_method: data.paymentMethod,
      amount: data.amount,
      reference_number: data.referenceNumber,
      sender_name: data.senderName,
      proof_image_url: path,
    });
    if (error) {
      await supabaseAdmin.storage.from(ORDER_BUCKET).remove([path]);
      throw new Error("Could not submit your payment. Please try again.");
    }
    return { ok: true };
  });
