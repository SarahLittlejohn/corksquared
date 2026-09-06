#!/usr/bin/env node
/**
 * Turns the originals in `photos-raw/` into web-ready files in `src/photos/`.
 *
 *   npm run photos:optimise
 *
 * Each image is resized to a max edge of 2000px, converted to WebP at quality
 * 82, stripped of EXIF, and written out as a zero-padded sequential number so
 * plain filename sorting gives the gallery order.
 *
 * Ordering follows the natural sort of the source filenames, so name the
 * originals in the order you want them shown.
 *
 * Run this once, outside the app. It overwrites the numbered files in
 * `src/photos/` but leaves `captions.json` alone.
 */
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rawDir = path.join(root, 'photos-raw');
const outDir = path.join(root, 'src', 'photos');

const MAX_EDGE = 2000;
const QUALITY = 82;
// HEIC/HEIF support depends on the libvips build sharp ships with; convert
// those to JPEG first if sharp refuses them.
const SOURCE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.avif',
  '.tif',
  '.tiff',
  '.heic',
  '.heif',
]);

async function listSources() {
  let entries;
  try {
    entries = await readdir(rawDir, { withFileTypes: true });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `No photos-raw/ directory found at ${rawDir}. Create it and drop the original photos in.`,
      );
    }
    throw error;
  }

  return entries
    .filter((entry) => entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function clearExistingOutput() {
  const entries = await readdir(outDir, { withFileTypes: true }).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.isFile() && /^\d+\.(webp|jpe?g|png|avif)$/i.test(entry.name))
      .map((entry) => rm(path.join(outDir, entry.name))),
  );
}

async function main() {
  const sources = await listSources();
  if (sources.length === 0) {
    throw new Error(`No images found in ${rawDir}.`);
  }

  await mkdir(outDir, { recursive: true });
  await clearExistingOutput();

  const padding = Math.max(3, String(sources.length).length);
  const mapping = [];

  for (const [index, source] of sources.entries()) {
    const name = `${String(index + 1).padStart(padding, '0')}.webp`;
    const { width, height } = await sharp(path.join(rawDir, source))
      .rotate() // Bakes in the EXIF orientation before the metadata is stripped.
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toFile(path.join(outDir, name));

    mapping.push({ source, name, width, height });
    console.log(`${source} -> src/photos/${name} (${width}x${height})`);
  }

  // A record of which original became which number, handy when writing captions.
  await writeFile(
    path.join(outDir, 'source-map.json'),
    `${JSON.stringify(Object.fromEntries(mapping.map(({ name, source }) => [name, source])), null, 2)}\n`,
  );

  console.log(`\nWrote ${mapping.length} photo(s) to src/photos/.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
