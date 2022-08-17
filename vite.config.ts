import { defineConfig } from "vite";

import ts from "rollup-plugin-ts";
export default defineConfig(({ mode, command }) => ({
    esbuild: false,
    plugins: [ts({ transpiler: "typescript" })],
    build: {
        lib: {
            entry: "./lib/index.ts",
            formats: ["es"],
            fileName: "index",
        },
        emptyOutDir: true,
        rollupOptions: {
            external: ["http2","http"],
        },
        outDir: "./dist",
        target: "es2015",
        minify: false,
    },
}));
