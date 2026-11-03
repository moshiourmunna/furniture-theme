import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { AuthProvider } from './lib/auth';
import { PrefsProvider } from './lib/prefs';
import { UiProvider } from './components/ui';
import './index.css';

const qc = new QueryClient({ defaultOptions: { queries: { retry: (n, e) => n < 1 && !(e as { status?: number }).status, refetchOnWindowFocus: false, staleTime: 15_000 } } });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={qc}>
      <PrefsProvider>
        <UiProvider>
          <AuthProvider>
            <BrowserRouter><App /></BrowserRouter>
          </AuthProvider>
        </UiProvider>
      </PrefsProvider>
    </QueryClientProvider>
  </StrictMode>,
);
