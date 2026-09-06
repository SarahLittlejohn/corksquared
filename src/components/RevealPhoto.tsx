import { useReveal } from '../hooks/useReveal';
import type { Photo } from '../lib/photos';
import styles from './RevealPhoto.module.css';

type Props = {
  photo: Photo;
  /** The first couple of photos load eagerly so the top of the page paints immediately. */
  eager?: boolean;
};

export function RevealPhoto({ photo, eager = false }: Props) {
  const { ref, isVisible } = useReveal<HTMLElement>();

  return (
    <figure
      ref={ref}
      className={`${styles.figure} ${isVisible ? styles.isVisible : ''}`}
    >
      <img
        className={styles.image}
        src={photo.url}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        loading={eager ? 'eager' : 'lazy'}
        decoding={eager ? 'sync' : 'async'}
        fetchPriority={eager ? 'high' : 'auto'}
      />
      {photo.caption && <figcaption className={styles.caption}>{photo.caption}</figcaption>}
    </figure>
  );
}
