import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 4000,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("react") || id.includes("react-dom") || id.includes("scheduler")) {
            return "vendor-react";
          }

          if (id.includes("react-router")) {
            return "vendor-router";
          }

          if (id.includes("@tanstack/react-query") || id.includes("axios")) {
            return "vendor-data";
          }

          if (id.includes("@reduxjs") || id.includes("react-redux") || id.includes("redux")) {
            return "vendor-store";
          }

          if (id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("sonner")) {
            return "vendor-ui";
          }

          if (id.includes("recharts") || id.includes("d3")) {
            return "vendor-charts";
          }

          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }

          return "vendor-misc";
        },
      },
    },
  },
}));
