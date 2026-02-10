import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import { Candidate, CandidateFilters } from '../types/index';
import {
  getJobSearch,
  updateJobSearchCandidates,
  toggleStarredCandidate,
} from '../api/jobSearch';

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
  loadJobSearch: (searchId: string) => Promise<void>;
  updateCandidates: (candidates: Candidate[], filters: CandidateFilters | null) => Promise<void>;
  toggleStarCandidate: (candidateId: string) => Promise<void>;
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

  const loadJobSearch = useCallback(async (searchId: string) => {
    try {
      const jobSearch = await getJobSearch(searchId);
      setState({
        jobDescription: jobSearch.job_description,
        sessionId: jobSearch.search_id,
        query: jobSearch.query,
        totalFound: jobSearch.total_found,
      });
    } catch (error) {
      console.error('Failed to load job search:', error);
      throw error;
    }
  }, []);

  const updateCandidates = useCallback(async (candidates: Candidate[], filters: CandidateFilters | null) => {
    if (!state.sessionId) {
      console.warn('Cannot update candidates: no active session');
      return;
    }

    try {
      await updateJobSearchCandidates(state.sessionId, candidates, filters);
    } catch (error) {
      console.error('Failed to update candidates:', error);
      // Don't throw - graceful degradation if Firestore fails
    }
  }, [state.sessionId]);

  const toggleStarCandidate = useCallback(async (candidateId: string) => {
    if (!state.sessionId) {
      console.warn('Cannot toggle star: no active session');
      return;
    }

    try {
      await toggleStarredCandidate(state.sessionId, candidateId);
    } catch (error) {
      console.error('Failed to toggle starred candidate:', error);
      // Don't throw - graceful degradation if Firestore fails
    }
  }, [state.sessionId]);

  const value = useMemo(() => ({
    state,
    setJobDescription,
    setSearchResults,
    clearSearch,
    loadJobSearch,
    updateCandidates,
    toggleStarCandidate,
  }), [state, setJobDescription, setSearchResults, clearSearch, loadJobSearch, updateCandidates, toggleStarCandidate]);

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
