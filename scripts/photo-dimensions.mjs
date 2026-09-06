#!/usr/bin/env node
/**
 * Writes `src/photos/dimensions.json`, mapping each photo filename to its
 * intrinsic width and height. The gallery puts those on the `<img>` elements so
 * the browser reserves the right box and nothing shifts as photos load.
 *
 * Runs automatically before `npm run dev` and `npm run build`. The output is
 * gitignored: it is derived from the photos themselves.
 *
 * Reads the image headers directly rather than pulling in sharp, so this stays
 * fast and works even when the native binary is unavailable.
 */
import { mkdir, open, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const photosDir = path.join(root, 'src', 'photos');
const outFile = path.join(photosDir, 'dimensions.json');

const EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

function readPng(buffer) {
  if (buffer.readUInt32BE(0) !== 0x89504e47) return null;
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

function readJpeg(buffer) {
  if (buffer.readUInt16BE(0) !== 0xffd8) return null;

  let offset = 2;
  while (offset + 9 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = buffer[offset + 1];
    // SOF0-SOF15, excluding the non-frame markers DHT (c4), JPG (c8) and DAC (cc).
    if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
    }
    offset += 2 + buffer.readUInt16BE(offset + 2);
  }
  return null;
}

function readWebp(buffer) {
  if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
    return null;
  }

  const format = buffer.toString('ascii', 12, 16);
  if (format === 'VP8X') {
    return {
      width: buffer.readUIntLE(24, 3) + 1,
      height: buffer.readUIntLE(27, 3) + 1,
    };
  }
  if (format === 'VP8 ') {
    return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
  }
  if (format === 'VP8L') {
    const bits = buffer.readUInt32LE(21);
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  return null;
}

function readAvif(buffer) {
  if (buffer.toString('ascii', 4, 8) !== 'ftyp') return null;

  // Pull the dimensions off the first `ispe` (image spatial extents) box.
  const index = buffer.indexOf('ispe', 0, 'ascii');
  if (index === -1 || index + 16 > buffer.length) return null;
  return { width: buffer.readUInt32BE(index + 8), height: buffer.readUInt32BE(index + 12) };
}

async function dimensionsOf(file) {
  const handle = await open(file, 'r');
  try {
    // 64KB is comfortably past the headers of every format handled here.
    const buffer = Buffer.alloc(65536);
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
    const header = buffer.subarray(0, bytesRead);

    return readPng(header) ?? readJpeg(header) ?? readWebp(header) ?? readAvif(header);
  } finally {
    await handle.close();
  }
}

async function main() {
  await mkdir(photosDir, { recursive: true });

  const entries = await readdir(photosDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && EXTENSIONS.test(entry.name))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  const dimensions = {};
  for (const name of files) {
    const size = await dimensionsOf(path.join(photosDir, name));
    if (size) {
      dimensions[name] = size;
    } else {
      console.warn(`Could not read the dimensions of ${name}; it will render without them.`);
    }
  }

  await writeFile(outFile, `${JSON.stringify(dimensions, null, 2)}\n`);
  console.log(`Wrote dimensions for ${Object.keys(dimensions).length} of ${files.length} photo(s).`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
