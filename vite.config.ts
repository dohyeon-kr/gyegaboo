import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-vite-plugin";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
    plugins: [react(), tanstackRouter()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    server: {
        proxy: {
            "/api": {
                target: "http://localhost:3001",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
    preview: {
        host: true,
        port: parseInt(process.env.VITE_PREVIEW_PORT || "4173", 10),
        allowedHosts: ["gyegaboo.dohyeon.kr", "localhost", "127.0.0.1"],
        proxy: {
            "/api": {
                target: process.env.VITE_API_TARGET || "http://localhost:3001",
                changeOrigin: true,
                secure: false,
                rewrite: (path) => path.replace(/^\/api/, ""),
            },
        },
    },
});
