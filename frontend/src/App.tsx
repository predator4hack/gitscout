import { Routes, Route } from 'react-router-dom';
import { LandingPage } from './pages/LandingPage';
import { SearchApp } from './pages/SearchApp';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/app" element={<SearchApp />} />
    </Routes>
  );
}

export default App;
