export type Photo = {
  /** File name as it appears in `src/photos-optimised/`, e.g. `001.webp`. */
  name: string;
  /** Hashed, build-time URL for the asset. */
  url: string;
  /** Caption from `captions.json`, when one exists. */
  caption?: string;
  /** Intrinsic dimensions, when `dimensions.json` has been generated. */
  width?: number;
  height?: number;
  /** Text for the `alt` attribute. Falls back to a generic description. */
  alt: string;
};

type Dimensions = Record<string, { width: number; height: number }>;

const modules = import.meta.glob('../photos-optimised/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

/*
 * Both JSON files are optional, so they are pulled in with a glob rather than a
 * bare import: a glob that matches nothing yields an empty object instead of
 * failing the build.
 */
const captionModules = import.meta.glob('../photos/captions.json', {
  eager: true,
  import: 'default',
}) as Record<string, Record<string, string>>;

const dimensionModules = import.meta.glob('../photos-optimised/dimensions.json', {
  eager: true,
  import: 'default',
}) as Record<string, Dimensions>;

const captions = Object.values(captionModules)[0] ?? {};
const dimensions = Object.values(dimensionModules)[0] ?? {};

const fileName = (path: string) => path.slice(path.lastIndexOf('/') + 1);

export const photos: Photo[] = Object.entries(modules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([path, url], index) => {
    const name = fileName(path);
    const caption = captions[name];
    const size = dimensions[name];

    return {
      name,
      url,
      caption,
      width: size?.width,
      height: size?.height,
      alt: caption ?? `Photo of Zach, number ${index + 1}`,
    };
  });
