import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Dead Man's Hand — Liar's Bar Companion",
        short_name: "Dead Man's Hand",
        description: "Нуар-компаньон для игры с физическими картами",
        theme_color: "#09110e",
        background_color: "#09110e",
        display: "standalone",
        orientation: "any",
        icons: [{ src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
      },
      workbox: { navigateFallback: "/index.html" },
    }),
  ],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: { reporter: ["text", "html"] },
  },
});
