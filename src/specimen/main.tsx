import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/fonts.css';
import { Specimen } from './Specimen';
import { applyDisplay } from '../os/display';
import { useSettings } from '../os/settings';

// Saved settings load synchronously, so the first paint is already in the right look.
{
  const { display, highlight } = useSettings.getState();
  applyDisplay(display, highlight);
}

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <Specimen />
  </StrictMode>,
);
