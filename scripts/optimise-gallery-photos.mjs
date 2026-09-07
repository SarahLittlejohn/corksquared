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
 * A file is skipped when its output already exists and is newer than the
 * source, so repeat builds only touch newly added or changed photos.
 * Optimised files with no matching source any more (the original was
 * renamed or deleted) are removed.
 */
import { mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDir = path.join(root, 'src', 'photos');
const outDir = path.join(root, 'src', 'photos-optimised');

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

async function isUpToDate(sourcePath, outPath) {
  const [sourceStat, outStat] = await Promise.all([
    stat(sourcePath),
    stat(outPath).catch(() => null),
  ]);
  return outStat !== null && outStat.mtimeMs >= sourceStat.mtimeMs;
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
  let converted = 0;
  let skipped = 0;

  for (const name of sources) {
    const sourcePath = path.join(sourceDir, name);
    const outPath = path.join(outDir, outputName(name));

    if (await isUpToDate(sourcePath, outPath)) {
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

    converted += 1;
  }

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
