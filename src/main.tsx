import React from 'react'
import ReactDOM from 'react-dom/client'
import * as Sentry from '@sentry/react'
import App from './App.tsx'
import './index.css'

// Sentry production observability. DSN is read from `VITE_SENTRY_DSN`
// (Vite injects env vars at build time). Without a DSN we no-op — handy
// for local dev where we don't want noise. Errors are then captured both
// automatically (uncaught) and explicitly via the ErrorBoundary below.
const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (dsn) {
    Sentry.init({
        dsn,
        environment: import.meta.env.MODE,
        // Sample rates kept low — we're a small-volume app, signal > noise.
        tracesSampleRate: 0.05,
        replaysSessionSampleRate: 0,
        replaysOnErrorSampleRate: 0.5,
        // Don't ship PII. Sentry can auto-attach IPs and emails; opt out.
        sendDefaultPii: false,
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
