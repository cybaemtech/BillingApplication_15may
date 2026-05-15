import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 5173,
    allowedHosts: true,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
  },
  optimizeDeps: {
    include: ["react", "react-dom", "@tanstack/react-query"],
  },
  build: {
    outDir: "dist/public",
  },
}));

// import { defineConfig } from "vite";
// import react from "@vitejs/plugin-react-swc";
// import path from "path";

// export default defineConfig(({ mode }) => ({
//   server: {
//     host: "::",
//     port: 5173,
//     hmr: {
//       overlay: false,
//     },
//     proxy: {
//       "/api": {
//         target: "http://localhost:5000",
//         changeOrigin: true,
//       },
//     },
//   },
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//       "@shared": path.resolve(__dirname, "./shared"),
//     },
//     dedupe: ["react", "react-dom", "react/jsx-runtime", "@tanstack/react-query"],
//   },
//   optimizeDeps: {
//     include: ["react", "react-dom", "@tanstack/react-query"],
//   },
//   build: {
//     outDir: "dist/public",
//   },
// }));
