import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const pagesBase = mode === "pages" ? "/liar/" : "/";
  return {
    base: pagesBase,
    plugins: [
      react(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: ["favicon.svg", "icon-192.png", "icon-512.png"],
        manifest: {
          name: "Dead Man's Hand — Liar's Bar Companion",
          short_name: "Dead Man's Hand",
          description: "Нуар-компаньон для игры с физическими картами",
          id: pagesBase,
          theme_color: "#09110e",
          background_color: "#09110e",
          display: "standalone",
          orientation: "any",
          lang: "ru",
          start_url: pagesBase,
          scope: pagesBase,
          icons: [
            { src: `${pagesBase}favicon.svg`, sizes: "any", type: "image/svg+xml", purpose: "any" },
            { src: `${pagesBase}icon-192.png`, sizes: "192x192", type: "image/png", purpose: "any" },
            { src: `${pagesBase}icon-512.png`, sizes: "512x512", type: "image/png", purpose: "any" },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,txt,webp,woff,woff2}"],
          globIgnores: ["**/Revolver3D-*.js"],
          runtimeCaching: [
            {
              urlPattern: /\/assets\/Revolver3D-[^/]+\.js$/,
              handler: "CacheFirst",
              options: {
                cacheName: "lazy-scene-chunks",
                expiration: { maxEntries: 2, maxAgeSeconds: 31_536_000 },
              },
            },
          ],
        },
      }),
    ],
    test: {
      environment: "node",
      include: ["src/**/*.test.ts"],
      coverage: { reporter: ["text", "html"] },
    },
  };
});
