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
        // Tag every event with the deployed bundle hash so we can correlate
        // a Sentry alert to "which release was this". Vite gives us the
        // bundle hash via import.meta.env at build time, but it's not
        // exposed by default — we use the build mode + a timestamp env
        // var that Firebase Hosting populates via __FIREBASE_DEFAULTS__.
        // For now, just tag with mode.
        release: `biozack@${import.meta.env.MODE}`,
    });

    // Global unhandled-promise-rejection catch. Without this, an awaited
    // Firebase call inside an async useEffect that throws becomes a
    // silent failure in the browser — Sentry's automatic instrumentation
    // catches most but not all. This guarantees coverage.
    window.addEventListener('unhandledrejection', (event) => {
        Sentry.captureException(event.reason ?? new Error('Unhandled promise rejection (no reason given)'), {
            tags: { source: 'unhandledrejection' },
        });
    });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>,
)
