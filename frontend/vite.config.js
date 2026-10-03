import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// In development, requests to /api are proxied to the Express server,
// so the browser never needs CORS and no API URL is hard-coded.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      "/api": process.env.VITE_PROXY_TARGET || "http://localhost:3001",
    },
  },
});
