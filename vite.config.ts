// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

// Inside the Lovable sandbox the client build lands in dist/client; with the
// Vercel preset nitro writes client assets straight into .vercel/output/static.
// The service worker must be generated into whichever directory is served.
const isLovableSandbox =
  process.env["LOVABLE_SANDBOX"] === "1" || !!process.env["DEV_SERVER__PROJECT_PATH"];
const clientOutDir = isLovableSandbox ? "dist/client" : ".vercel/output/static";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // Outside the Lovable sandbox (e.g. Vercel CI), build with nitro's Vercel
  // preset so the output lands in .vercel/output (Build Output API).
  // Inside the Lovable sandbox this is overridden to cloudflare-module.
  nitro: { preset: "vercel" },
  vite: {
    plugins: [
      VitePWA({
        strategies: "generateSW",
        registerType: "autoUpdate",
        injectRegister: null, // registered only by src/lib/pwa.ts
        manifest: false, // public/manifest.webmanifest is used
        devOptions: { enabled: false },
        filename: "sw.js",
        outDir: clientOutDir,
        workbox: {
          // Only the app's own built design files; photos and API data are never stored.
          globPatterns: ["**/*.{js,css,png,svg,ico,webp,jpg,woff2}"],
          globIgnores: ["**/sw.js", "**/workbox-*.js"],
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          navigateFallback: null,
          runtimeCaching: [
            {
              // Pages: always try the network first so new versions show quickly.
              urlPattern: ({ request, url }) =>
                request.mode === "navigate" &&
                !url.pathname.startsWith("/~oauth") &&
                !url.pathname.startsWith("/api") &&
                !url.pathname.startsWith("/order") &&
                !url.pathname.startsWith("/admin"),
              handler: "NetworkFirst",
              options: {
                cacheName: "pasko-pages",
                networkTimeoutSeconds: 4,
                expiration: { maxEntries: 20 },
                cacheableResponse: { statuses: [200] },
              },
            },
          ],
        },
      }),
    ],
  },
});
