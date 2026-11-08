// iPhone-safe file delivery. Call deliverFile synchronously inside a click handler
// with an already-loaded Blob — iOS Safari drops the tap permission after an await.
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function deliverFile(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: blob.type || "image/png" });
  const touch = typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;
  if (touch && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: filename });
      return;
    } catch (e) {
      if ((e as DOMException).name === "AbortError") return;
    }
  }
  downloadBlob(blob, filename);
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [head = "", b64 = ""] = dataUrl.split(",");
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? "image/png";
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

/** Messenger, Facebook, Instagram and similar in-app browsers. */
export function isInAppBrowser(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  return /FBAN|FBAV|FB_IAB|FBIOS|Messenger|MessengerForiOS|Instagram|Line\/|MicroMessenger|TikTok|musical_ly|Bytedance|Snapchat|Twitter/i.test(ua);
}
export function isIOSDevice(ua = typeof navigator !== "undefined" ? navigator.userAgent : "") {
  const touchMac = typeof navigator !== "undefined" && ua.includes("Macintosh") && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/i.test(ua) || touchMac;
}
/** Where normal downloads are unreliable and long-press instructions should be shown instead. */
export function needsLongPressSave(ua?: string) {
  return isIOSDevice(ua) || isInAppBrowser(ua);
}
