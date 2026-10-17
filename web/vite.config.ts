import { defineConfig } from "vite";

// GitHub Pages serves this project from /BnB_BuilderHack/; localhost stays at /.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? "/BnB_BuilderHack/" : "/"
});
