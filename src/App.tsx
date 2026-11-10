import styles from './App.module.css';

// Placeholder for step 1 (scaffold). Replaced by the desktop shell in step 3.
export function App() {
  return (
    <main className={styles.desktop}>
      <section className={styles.window} aria-labelledby="welcome-title">
        <h1 id="welcome-title" className={styles.title}>
          Welcome to Mike OS
        </h1>
        <p className={styles.body}>
          This computer is still being assembled. Check back soon, or visit{' '}
          <a href="https://mikedemar.com/">mikedemar.com</a>.
        </p>
      </section>
    </main>
  );
}
