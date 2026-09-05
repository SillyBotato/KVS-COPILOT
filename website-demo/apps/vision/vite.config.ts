// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  // @lovable.dev/vite-tanstack-config defaults the Nitro deploy preset to
  // "cloudflare-module". Override it so the production build targets the
  // Vercel Nitro preset instead of a Cloudflare Worker.
  nitro: { preset: "vercel" },
  // Run the preview app on port 5173 by default so it matches the admin app's
  // default `VITE_KVS_DEMO_URL` (http://localhost:5173). The Lovable config
  // otherwise defaults the dev server to port 8080.
  vite: {
    server: { port: 5173, strictPort: true, host: "0.0.0.0" },
  },
});
