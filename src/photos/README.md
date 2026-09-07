# Photos

The committed source photos live here and are ordered by filename. They don't
need to be web-sized already: `npm run photos:web` (wired into `predev` and
`prebuild`) resizes each one to a 1600px max edge, converts it to WebP at
quality 80, and writes it to `src/photos-optimised/` (gitignored — it's a
build cache, regenerated from the files here). The gallery imports from that
optimised directory, not from here directly.

- Name them as zero-padded numbers: `001.webp`, `002.webp`, `010.webp` — or
  anything else that sorts the way you want; the padding only matters if you
  use plain numbers, since without it `10.jpg` sorts before `2.jpg`.
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
- Adding, removing or reordering photos needs no code change: rename the files
  and rebuild. Rebuilds only reprocess new or changed files; deleted originals
  have their optimised copy cleaned up automatically.

## Generating numbered originals (optional)

If you'd rather not name the originals yourself, drop them into `photos-raw/`
(gitignored) and run:

```
npm run photos:optimise
```

That resizes to a 2000px max edge, converts to WebP at quality 82, strips EXIF
and writes the numbered files here, in the natural sort order of the source
filenames, ready for `photos:web` to optimise for the gallery in turn. It also
writes `source-map.json` so you can see which original became which number.

## Captions (optional)

Create `captions.json` in this folder to caption individual photos, keyed by
the optimised filename (same name, `.webp` extension):

```json
{
  "001.webp": "Where it all began",
  "004.webp": "Ibiza, 2019"
}
```

Photos with no entry render without a caption. The caption also becomes the
image `alt` text; uncaptioned photos fall back to "Photo of Zach, number N".
The file may be absent entirely.

## dimensions.json

Generated automatically in `src/photos-optimised/` before `dev` and `build`,
and gitignored. It holds each photo's intrinsic size so the browser can
reserve the right space and avoid layout shift.
