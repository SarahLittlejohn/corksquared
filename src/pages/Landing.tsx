import { Link } from 'react-router-dom';
import styles from './Landing.module.css';

export function Landing() {
  return (
    <main className={styles.main}>
      <Link className={styles.link} to="/the-platform">
        Enter The Platform
      </Link>
    </main>
  );
}
