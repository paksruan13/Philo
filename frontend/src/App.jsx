import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import AppRouter from './router/AppRouter';
import ErrorBoundary from './components/common/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;