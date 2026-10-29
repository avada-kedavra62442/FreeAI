import sharp from "sharp";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const themes = ["red", "green", "blue", "yellow"];
const appleSizes = [120, 152, 167, 180, 192, 512];
const androidSizes = [72, 96, 144, 192, 384, 512];

async function render(theme, sourceName, outputName, size) {
  const directory = resolve(root, "public", "icons", theme);
  const source = await readFile(resolve(directory, sourceName));
  const output = resolve(directory, outputName);
  await mkdir(dirname(output), { recursive: true });
  await sharp(source, { density: 384 })
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toFile(output);
}

for (const theme of themes) {
  await render(theme, "favicon.svg", "favicon.png", 64);
  for (const size of appleSizes) {
    await render(theme, `apple-touch-icon-${size}.svg`, `apple-touch-icon-${size}.png`, size);
  }
  for (const size of androidSizes) {
    await render(theme, `android-icon-${size}.svg`, `android-icon-${size}.png`, size);
  }
}
console.log("Generated theme-aware PNG icons for all four palettes.");
