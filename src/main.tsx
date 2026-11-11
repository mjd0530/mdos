import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import { OS } from './os/OS';
import { installChromeArt } from './ui/chromeArt';

installChromeArt();

// Test hook: Playwright loads ?e2e to open fixture apps directly. Harmless otherwise.
if (new URLSearchParams(window.location.search).has('e2e')) {
  void import('./apps/launch').then(({ launch }) => {
    (window as unknown as { mikeos: unknown }).mikeos = { launch };
  });
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <OS />
  </StrictMode>,
);
