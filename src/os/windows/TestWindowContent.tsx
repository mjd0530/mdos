import styles from './TestWindowContent.module.css';

// Temporary content for File → New Window until real apps arrive (step 5).
export function TestWindowContent({ title }: { title: string }) {
  return (
    <div className={styles.page}>
      <p>
        <strong>{title}</strong> is a test window. Drag the title bar to move
        it, drag the bottom-right box to resize it, and try the close, zoom and
        collapse boxes.
      </p>
      <p>
        Keyboard: focus the title (Tab), then use arrow keys to move and
        Shift+arrow keys to resize. Ctrl+` switches between windows.
      </p>
      {Array.from({ length: 20 }, (_, i) => (
        <p key={i} className={styles.line}>
          Line {i + 1}. This line is deliberately long so the window needs a
          horizontal scroll bar as well as a vertical one.
        </p>
      ))}
    </div>
  );
}
