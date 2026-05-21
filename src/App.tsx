import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

// Provider order matters:
//   - LanguageProvider: no external deps; outermost
//   - Router: needed so Login/AppRoutes resolve
//   - AuthProvider: owns the users/{uid} live snapshot
//   - ThemeProvider: now INSIDE AuthProvider so it can read theme via
//     useAuth() instead of opening a second onAuthStateChanged +
//     onSnapshot on the same user doc. ThemeProvider's module-level
//     boot already paints the initial theme to <html> before React
//     mounts, so this nesting doesn't add a flash.
//   - DataProvider: needs auth-resolved user for queries
function App() {
    return (
        <LanguageProvider>
            <Router>
                <AuthProvider>
                    <ThemeProvider>
                        <ErrorBoundary>
                            <DataProvider>
                                <AppRoutes />
                            </DataProvider>
                        </ErrorBoundary>
                    </ThemeProvider>
                </AuthProvider>
            </Router>
        </LanguageProvider>
    );
}

export default App;
