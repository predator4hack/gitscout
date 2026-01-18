import { useState } from 'react';
import { Provider, SearchRequest } from '../types';

interface SearchFormProps {
  onSearch: (request: SearchRequest) => void;
  loading: boolean;
}

export function SearchForm({ onSearch, loading }: SearchFormProps) {
  const [jdText, setJdText] = useState('');
  const [provider, setProvider] = useState<Provider>('mock');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim()) {
      alert('Please enter a job description');
      return;
    }

    onSearch({
      jd_text: jdText,
      provider,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-group">
        <label htmlFor="jd-text">Job Description</label>
        <textarea
          id="jd-text"
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Enter job description or technical requirements (e.g., 'Python ML engineer with experience in distributed systems')"
          rows={8}
          disabled={loading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="provider">LLM Provider</label>
        <select
          id="provider"
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          disabled={loading}
        >
          <option value="mock">Mock (No API calls - for testing)</option>
          <option value="gemini">Gemini</option>
          <option value="groq">Groq</option>
          <option value="ollama">Ollama (Local)</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="search-button">
        {loading ? 'Searching...' : 'Search Candidates'}
      </button>
    </form>
  );
}
