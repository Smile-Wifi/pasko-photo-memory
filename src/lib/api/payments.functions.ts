import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SESSION_PACKAGES } from "@/lib/sessions";

const input = z.object({
  packageId: z.enum(["mini", "family", "barkada"]),
  customerName: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(20),
  email: z.string().trim().email().max(255),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  bookingTime: z.string().trim().min(1).max(20),
  persons: z.number().int().min(1).max(50).nullable(),
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
    const { decodeDataUrl, ORDER_BUCKET } = await import("@/server/storage.server");
    const { bytes, type } = decodeDataUrl(data.proof);
    if (!["image/jpeg", "image/png"].includes(type)) throw new Error("Proof must be a JPG or PNG screenshot");
    if (bytes.length > 8 * 1024 * 1024) throw new Error("Proof image is larger than 8MB");
    const path = `payment-proofs/${crypto.randomUUID()}.${type === "image/png" ? "png" : "jpg"}`;
    const up = await supabaseAdmin.storage.from(ORDER_BUCKET).upload(path, bytes, { contentType: type });
    if (up.error) throw new Error("Upload failed. Please try again.");
    const pkg = SESSION_PACKAGES[data.packageId];
    const { error } = await supabaseAdmin.from("payments").insert({
      customer_name: data.customerName,
      phone: data.phone,
      email: data.email,
      package_name: `${pkg.name} - PHP ${pkg.price}`,
      booking_date: data.bookingDate,
      booking_time: data.bookingTime,
      persons: data.persons,
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
