import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

// GitHub Pages serves this project from /BnB_BuilderHack/; localhost stays at /.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/BnB_BuilderHack/" : "/",
  // The verifier fixtures live at the repository root so core and web consume
  // the same demo evidence.
  server: { fs: { allow: [".."] } },
  build: {
    rollupOptions: {
      input: {
        dashboard: fileURLToPath(new URL("./index.html", import.meta.url)),
        about: fileURLToPath(new URL("./about/index.html", import.meta.url))
      }
    }
  }
});
