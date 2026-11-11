import { create } from 'zustand';

interface AnnouncerState {
  message: string;
  /** Bumped on every announcement so repeating the same text is still announced. */
  count: number;
}

/** Text for the polite live region rendered by <Announcer />. */
export const useAnnouncer = create<AnnouncerState>(() => ({
  message: '',
  count: 0,
}));

/** Tell screen-reader users about something that happened visually. */
export function announce(message: string) {
  useAnnouncer.setState((state) => ({ message, count: state.count + 1 }));
}
