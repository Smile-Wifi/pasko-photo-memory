// The only place the offline service worker is registered.
// Never registers in development, inside the editor preview, or in an iframe.
const PREVIEW_LABEL = /^(?:id-preview|preview)(?:-[a-z0-9]+)?--.+$/;

function isRefusedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }
  const host = window.location.hostname.toLowerCase();
  const label = host.split(".")[0] ?? "";
  for (const d of ["lovable.app", "gpt-eng.com", "gptengineer.run"]) {
    if (host.endsWith(`.${d}`)) {
      if (PREVIEW_LABEL.test(label)) return true;
      if (/^project--.+-dev$/.test(label)) return true;
    }
  }
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  return false;
}

async function unregisterAppWorkers() {
  const regs = await navigator.serviceWorker.getRegistrations();
  await Promise.all(
    regs
      .filter((r) => [r.active, r.waiting, r.installing].some((w) => w?.scriptURL.endsWith("/sw.js")))
      .map((r) => r.unregister()),
  );
}

export function setupServiceWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (isRefusedContext()) {
    void unregisterAppWorkers().catch(() => {});
    return;
  }
  void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {});
}
