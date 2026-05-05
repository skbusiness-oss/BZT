import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppRoutes } from './AppRoutes';

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <Router>
                    <AuthProvider>
                        <DataProvider>
                            <AppRoutes />
                        </DataProvider>
                    </AuthProvider>
                </Router>
            </LanguageProvider>
        </ThemeProvider>
    );
}

export default App;
