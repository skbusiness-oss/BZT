import { Component, ReactNode } from 'react';
import * as Sentry from '@sentry/react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Report to Sentry (no-ops when DSN isn't configured) so route-level
        // crashes are observable in production. Component stack goes in the
        // Sentry context for fast triage.
        Sentry.captureException(error, {
            contexts: {
                react: { componentStack: info.componentStack ?? '' },
            },
        });
        console.error('ErrorBoundary caught:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) return this.props.fallback;

            return (
                <div className="flex items-center justify-center min-h-[300px] p-8">
                    <div className="clay-card p-8 max-w-md w-full text-center">
                        <AlertCircle className="mx-auto text-red-400 mb-4" size={40} />
                        {/* Localization isn't available here (class component
                            outside the LanguageProvider context tree at error
                            time). The two strings below are intentionally EN
                            with AR appended so users in either locale can
                            understand the recovery action without prior i18n
                            wiring. The strings are short and crisis-state. */}
                        <h2 className="text-xl font-bold text-on-surface mb-2">Something went wrong / حدث خطأ</h2>
                        <p className="text-on-surface/70 text-sm mb-6">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="py-3 px-6 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw size={16} /> Try Again / حاول
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
