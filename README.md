# Happy 30th Birthday Zach

A two-page static site. The landing page is a single line of text; clicking it
opens a long, scroll-driven photo gallery that reveals each image as you reach
it.

No backend, no database, no CMS.

## Stack

Vite, React 18, TypeScript, React Router. Plain CSS: custom properties in
`src/styles/theme.css` plus per-component CSS modules. Scroll reveals use the
native `IntersectionObserver`, no animation library.

Requires Node 20+.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static output in dist/
npm run preview
```

## Adding photos

Photos are ordered by filename and need no code change to add, remove or
reorder.

1. Drop the originals into `photos-raw/` (gitignored), named in the order you
   want them shown.
2. Run `npm run photos:optimise`. Each file is resized to a 2000px max edge,
   converted to WebP at quality 82, stripped of EXIF and written to
   `src/photos/` as `001.webp`, `002.webp`, and so on.
3. Rebuild.

Photos can also be dropped straight into `src/photos/` by hand, as long as the
names are zero-padded numbers (`001.webp`, not `1.webp`, so plain string sorting
gives the right order).

`src/photos/README.md` covers the details, including the optional
`captions.json`.

### Captions

Create `src/photos/captions.json` to caption individual photos:

```json
{
  "001.webp": "Where it all began",
  "004.webp": "Ibiza, 2019"
}
```

Photos with no entry render without a caption. The caption also becomes the
image `alt` text; uncaptioned photos fall back to "Photo of Zach, number N".
The file is optional and may be absent entirely.

### Layout shift

`scripts/photo-dimensions.mjs` runs automatically before `dev` and `build`. It
reads each photo's intrinsic size into `src/photos/dimensions.json` (gitignored)
so the `<img>` elements carry `width` and `height` and nothing jumps as the
photos load.

## Deploying

The output in `dist/` is plain static files, deployable to Netlify, Vercel,
GitHub Pages or Cloudflare Pages.

Because routing is client-side, the host needs a rewrite so `/the-platform`
serves `index.html` on refresh:

- **Netlify**: `public/_redirects` is already in place.
- **Vercel**: `vercel.json` is already in place.
- **GitHub Pages**: no rewrite support, so build with the repo subpath and copy
  `index.html` to `404.html`:

  ```bash
  VITE_BASE=/corksquared/ npm run build && cp dist/index.html dist/404.html
  ```

## Structure

```
index.html
scripts/
  optimise-photos.mjs     # photos-raw/ -> src/photos/, run by hand
  photo-dimensions.mjs    # src/photos/ -> dimensions.json, runs on dev/build
photos-raw/               # originals, gitignored
src/
  main.tsx
  App.tsx                 # router
  photos/                 # numbered photos + optional captions.json
  pages/
    Landing.tsx
    ThePlatform.tsx
  components/
    RevealPhoto.tsx
  hooks/
    useReveal.ts
  lib/
    photos.ts             # glob import, sorting, caption merge
  styles/
    theme.css
    global.css
```
