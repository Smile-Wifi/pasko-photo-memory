import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { Slideshow } from "@/components/order/Slideshow";

const mocks = vi.hoisted(() => ({ record: vi.fn(), wake: vi.fn() }));
vi.mock("@/lib/slideshow-video", () => ({ recordSlideshow: mocks.record, wakeSlideshowAudio: mocks.wake }));
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.resetAllMocks(); });

it("defers blocked auto-recording until a tap and still releases retry after cleanup fails", async () => {
  const close = vi.fn().mockRejectedValue(new Error("Already closed"));
  vi.stubGlobal("AudioContext", class { state = "suspended"; close = close; });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, blob: async () => new Blob(["music"]) }));
  mocks.wake.mockResolvedValue(undefined);
  mocks.record.mockRejectedValue(new Error("Recording unavailable"));
  const images = ["one", "two", "three", "four", "five"];
  const blobs = Object.fromEntries(images.map(u => [u, new Blob([u])]));
  render(<Slideshow images={images} blobs={blobs} musicUrl="song" musicTitle="Song" autoStart />);
  const start = await screen.findByRole("button", { name: "Tap to create slideshow with music" });
  expect(mocks.wake).not.toHaveBeenCalled();
  expect(mocks.record).not.toHaveBeenCalled();
  expect(screen.queryByRole("alert")).toBeNull();
  await act(async () => fireEvent.click(start));
  await waitFor(() => expect(mocks.record).toHaveBeenCalledTimes(1));
  await screen.findByRole("button", { name: "Create slideshow video with music" });
  await act(async () => fireEvent.click(screen.getByRole("button", { name: "Create slideshow video with music" })));
  await waitFor(() => expect(mocks.record).toHaveBeenCalledTimes(2));
});