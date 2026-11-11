import { defineApp } from '../types';

export interface NotesPayload {
  docId: string;
  title: string;
}

export default defineApp<NotesPayload>({
  id: 'notes',
  name: 'Notes',
  icon: 'notes',
  instances: 'per-document',
  documentKey: (payload) => payload.docId,
  title: (payload) => payload?.title ?? 'Notes',
  window: { size: { w: 560, h: 440 }, minSize: { w: 280, h: 200 } },
  load: () => import('./NotesApp'),
});
