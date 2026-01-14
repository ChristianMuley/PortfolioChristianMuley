// vite.config.js  (REPLACE the whole file)
import { defineConfig } from "vite";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default defineConfig({
    root: ".",
    publicDir: "wwwroot/public",

    // Inline PostCSS so Vite won't search for external config/package.json
    css: {
        postcss: {
            plugins: [tailwindcss(), autoprefixer()],
        },
    },

    build: {
        outDir: "wwwroot/build",
        emptyOutDir: true,

        // Force a single CSS output file (prevents extra css chunks later)
        cssCodeSplit: false,

        rollupOptions: {
            input: "wwwroot/src/main.js",
            output: {
                entryFileNames: "app.js",
                chunkFileNames: "assets/[name].js",
                assetFileNames: (assetInfo) => {
                    // Rollup 4 (Vite 5) reliably provides assetInfo.name for emitted assets
                    const name = (assetInfo.name || "").toLowerCase();

                    // CSS should always be the one stable file your _Layout expects
                    if (name.endsWith(".css")) return "styles.css";

                    // Everything else (images/fonts/etc)
                    return "assets/[name][extname]";
                },
            },
        },
    },

    server: { port: 5173 },
});
