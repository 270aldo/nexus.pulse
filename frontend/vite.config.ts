import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig, loadEnv } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: true,
      proxy: {
        "/routes": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          secure: false,
        },
        "/api": {
          target: "http://127.0.0.1:8000",
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "components": path.resolve(__dirname, "./src/components"),
        "pages": path.resolve(__dirname, "./src/pages"),
        "utils": path.resolve(__dirname, "./src/utils"),
        "hooks": path.resolve(__dirname, "./src/hooks"),
      },
    },
    define: {
      // Make env variables available in client code
      __APP_ENV__: JSON.stringify(env.NODE_ENV),
    },
    build: {
      outDir: "dist",
      sourcemap: command === "serve",
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ["react", "react-dom"],
            ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu", "@radix-ui/react-popover"],
          },
        },
      },
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-router-dom",
        "@supabase/supabase-js",
        "lucide-react",
        "@radix-ui/react-icons",
      ],
    },
  };
});