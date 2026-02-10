import { Routes, Route } from 'react-router-dom';
import { SearchProvider } from './contexts/SearchContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { SearchApp } from './pages/SearchApp';
import { DashboardPage } from './pages/DashboardPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { HistoryPage } from './pages/HistoryPage';

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/app" element={<SearchApp />} />
          <Route path="/processing" element={<ProcessingPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
