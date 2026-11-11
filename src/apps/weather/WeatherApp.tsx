import type { FormEvent } from 'react';
import { useEffect, useId, useState } from 'react';
import { announce } from '../../os/announce';
import { useSettings } from '../../os/settings';
import { Button } from '../../ui/Button';
import { PixelIcon } from '../../ui/PixelIcon';
import {
  DEFAULT_PLACE,
  describeCode,
  fetchForecast,
  roundCoordinate,
  searchPlaces,
  type Forecast,
  type Place,
} from './api';
import styles from './WeatherApp.module.css';

type Status =
  | { kind: 'loading' }
  | { kind: 'ready'; forecast: Forecast }
  | { kind: 'error' };

/** A finished request, tagged with what it was for. */
type Result = { key: string } & (
  { kind: 'ready'; forecast: Forecast } | { kind: 'error' }
);

const dayName = (date: string, index: number) => {
  if (index === 0) return 'Today';
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    new Date(y ?? 0, (m ?? 1) - 1, d ?? 1),
  );
};

/** Current weather and a 5-day forecast. Location is asked for only on request (D-026). */
export default function WeatherApp() {
  const unit = useSettings((s) => s.weatherUnit);
  const savedPlace = useSettings((s) => s.weatherPlace);
  const setSetting = useSettings((s) => s.set);
  // A "Use my location" position lives only for this window; it is never saved.
  const [hereNow, setHereNow] = useState<Place | null>(null);
  const place: Place = hereNow ?? savedPlace ?? DEFAULT_PLACE;

  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const symbol = unit === 'fahrenheit' ? '°F' : '°C';
  const wind = unit === 'fahrenheit' ? 'mph' : 'km/h';

  // Anything not answering the current request (place, unit, retry) counts as loading.
  const { latitude, longitude } = place;
  const requestKey = `${latitude},${longitude},${unit},${attempt}`;
  const status: Status =
    result?.key === requestKey ? result : { kind: 'loading' };

  useEffect(() => {
    const controller = new AbortController();
    const key = `${latitude},${longitude},${unit},${attempt}`;
    fetchForecast(
      { name: '', latitude, longitude },
      unit,
      controller.signal,
    ).then(
      (forecast) => setResult({ key, kind: 'ready', forecast }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn('Weather unavailable', error);
        setResult({ key, kind: 'error' });
      },
    );
    return () => controller.abort();
  }, [latitude, longitude, unit, attempt]);

  const choose = (next: Place, remember: boolean) => {
    if (remember) {
      setHereNow(null);
      setSetting('weatherPlace', next);
    } else {
      setHereNow(next);
    }
    setSearching(false);
    announce(`Weather for ${next.name}`);
  };

  const useMyLocation = () => {
    if (!('geolocation' in navigator)) {
      setNote('This browser can’t share a location.');
      return;
    }
    setLocating(true);
    setNote(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        choose(
          {
            name: 'Your location',
            latitude: roundCoordinate(position.coords.latitude),
            longitude: roundCoordinate(position.coords.longitude),
          },
          false,
        );
      },
      () => {
        setLocating(false);
        setNote(`Location not shared. Showing ${place.name}.`);
      },
      { enableHighAccuracy: false, maximumAge: 10 * 60_000, timeout: 10_000 },
    );
  };

  return (
    <div className={styles.weather}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.place}>{place.name}</h3>
          {place.region && <p className={styles.region}>{place.region}</p>}
        </div>
        <div className={styles.unitToggle} role="group" aria-label="Units">
          {(['fahrenheit', 'celsius'] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={styles.tool}
              aria-pressed={unit === option}
              onClick={() => setSetting('weatherUnit', option)}
            >
              {option === 'fahrenheit' ? '°F' : '°C'}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.locationActions}>
        <button
          type="button"
          className={styles.tool}
          aria-expanded={searching}
          onClick={() => setSearching((v) => !v)}
        >
          Change city…
        </button>
        <button
          type="button"
          className={styles.tool}
          onClick={useMyLocation}
          disabled={locating}
        >
          {locating ? 'Locating…' : 'Use my location'}
        </button>
      </div>
      {note && (
        <p className={styles.note} role="status">
          {note}
        </p>
      )}

      {searching && <PlaceSearch onChoose={(p) => choose(p, true)} />}

      <section
        className={styles.now}
        aria-live="polite"
        aria-busy={status.kind === 'loading'}
      >
        {status.kind === 'loading' && <p>Checking the sky…</p>}
        {status.kind === 'error' && (
          <div role="alert">
            <p>The weather service couldn’t be reached.</p>
            <Button onClick={() => setAttempt((n) => n + 1)}>Try Again</Button>
          </div>
        )}
        {status.kind === 'ready' && (
          <Current forecast={status.forecast} symbol={symbol} wind={wind} />
        )}
      </section>

      {status.kind === 'ready' && status.forecast.days.length > 0 && (
        <section aria-label="Five-day forecast">
          <ol className={styles.days}>
            {status.forecast.days.map((day, i) => {
              const { label, icon } = describeCode(day.code);
              return (
                <li key={day.date} className={styles.day}>
                  <span className={styles.dayName}>{dayName(day.date, i)}</span>
                  <PixelIcon name={icon} />
                  <span className="visually-hidden">{label}, </span>
                  <span>
                    <span className="visually-hidden">high </span>
                    {Math.round(day.high)}°
                    <span className={styles.low}>
                      <span className="visually-hidden">, low </span>
                      {' / '}
                      {Math.round(day.low)}°
                    </span>
                  </span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <p className={styles.credit}>
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Weather data by Open-Meteo.com
        </a>{' '}
        (
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY 4.0
        </a>
        )
      </p>
    </div>
  );
}

function Current({
  forecast,
  symbol,
  wind,
}: {
  forecast: Forecast;
  symbol: string;
  wind: string;
}) {
  const { current } = forecast;
  const { label, icon } = describeCode(current.code, current.isDay);
  return (
    <div className={styles.current}>
      <PixelIcon name={icon} scale={2} />
      <div>
        <p className={styles.temperature}>
          {Math.round(current.temperature)}
          {symbol}
        </p>
        <p>{label}</p>
        <p className={styles.details}>
          Feels like {Math.round(current.feelsLike)}° · Wind{' '}
          {Math.round(current.windSpeed)} {wind}
        </p>
      </div>
    </div>
  );
}

function PlaceSearch({ onChoose }: { onChoose: (place: Place) => void }) {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const search = async (event: FormEvent) => {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setBusy(true);
    setFailed(false);
    try {
      const found = await searchPlaces(query);
      setResults(found);
      announce(
        found.length ? `${found.length} places found` : 'No places found',
      );
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.search}>
      <form role="search" onSubmit={search} className={styles.searchForm}>
        <label htmlFor={inputId}>City</label>
        <input
          id={inputId}
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" isDefault disabled={busy}>
          Search
        </Button>
      </form>
      {failed && <p role="alert">Search didn’t work. Try again in a moment.</p>}
      {results && results.length === 0 && <p>No places found.</p>}
      {results && results.length > 0 && (
        <ul className={styles.results}>
          {results.map((place) => (
            <li key={`${place.latitude},${place.longitude}`}>
              <button
                type="button"
                className={styles.result}
                onClick={() => onChoose(place)}
              >
                {place.name}
                {place.region && (
                  <span className={styles.region}> — {place.region}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
