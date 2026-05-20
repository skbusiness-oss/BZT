import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './AppRoutes';
import { ErrorBoundary } from './components/shared/ErrorBoundary';

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <Router>
                    <AuthProvider>
                        <ErrorBoundary>
                            <DataProvider>
                                <AppRoutes />
                            </DataProvider>
                        </ErrorBoundary>
                    </AuthProvider>
                </Router>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
