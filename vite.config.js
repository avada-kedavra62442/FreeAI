import { defineConfig } from "vite";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [{
    name: "freeai-apple-touch-icon",
    closeBundle() {
      const source = resolve(process.cwd(), "apple-touch-icon.png");
      const outputDir = resolve(process.cwd(), "dist");
      mkdirSync(outputDir, { recursive: true });
      copyFileSync(source, resolve(outputDir, "apple-touch-icon.png"));
    }
  }]
});
