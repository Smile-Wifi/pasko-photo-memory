import { describe, expect, it } from "vitest";
import { isInAppBrowser, needsLongPressSave } from "@/lib/download";

const messengerIOS = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 [FBAN/MessengerForiOS;FBAV/450.0]";
const androidChrome = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36";
const androidFB = androidChrome + " [FB_IAB/FB4A;FBAV/480.0]";

describe("save-photo detection", () => {
  it("uses long-press guide inside Messenger on iPhone", () => expect(needsLongPressSave(messengerIOS)).toBe(true));
  it("uses long-press guide inside Facebook on Android", () => expect(isInAppBrowser(androidFB)).toBe(true));
  it("keeps normal download in Android Chrome", () => expect(needsLongPressSave(androidChrome)).toBe(false));
});
