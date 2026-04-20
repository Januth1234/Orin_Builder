import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

declare global {
  interface Window {
    __orinBooted?: boolean;
    __orinBootError?: string;
  }
}

window.__orinBooted = false;

window.addEventListener('error', (event) => {
  window.__orinBootError = event?.message ?? 'Unknown startup error';
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event.reason as any)?.message ?? String(event.reason ?? 'Unknown startup rejection');
  window.__orinBootError = reason;
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

window.__orinBooted = true;
