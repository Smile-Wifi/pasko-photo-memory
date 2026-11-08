import { toast } from "sonner";

/** Returns true (and shows a friendly message) when the device has no internet. */
export function blockIfOffline(action: "upload" | "generate" | "order" = "upload"): boolean {
  if (typeof navigator === "undefined" || navigator.onLine) return false;
  const msg = {
    upload: "You're offline. Connect to the internet to upload your photo. / Offline ka. Kumonekta sa internet para mag-upload.",
    generate: "You're offline. Connect to the internet to create your Christmas photos. / Offline ka. Kumonekta sa internet para gumawa ng photos.",
    order: "You're offline. Connect to the internet to place your order. / Offline ka. Kumonekta sa internet para mag-order.",
  }[action];
  toast.error(msg, { duration: 6000 });
  return true;
}
