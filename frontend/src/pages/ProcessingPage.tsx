import { useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '../components/shared/Icon';
import { NoiseOverlay } from '../components/landing/NoiseOverlay';
import { ProcessingLoader } from '../components/processing/ProcessingLoader';
import { ProgressBar } from '../components/processing/ProgressBar';
import { StepIndicator, ProcessingStep } from '../components/processing/StepIndicator';
import { useSearch } from '../contexts/SearchContext';
import { useSearchSSE, SearchStep } from '../hooks/useSearchSSE';
import { config } from '../config';

const STEP_IDS: SearchStep[] = ['analyze', 'search', 'rank', 'prepare'];

const STEP_LABELS: Record<SearchStep, string> = {
  analyze: 'Analyzing job description',
  search: 'Searching repositories',
  rank: 'Ranking candidates',
  prepare: 'Preparing results',
};

// Map step to its index for comparison
const STEP_INDEX: Record<SearchStep, number> = {
  analyze: 0,
  search: 1,
  rank: 2,
  prepare: 3,
};

export function ProcessingPage() {
  const navigate = useNavigate();
  const { state: searchState, setSearchResults } = useSearch();
  const { progress, currentStep, message, sessionId, totalFound, error, isComplete } = useSearchSSE(
    searchState.jobDescription,
    config.defaultLLMProvider
  );

  // Redirect to home if no job description
  useEffect(() => {
    if (!searchState.jobDescription) {
      navigate('/');
    }
  }, [searchState.jobDescription, navigate]);

  // Redirect to dashboard when complete
  useEffect(() => {
    console.log('[ProcessingPage] Effect check - isComplete:', isComplete, 'sessionId:', sessionId);
    if (isComplete && sessionId) {
      console.log('[ProcessingPage] Redirecting to dashboard with sessionId:', sessionId);
      setSearchResults(sessionId, '', totalFound);
      // Small delay to show 100% completion
      const timer = setTimeout(() => {
        console.log('[ProcessingPage] Navigating to /dashboard now');
        navigate('/dashboard');
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isComplete, sessionId, totalFound, navigate, setSearchResults]);

  // Compute steps based on current step from SSE
  const steps: ProcessingStep[] = useMemo(() => {
    // When complete, mark all steps as complete
    if (isComplete) {
      return STEP_IDS.map((stepId) => ({
        id: stepId,
        label: STEP_LABELS[stepId],
        status: 'complete' as const,
      }));
    }

    const currentIndex = STEP_INDEX[currentStep];
    return STEP_IDS.map((stepId, index) => ({
      id: stepId,
      label: STEP_LABELS[stepId],
      status: index < currentIndex ? 'complete' : index === currentIndex ? 'active' : 'pending',
    }));
  }, [currentStep, isComplete]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gs-body">
        <NoiseOverlay />
        <nav className="fixed top-0 w-full z-50 nav-glass">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-black">
                <Icon icon="solar:code-scan-bold" className="text-sm" />
              </div>
              <span className="font-medium tracking-tight text-sm text-white/90">
                GitScout
              </span>
            </Link>
          </div>
        </nav>
        <main className="flex-1 flex items-center justify-center pt-14">
          <div className="flex flex-col items-center gap-6 text-center px-6">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <Icon icon="lucide:alert-circle" className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-medium text-white">Something went wrong</h2>
            <p className="text-[#888888] max-w-md">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-4 py-2 bg-white text-black text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
            >
              Try again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gs-body">
      <NoiseOverlay />

      {/* Minimal Navigation */}
      <nav className="fixed top-0 w-full z-50 nav-glass">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-6 h-6 rounded flex items-center justify-center bg-white text-black">
              <Icon icon="solar:code-scan-bold" className="text-sm" />
            </div>
            <span className="font-medium tracking-tight text-sm text-white/90">
              GitScout
            </span>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center pt-14">
        <div className="flex flex-col items-center gap-12">
          {/* Animated Loader */}
          <ProcessingLoader />

          {/* Progress Bar */}
          <ProgressBar progress={progress} status={message} />

          {/* Step Indicators */}
          <StepIndicator steps={steps} />
        </div>
      </main>
    </div>
  );
}
