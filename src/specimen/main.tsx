import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/tokens.css';
import '../styles/base.css';
import '../styles/fonts.css';
import { Specimen } from './Specimen';
import { installChromeArt } from '../ui/chromeArt';

installChromeArt();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <Specimen />
  </StrictMode>,
);
