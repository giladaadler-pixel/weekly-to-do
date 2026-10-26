import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const BASE = "/weekly-to-do/";
const DARK_BG = "#070a12"; // dark mode --bg

export default defineConfig({
  plugins: [
    react(),
    // Home-screen app: a manifest plus a service worker that caches the built app so it
    // opens offline. autoUpdate: after a deploy, the next launch uses the new version.
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["apple-touch-icon.png"],
      manifest: {
        name: "Weekly To-Do",
        short_name: "To-Do",
        display: "standalone",
        start_url: BASE,
        scope: BASE,
        theme_color: DARK_BG,
        background_color: DARK_BG,
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,png}"],
      },
    }),
  ],
  base: BASE,
  test: {
    environment: "jsdom",
  },
});
