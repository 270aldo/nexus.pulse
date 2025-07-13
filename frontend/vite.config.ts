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
      target: "esnext",
      minify: "terser",
      cssMinify: true,
      reportCompressedSize: true,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          experimentalMinChunkSize: 20000,
          manualChunks: {
            // Vendor chunks for better caching
            "vendor-react": ["react", "react-dom", "react-router-dom"],
            "vendor-ui": [
              "@radix-ui/react-dialog", 
              "@radix-ui/react-dropdown-menu", 
              "@radix-ui/react-popover",
              "@radix-ui/react-tabs",
              "@radix-ui/react-select"
            ],
            "vendor-charts": ["recharts", "d3-format", "d3-shape"],
            "vendor-utils": ["date-fns", "clsx", "tailwind-merge"],
            "vendor-supabase": ["@supabase/supabase-js"],
            "vendor-icons": ["lucide-react", "@radix-ui/react-icons"],
          },
          // Optimize chunk naming for better caching
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId 
              ? chunkInfo.facadeModuleId.split('/').pop() 
              : 'chunk';
            return `js/${facadeModuleId}-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.');
            const extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/css/i.test(extType)) {
              return `css/[name]-[hash][extname]`;
            }
            return `assets/[name]-[hash][extname]`;
          },
        },
      },
      terserOptions: {
        compress: {
          drop_console: command === "build",
          drop_debugger: command === "build",
          pure_funcs: command === "build" ? ['console.log', 'console.debug'] : [],
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
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
        "recharts",
        "date-fns",
        "clsx",
        "tailwind-merge",
        "sonner",
      ],
      exclude: ["@vite/client", "@vite/env"],
    },
  };
});