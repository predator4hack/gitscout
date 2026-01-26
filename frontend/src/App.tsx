import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SearchApp } from './pages/SearchApp';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<SearchApp />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
  );
}

export default App;
