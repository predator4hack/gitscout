import { useState } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultsList } from './components/ResultsList';
import { searchCandidates } from './api/search';
import { SearchRequest, SearchResponse } from './types';
import './App.css';

function App() {
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (request: SearchRequest) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await searchCandidates(request);
      setResults(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>GitScout</h1>
        <p>Discover GitHub candidates based on job requirements</p>
      </header>

      <main className="main">
        <SearchForm onSearch={handleSearch} loading={loading} />

        {error && (
          <div className="error">
            <strong>Error:</strong> {error}
          </div>
        )}

        {results && (
          <ResultsList candidates={results.candidates} query={results.query} />
        )}
      </main>

      <footer className="footer">
        <p>GitScout MVP - Powered by GitHub GraphQL API</p>
      </footer>
    </div>
  );
}

export default App;
