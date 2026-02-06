import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

interface SearchState {
  jobDescription: string;
  sessionId: string | null;
  query: string | null;
  totalFound: number;
}

interface SearchContextType {
  state: SearchState;
  setJobDescription: (jd: string) => void;
  setSearchResults: (sessionId: string, query: string, totalFound: number) => void;
  clearSearch: () => void;
}

const initialState: SearchState = {
  jobDescription: '',
  sessionId: null,
  query: null,
  totalFound: 0,
};

const SearchContext = createContext<SearchContextType | null>(null);

export function SearchProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SearchState>(initialState);

  const setJobDescription = useCallback((jd: string) => {
    setState(prev => ({ ...prev, jobDescription: jd }));
  }, []);

  const setSearchResults = useCallback((sessionId: string, query: string, totalFound: number) => {
    setState(prev => ({ ...prev, sessionId, query, totalFound }));
  }, []);

  const clearSearch = useCallback(() => {
    setState(initialState);
  }, []);

  const value = useMemo(() => ({
    state,
    setJobDescription,
    setSearchResults,
    clearSearch,
  }), [state, setJobDescription, setSearchResults, clearSearch]);

  return (
    <SearchContext.Provider value={value}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within SearchProvider');
  }
  return context;
}
