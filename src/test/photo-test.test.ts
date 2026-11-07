// @vitest-environment node
import { describe, it, expect, vi } from "vitest";
const edit = vi.hoisted(() => vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3])));
vi.mock("@/server/ai.server", () => ({ editPhoto: edit }));
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
import { testPhoto, testCheckoutPhoto } from "@/lib/api/photo-test.functions";
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

const checkoutHandler = testCheckoutPhoto as unknown as (input: { data: { photo: string; index: number } }) => Promise<{ image: string }>;
describe("checkout tester access", () => {
  it("generates all five styles, selected template first, one call each", async () => {
    edit.mockClear();
    const order = [2, 0, 1, 3, 4]; // winter selected first, then the rest
    for (const index of order) await checkoutHandler({ data: { photo: "data:image/jpeg;base64,AQID", index } });
    expect(edit).toHaveBeenCalledTimes(5);
    expect(edit.mock.calls[0]?.[1]).toContain("winter");
    expect(edit.mock.calls[1]?.[1]).toContain("Santa");
    expect(edit.mock.calls[4]?.[1]).toContain("magical Filipino");
  });
  it("generates one test photo without a login, code, order or payment", async () => {
    edit.mockClear();
    expect(await checkoutHandler({ data: { photo: "data:image/jpeg;base64,AQID", index: 2 } })).toEqual({ image: "data:image/png;base64,AQID" });
    expect(edit).toHaveBeenCalledTimes(1);
    expect(edit.mock.calls[0]?.[1]).toContain("winter");
  });
  it("rejects unsupported photo data before paid AI work", async () => {
    edit.mockClear();
    await expect(checkoutHandler({ data: { photo: "data:text/plain;base64,AQID", index: 0 } })).rejects.toThrow("Choose a JPG");
    expect(edit).not.toHaveBeenCalled();
  });
});