import { Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { LandingPage } from './pages/LandingPage';
import { SearchApp } from './pages/SearchApp';
import { DashboardPage } from './pages/DashboardPage';
import { ProcessingPage } from './pages/ProcessingPage';

function App() {
  return (
    <SearchProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/app" element={<SearchApp />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/processing" element={<ProcessingPage />} />
      </Routes>
    </SearchProvider>
  );
}

export default App;
