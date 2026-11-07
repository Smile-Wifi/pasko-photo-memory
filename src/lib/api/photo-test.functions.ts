import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { STYLES, IDENTITY_RULE } from "@/lib/catalog";

export const testPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ photo: z.string().max(14_000_000), index: z.number().int().min(0).max(4) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden: admin access only");
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(data.photo);
    if (!match?.[1] || !match[2]) throw new Error("Choose a JPG, PNG or WEBP photo.");
    const binary = atob(match[2]);
    if (!binary.length || binary.length > 10 * 1024 * 1024) throw new Error("Photo must be non-empty and no larger than 10MB.");
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const style = STYLES[data.index];
    if (!style) throw new Error("Invalid template");
    const { editPhoto } = await import("@/server/ai.server");
    const png = await editPhoto(new Blob([bytes], { type: match[1] }), `${style.prompt} ${IDENTITY_RULE}`);
    let result = "";
    for (let i = 0; i < png.length; i += 8192) result += String.fromCharCode(...png.subarray(i, i + 8192));
    return { image: `data:image/png;base64,${btoa(result)}` };
  });