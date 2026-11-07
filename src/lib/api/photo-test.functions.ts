import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const testPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ photo: z.string().max(14_000_000), index: z.number().int().min(0).max(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin access only");
    const { generateTestPhoto } = await import("@/server/photo-test.server");
    return generateTestPhoto(data.photo, data.index);
  });

// Deliberately public during the owner's testing phase. This never accesses orders.
export const testCheckoutPhoto = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ photo: z.string().max(14_000_000), index: z.number().int().min(0).max(4) }).parse(input))
  .handler(async ({ data }) => {
    const { generateTestPhoto } = await import("@/server/photo-test.server");
    return generateTestPhoto(data.photo, data.index);
  });