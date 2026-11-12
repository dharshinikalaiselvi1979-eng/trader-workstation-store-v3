import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // In development, proxy /api requests to the Express server on :3000
    proxy: { "/api": "http://localhost:3000" },
  },
  build: {
    // Output the React app to public/app so Express can serve it
    outDir: "../public/app",
    emptyOutDir: true,
  },
});

