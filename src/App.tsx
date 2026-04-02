import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LanguageProvider } from './context/LanguageContext';
import { AppRoutes } from './AppRoutes';

function App() {
    return (
        <LanguageProvider>
            <Router>
                <AuthProvider>
                    <DataProvider>
                        <AppRoutes />
                    </DataProvider>
                </AuthProvider>
            </Router>
        </LanguageProvider>
    );
}

export default App;
