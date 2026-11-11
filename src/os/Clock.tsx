import { useEffect, useMemo, useState } from 'react';
import styles from './Clock.module.css';
import { useSettings } from './settings';

const dateFormat = new Intl.DateTimeFormat(undefined, {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
});
const fullFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'full',
  timeStyle: 'short',
});

/** Re-render on each minute boundary rather than every second. */
function useMinute() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let timer: number;
    const schedule = () => {
      const msToNextMinute = 60_000 - (Date.now() % 60_000);
      timer = window.setTimeout(() => {
        setNow(new Date());
        schedule();
      }, msToNextMinute + 50);
    };
    schedule();
    return () => window.clearTimeout(timer);
  }, []);
  return now;
}

/** Menu-bar clock. Click (or Enter) toggles between time and date, like the System 7.5 clock. */
export function Clock() {
  const now = useMinute();
  const clock24h = useSettings((s) => s.clock24h);
  const timeFormat = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !clock24h,
      }),
    [clock24h],
  );
  const [showDate, setShowDate] = useState(false);

  return (
    <button
      type="button"
      className={styles.clock}
      onClick={() => setShowDate((v) => !v)}
      title={`${fullFormat.format(now)} (click to show ${showDate ? 'time' : 'date'})`}
    >
      <time dateTime={now.toISOString()}>
        {showDate ? dateFormat.format(now) : timeFormat.format(now)}
      </time>
    </button>
  );
}
