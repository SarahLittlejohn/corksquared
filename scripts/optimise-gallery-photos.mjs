#!/usr/bin/env node
/**
 * Writes web-optimised copies of `src/photos/` into `src/photos-optimised/`:
 * resized to a 1600px max edge, converted to WebP at quality 80, EXIF-stripped.
 *
 * Runs automatically before `npm run dev` and `npm run build`, ahead of the
 * photos:dimensions step. The output directory is gitignored — it's a build
 * cache derived from the originals in `src/photos/`, which stay the
 * committed source of truth.
 *
 * A file is skipped when a manifest (.cache.json, gitignored alongside the
 * rest of this directory) shows its source's size and mtime are unchanged
 * since the last conversion, so repeat builds only touch newly added or
 * changed photos. Comparing against the *output's* mtime isn't enough on its
 * own: renaming a source (e.g. to reorder the gallery) can make it collide
 * with an unrelated pre-existing output of the same name, which would then
 * look "up to date" by mtime alone while actually holding stale content.
 * Optimised files with no matching source any more (the original was
 * renamed or deleted) are removed.
 */
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'photos');
const outDir = path.join(root, 'src', 'photos-optimised');
const manifestPath = path.join(outDir, '.cache.json');

const MAX_EDGE = 1600;
const QUALITY = 80;
const SOURCE_EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

const outputName = (sourceName) => `${sourceName.replace(SOURCE_EXTENSIONS, '')}.webp`;

async function listSources() {
  const entries = await readdir(sourceDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && SOURCE_EXTENSIONS.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

async function readManifest() {
  try {
    return JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    return {};
  }
}

async function removeOrphans(sourceNames) {
  const expected = new Set(sourceNames.map(outputName));
  const entries = await readdir(outDir, { withFileTypes: true }).catch(() => []);
  const orphans = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.webp') && !expected.has(entry.name))
    .map((entry) => entry.name);

  await Promise.all(orphans.map((name) => rm(path.join(outDir, name))));
  return orphans.length;
}

async function main() {
  await mkdir(outDir, { recursive: true });

  const sources = await listSources();
  const previousManifest = await readManifest();
  const manifest = {};
  let converted = 0;
  let skipped = 0;

  for (const name of sources) {
    const sourcePath = path.join(sourceDir, name);
    const outPath = path.join(outDir, outputName(name));
    const sourceStat = await stat(sourcePath);
    const fingerprint = `${sourceStat.size}:${sourceStat.mtimeMs}`;
    const outputExists = await stat(outPath).then(
      () => true,
      () => false,
    );

    if (outputExists && previousManifest[name] === fingerprint) {
      manifest[name] = fingerprint;
      skipped += 1;
      continue;
    }

    await sharp(sourcePath)
      .rotate() // Bakes in the EXIF orientation before the metadata is stripped.
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: QUALITY })
      .toFile(outPath);

    manifest[name] = fingerprint;
    converted += 1;
  }

  await writeFile(manifestPath, JSON.stringify(manifest));
  const removed = await removeOrphans(sources);

  console.log(
    `Optimised ${converted} photo(s), skipped ${skipped} already up to date` +
      (removed > 0 ? `, removed ${removed} orphaned file(s).` : '.'),
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
