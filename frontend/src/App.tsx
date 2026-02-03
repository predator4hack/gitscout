import { Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { LandingPage } from './pages/LandingPage';
import { SearchApp } from './pages/SearchApp';
import { DashboardPage } from './pages/DashboardPage';
import { ProcessingPage } from './pages/ProcessingPage';

function App() {
  return (
    <AuthProvider>
      <SearchProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
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
        </Routes>
      </SearchProvider>
    </AuthProvider>
  );
}

export default App;
