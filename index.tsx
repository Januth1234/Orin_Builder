import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

declare global {
  interface Window {
    __orinBooted?: boolean;
    __orinBootError?: string;
  }
}

window.__orinBooted = false;
window.__orinBootError = undefined;

window.addEventListener('error', (event) => {
  window.__orinBootError = event?.message ?? 'Unknown startup error';
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = (event.reason as any)?.message ?? String(event.reason ?? 'Unknown startup rejection');
  window.__orinBootError = reason;
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}
const root = ReactDOM.createRoot(rootElement);

const StartupError: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-screen w-screen items-center justify-center bg-b-bg px-4">
    <div className="max-w-md rounded-2xl border border-b-border bg-b-surf p-5 text-center">
      <p className="text-base font-semibold text-white">Builder failed to start</p>
      <p className="mt-2 text-sm text-b-muted">{message}</p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded-lg border border-b-border bg-b-elev px-3 py-1.5 text-xs font-medium text-white hover:border-b-muted"
      >
        Retry startup
      </button>
    </div>
  </div>
);

async function mountApp() {
  try {
    const { default: App } = await import('./App');
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    window.__orinBooted = true;
  } catch (error: any) {
    const message = error?.message ?? 'Unknown startup failure';
    window.__orinBootError = message;
    root.render(<StartupError message={message} />);
  }
}

void mountApp();
