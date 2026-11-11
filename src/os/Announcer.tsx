import { useAnnouncer } from './announce';

/** One polite live region for the whole OS. Keying the text by count re-announces repeats. */
export function Announcer() {
  const { message, count } = useAnnouncer();
  return (
    <div className="visually-hidden" aria-live="polite" aria-atomic="true">
      <span key={count}>{message}</span>
    </div>
  );
}
