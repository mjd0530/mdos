import { findNode } from '../../vfs';
import { defineApp } from '../types';

export interface FilesPayload {
  folderId: string;
}

export default defineApp<FilesPayload>({
  id: 'files',
  name: 'Files',
  icon: 'files',
  // One window per folder you open; navigating inside a window keeps that window.
  instances: 'per-document',
  documentKey: (payload) => payload.folderId,
  title: (payload) => (payload && findNode(payload.folderId)?.name) ?? 'Files',
  window: { size: { w: 440, h: 300 }, minSize: { w: 240, h: 160 } },
  load: () => import('./FilesApp'),
});
