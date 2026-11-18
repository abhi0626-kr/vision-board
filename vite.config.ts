import { defineConfig } from "vite";
import path from "path";
import { componentTagger } from "lovable-tagger";

// Plugin to add COOP headers for local dev (allows Firebase popups)
const coopHeaderPlugin = {
  name: 'coop-headers',
  configureServer(server) {
    return () => {
      server.middlewares.use((req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
        next();
      });
    };
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 8080,
    cors: true,
    hmr: {
      overlay: false,
    },
  },
  plugins: [mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: /^lucide-react$/, replacement: path.resolve(__dirname, "./src/lib/icons.ts") },
    ],
  },
  esbuild: {
    jsx: "automatic",
  },
}));
