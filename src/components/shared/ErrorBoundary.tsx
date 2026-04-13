import { Component, ReactNode } from 'react';
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
                        <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
                        <p className="text-navy-300 text-sm mb-6">
                            {this.state.error?.message || 'An unexpected error occurred.'}
                        </p>
                        <button
                            onClick={this.handleReset}
                            className="clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-6 py-3 flex items-center gap-2 mx-auto"
                        >
                            <RefreshCw size={16} /> Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
