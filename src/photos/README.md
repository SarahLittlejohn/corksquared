# Photos

Web-ready photos live here and are ordered by filename.

- Name them as zero-padded numbers: `001.webp`, `002.webp`, `010.webp`.
  The padding matters: without it `10.webp` sorts before `2.webp`.
- Supported extensions: `.jpg`, `.jpeg`, `.png`, `.webp`, `.avif`.
- Adding, removing or reordering photos needs no code change: rename the files
  and rebuild.

## Generating them

Drop the originals into `photos-raw/` (gitignored) and run:

```
npm run photos:optimise
```

That resizes to a 2000px max edge, converts to WebP at quality 82, strips EXIF
and writes the numbered files here, in the natural sort order of the source
filenames. It also writes `source-map.json` so you can see which original became
which number.

## Captions (optional)

Create `captions.json` in this folder to caption individual photos:

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

Generated automatically before `dev` and `build`, and gitignored. It holds each
photo's intrinsic size so the browser can reserve the right space and avoid
layout shift.
