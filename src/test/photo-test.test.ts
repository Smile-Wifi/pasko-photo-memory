// @vitest-environment node
import { afterEach, describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/auth-middleware", () => ({ requireSupabaseAuth: {} }));
vi.mock("@tanstack/react-start", () => ({ createServerFn: () => ({ middleware() { return this; }, inputValidator() { return this; }, handler(fn: unknown) { return fn; } }) }));
import { testPhoto, testCheckoutPhoto } from "@/lib/api/photo-test.functions";
import { IDENTITY_RULE } from "@/lib/catalog";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/images/generations";
const okImage = () => Response.json({ data: [{ b64_json: "AQID" }] });

function setup() {
  vi.stubEnv("LOVABLE_API_KEY", "test-key");
  const fetcher = vi.fn().mockImplementation(() => Promise.resolve(okImage()));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const promptOf = (fetcher: ReturnType<typeof setup>, call: number) =>
  JSON.parse(fetcher.mock.calls[call]?.[1]?.body as string).contents[0].parts[0].text as string;

const handler = testPhoto as unknown as (input: { data: { photo: string; index: number }; context: { userId: string; supabase: { rpc: ReturnType<typeof vi.fn> } } }) => Promise<{ image: string }>;
describe("admin photo tests", () => {
  it("denies non-admin callers before AI work", async () => {
    const fetcher = setup();
    await expect(handler({ data: { photo: "data:image/jpeg;base64,AQID", index: 0 }, context: { userId: "user", supabase: { rpc: vi.fn().mockResolvedValue({ data: false }) } } })).rejects.toThrow("Forbidden");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("returns one test image using admin authorization without order access", async () => {
    setup();
    const rpc = vi.fn().mockResolvedValue({ data: true });
    expect(await handler({ data: { photo: "data:image/jpeg;base64,AQID", index: 0 }, context: { userId: "admin", supabase: { rpc } } })).toEqual({ image: "data:image/png;base64,AQID" });
    expect(rpc).toHaveBeenCalledWith("has_role", { _user_id: "admin", _role: "admin" });
  });
});

const checkoutHandler = testCheckoutPhoto as unknown as (input: { data: { photo: string; index: number } }) => Promise<{ image: string }>;
describe("checkout tester access", () => {
  it("generates all five styles through the built-in AI gateway, selected template first, one call each", async () => {
    const fetcher = setup();
    const order = [2, 0, 1, 3, 4]; // Snow selected first, then the rest
    for (const index of order) await checkoutHandler({ data: { photo: "data:image/jpeg;base64,AQID", index } });
    expect(fetcher).toHaveBeenCalledTimes(5);
    for (const call of fetcher.mock.calls) {
      expect(call[0]).toBe(GATEWAY);
      expect(call[1]?.headers?.Authorization).toBe("Bearer test-key");
      const parts = JSON.parse(call[1]?.body as string).contents[0].parts;
      expect(parts).toContainEqual({ inlineData: { mimeType: "image/jpeg", data: "AQID" } });
      expect(parts[0].text).toContain(IDENTITY_RULE);
    }
    expect(promptOf(fetcher, 0)).toContain("Snow winter portrait");
    expect(promptOf(fetcher, 1)).toContain("Simbang Gabi");
    expect(promptOf(fetcher, 4)).toContain("Traditional / Spanish / Barong");
  });
  it("generates one test photo without a login, code, order or payment", async () => {
    const fetcher = setup();
    expect(await checkoutHandler({ data: { photo: "data:image/jpeg;base64,AQID", index: 2 } })).toEqual({ image: "data:image/png;base64,AQID" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(promptOf(fetcher, 0)).toContain("winter");
  });
  it("rejects unsupported photo data before AI work", async () => {
    const fetcher = setup();
    await expect(checkoutHandler({ data: { photo: "data:text/plain;base64,AQID", index: 0 } })).rejects.toThrow("Choose a JPG");
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("explains exhausted AI credits instead of a generic failure", async () => {
    const fetcher = setup();
    fetcher.mockReset().mockResolvedValue(new Response("Payment required", { status: 402 }));
    await expect(checkoutHandler({ data: { photo: "data:image/jpeg;base64,AQID", index: 0 } })).rejects.toThrow("credits");
  });
  it("rejects an empty AI result rather than claiming success", async () => {
    const fetcher = setup();
    fetcher.mockReset().mockResolvedValue(Response.json({ data: [] }));
    await expect(checkoutHandler({ data: { photo: "data:image/jpeg;base64,AQID", index: 0 } })).rejects.toThrow("no image");
  });
});
