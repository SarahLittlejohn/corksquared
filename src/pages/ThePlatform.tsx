import { Link } from 'react-router-dom';
import { RevealPhoto } from '../components/RevealPhoto';
import { photos } from '../lib/photos';
import styles from './ThePlatform.module.css';

const EAGER_COUNT = 2;

export function ThePlatform() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Happy 30th Birthday Zach!</h1>

      {photos.length > 0 ? (
        <div className={styles.gallery}>
          {photos.map((photo, index) => (
            <RevealPhoto key={photo.name} photo={photo} eager={index < EAGER_COUNT} />
          ))}
        </div>
      ) : (
        <p className={styles.empty}>
          No photos yet. Drop numbered image files into <code>src/photos/</code> (
          <code>001.webp</code>, <code>002.webp</code>, and so on) and rebuild.
        </p>
      )}

      <div className={styles.closing}>
        <p className={styles.closingText}>Happy birthday, Zach</p>
        <Link className={styles.backLink} to="/">
          Back to the start
        </Link>
      </div>
    </main>
  );
}
