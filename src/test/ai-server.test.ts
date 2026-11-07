// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { editPhoto, IMAGE_MODEL } from "@/server/ai.server";

const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1]);
const output = "https://replicate.delivery/test/result.png";
const photo = () => new Blob([new Uint8Array([4, 5])], { type: "image/webp" });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
function setup() {
  vi.stubEnv("LOVABLE_API_KEY", "test-lovable-key");
  vi.stubEnv("REPLICATE_API_KEY", "test-connection-key");
  const fetcher = vi.fn()
    .mockResolvedValueOnce(Response.json({ id: "test", status: "succeeded", output }))
    .mockResolvedValueOnce(new Response(png, { headers: { "Content-Type": "image/png" } }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}
describe("Replicate reference-photo editing", () => {
  it("uses FLUX Kontext Pro with the original, prompt, portrait ratio and PNG output", async () => {
    const fetcher = setup();
    expect(await editPhoto(photo(), "Santa portrait")).toEqual(png);
    expect(fetcher.mock.calls[0]?.[0]).toBe(`https://connector-gateway.lovable.dev/replicate/v1/models/${IMAGE_MODEL}/predictions`);
    const init = fetcher.mock.calls[0]?.[1];
    expect(init.headers.get("Authorization")).toBe("Bearer test-lovable-key");
    expect(init.headers.get("X-Connection-Api-Key")).toBe("test-connection-key");
    expect(JSON.parse(init.body).input).toEqual({ prompt: "Santa portrait", input_image: "data:image/webp;base64,BAU=", aspect_ratio: "2:3", output_format: "png" });
    expect(fetcher.mock.calls[1]).toEqual([output]);
  });
  it("blocks missing connection credentials without using saved Google credentials", async () => {
    const fetcher = setup(); vi.stubEnv("REPLICATE_API_KEY", ""); vi.stubEnv("GEMINI_API_KEY", "unused-key");
    await expect(editPhoto(photo(), "Santa")).rejects.toMatchObject({ status: 401 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it.each([402, 403, 429, 500])("preserves HTTP %s, redacts credentials and never replays creation", async status => {
    const fetcher = setup();
    fetcher.mockReset().mockResolvedValue(new Response("test-lovable-key test-connection-key", { status }));
    await expect(editPhoto(photo(), "Santa")).rejects.toMatchObject({ status, message: expect.stringContaining("[redacted] [redacted]") });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("explains the account credit blocker", async () => {
    const fetcher = setup(); fetcher.mockReset().mockResolvedValue(new Response("Insufficient credit", { status: 402 }));
    await expect(editPhoto(photo(), "Santa")).rejects.toThrow("https://replicate.com/account/billing");
  });
  it("rejects a refused prediction without downloading an image", async () => {
    const fetcher = setup(); fetcher.mockReset().mockResolvedValue(Response.json({ status: "failed", error: "Safety refusal" }));
    await expect(editPhoto(photo(), "Santa")).rejects.toMatchObject({ status: 422 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects empty results rather than claiming completion", async () => {
    const fetcher = setup(); fetcher.mockReset().mockResolvedValue(Response.json({ status: "succeeded", output: null }));
    await expect(editPhoto(photo(), "Santa")).rejects.toMatchObject({ status: 502 });
  });
  it("rejects corrupt downloads instead of saving fake PNGs", async () => {
    const fetcher = setup(); fetcher.mockReset().mockResolvedValueOnce(Response.json({ status: "succeeded", output })).mockResolvedValueOnce(new Response("not an image"));
    await expect(editPhoto(photo(), "Santa")).rejects.toMatchObject({ status: 502 });
  });
  it("polls the same prediction through the gateway without starting another", async () => {
    const fetcher = setup(); fetcher.mockReset()
      .mockResolvedValueOnce(Response.json({ id: "existing", status: "processing" }))
      .mockResolvedValueOnce(Response.json({ id: "existing", status: "succeeded", output }))
      .mockResolvedValueOnce(new Response(png));
    await editPhoto(photo(), "Santa");
    expect(fetcher.mock.calls[1]?.[0]).toBe("https://connector-gateway.lovable.dev/replicate/v1/predictions/existing");
    expect(fetcher.mock.calls.filter(call => call[1]?.method === "POST")).toHaveLength(1);
  });
});