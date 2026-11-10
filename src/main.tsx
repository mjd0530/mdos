import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import { OS } from './os/OS';
import { installChromeArt } from './ui/chromeArt';

installChromeArt();

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root element');

createRoot(root).render(
  <StrictMode>
    <OS />
  </StrictMode>,
);
