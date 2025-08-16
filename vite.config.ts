import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api/flowise': {
        target: 'https://srv938896.hstgr.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/flowise/, '/api/v1/prediction/d800a991-bf6d-4c73-aa66-b71413aff520'),
        secure: true,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
