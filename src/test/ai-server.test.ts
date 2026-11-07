// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import { editPhoto, IMAGE_MODEL } from "@/server/ai.server";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

function setup() {
  vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
  vi.stubEnv("GOOGLE_API_KEY", "test-google-key");
  const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({
    candidates: [{ content: { parts: [{ inlineData: { mimeType: "image/png", data: "AQID" } }] } }],
  }), { status: 200 }));
  vi.stubGlobal("fetch", fetcher);
  return fetcher;
}

describe("Gemini reference-photo editing", () => {
  it("sends the original photo and template to Gemini using the saved Gemini key", async () => {
    const fetcher = setup();
    expect(await editPhoto(new Blob([new Uint8Array([4, 5])], { type: "image/webp" }), "Santa portrait")).toEqual(new Uint8Array([1, 2, 3]));
    const call = fetcher.mock.calls[0];
    if (!call) throw new Error("Expected a Gemini request");
    const [url, init] = call;
    expect(url).toBe(`https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`);
    expect(init.headers["x-goog-api-key"]).toBe("test-gemini-key");
    expect(JSON.parse(init.body)).toEqual({
      contents: [{ role: "user", parts: [{ text: "Santa portrait" }, { inlineData: { mimeType: "image/webp", data: "BAU=" } }] }],
      generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: "2:3" } },
    });
  });
  it("uses the saved Google key only when Gemini is not configured", async () => {
    const fetcher = setup(); vi.stubEnv("GEMINI_API_KEY", "");
    await editPhoto(new Blob(["photo"], { type: "image/jpeg" }), "Santa");
    expect(fetcher.mock.calls[0]?.[1].headers["x-goog-api-key"]).toBe("test-google-key");
  });
  it("blocks calls when neither saved key exists", async () => {
    const fetcher = setup(); vi.stubEnv("GEMINI_API_KEY", ""); vi.stubEnv("GOOGLE_API_KEY", "");
    await expect(editPhoto(new Blob(["photo"], { type: "image/jpeg" }), "Santa")).rejects.toMatchObject({ status: 401 });
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("preserves provider failures, hides credentials and does not retry or switch keys", async () => {
    const fetcher = setup();
    fetcher.mockResolvedValue(new Response(JSON.stringify({ error: { message: "Denied test-gemini-key test-google-key" } }), { status: 403 }));
    await expect(editPhoto(new Blob(["photo"], { type: "image/jpeg" }), "Santa")).rejects.toMatchObject({ status: 403, message: "Denied [redacted] [redacted]" });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not claim success when Gemini refuses a request", async () => {
    const fetcher = setup(); fetcher.mockResolvedValue(new Response(JSON.stringify({ promptFeedback: { blockReason: "SAFETY" } })));
    await expect(editPhoto(new Blob(["photo"], { type: "image/jpeg" }), "Santa")).rejects.toMatchObject({ status: 422 });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not claim success for text-only output", async () => {
    const fetcher = setup(); fetcher.mockResolvedValue(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "No image" }] } }] })));
    await expect(editPhoto(new Blob(["photo"], { type: "image/jpeg" }), "Santa")).rejects.toMatchObject({ status: 502 });
  });
});