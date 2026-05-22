import { StrictMode } from 'react';
import * as ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { tanstackQueryClient } from '@cockpit-app/shared-react-data-access';
import { Toaster } from '@cockpit-app/shared-react-ui';
import App from './app/app';
import './styles.css';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement,
);

root.render(
  <StrictMode>
    <QueryClientProvider client={tanstackQueryClient}>
      <App />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);
