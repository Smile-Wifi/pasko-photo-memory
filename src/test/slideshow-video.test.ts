import { afterEach, describe, expect, it, vi } from "vitest";
import { pickVideoType, wakeSlideshowAudio } from "@/lib/slideshow-video";

afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("playable slideshow recordings", () => {
  it("uses H.264 and AAC for iPhone-compatible MP4", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: (mime: string) => mime === "video/mp4;codecs=avc1,mp4a.40.2" });
    expect(pickVideoType()).toEqual({ mime: "video/mp4;codecs=avc1,mp4a.40.2", ext: "mp4" });
  });
  it("never mislabels unspecified MP4 codecs as iPhone-compatible", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: (mime: string) => ["video/mp4", "video/webm;codecs=vp8,opus"].includes(mime) });
    expect(pickVideoType()).toEqual({ mime: "video/webm;codecs=vp8,opus", ext: "webm" });
  });
  it("rejects a browser with only unspecified MP4 support", () => {
    vi.stubGlobal("MediaRecorder", { isTypeSupported: (mime: string) => mime === "video/mp4" });
    expect(pickVideoType()).toBeNull();
  });
  it("does not silently record without music when audio stays suspended", async () => {
    const ctx = { state: "suspended", resume: vi.fn().mockResolvedValue(undefined) } as unknown as AudioContext;
    await expect(wakeSlideshowAudio(ctx)).rejects.toThrow("Tap Create slideshow video");
  });
  it("times out blocked autoplay instead of hanging forever", async () => {
    vi.useFakeTimers();
    const ctx = { state: "suspended", resume: () => new Promise(() => {}) } as unknown as AudioContext;
    const rejected = expect(wakeSlideshowAudio(ctx)).rejects.toThrow("Tap Create slideshow video");
    await vi.advanceTimersByTimeAsync(1500);
    await rejected;
  });
});