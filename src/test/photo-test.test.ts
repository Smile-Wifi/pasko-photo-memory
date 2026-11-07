// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
const edit = vi.hoisted(() => vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])));
vi.mock("@/server/ai.server", () => ({ editPhoto: edit }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
import { testPhoto } from "@/lib/api/photo-test.functions";
const handler = testPhoto as unknown as (input: { data: { photo: string; index: number }; context: { userId: string; supabase: { rpc: ReturnType<typeof vi.fn> } } }) => Promise<{ image: string }>;
describe("admin photo tests", () => {
  it("denies non-admin callers before paid AI work", async () => {
    edit.mockClear();
    await expect(handler({ data: { photo: "data:image/jpeg;base64,AQID", index: 0 }, context: { userId: "user", supabase: { rpc: vi.fn().mockResolvedValue({ data: false }) } } })).rejects.toThrow("Forbidden");
    expect(edit).not.toHaveBeenCalled();
  });
  it("returns one test image using admin authorization without order access", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: true });
    expect(await handler({ data: { photo: "data:image/jpeg;base64,AQID", index: 0 }, context: { userId: "admin", supabase: { rpc } } })).toEqual({ image: "data:image/png;base64,AQID" });
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "admin", _role: "admin" });
  });
});