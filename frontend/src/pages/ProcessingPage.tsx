import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../components/shared/Icon';
import { NoiseOverlay } from '../components/landing/NoiseOverlay';
import { ProcessingLoader } from '../components/processing/ProcessingLoader';
import { ProgressBar } from '../components/processing/ProgressBar';
import { StepIndicator, ProcessingStep } from '../components/processing/StepIndicator';

const INITIAL_STEPS: ProcessingStep[] = [
  { id: 'analyze', label: 'Analyzing job description', status: 'pending' },
  { id: 'search', label: 'Searching repositories', status: 'pending' },
  { id: 'rank', label: 'Ranking candidates', status: 'pending' },
  { id: 'prepare', label: 'Preparing results', status: 'pending' },
];

const STATUS_MESSAGES = [
  'Setting up environment...',
  'Parsing requirements...',
  'Querying GitHub API...',
  'Analyzing code patterns...',
  'Evaluating contributions...',
  'Calculating match scores...',
  'Finalizing results...',
];

export function ProcessingPage() {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState<ProcessingStep[]>(INITIAL_STEPS);
  const [statusMessage, setStatusMessage] = useState(STATUS_MESSAGES[0]);

  useEffect(() => {
    // Mock progress simulation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, 100); // ~10 seconds to complete

    return () => clearInterval(progressInterval);
  }, []);

  // Update steps based on progress
  useEffect(() => {
    const stepThresholds = [0, 25, 50, 75];

    setSteps((prevSteps) =>
      prevSteps.map((step, index) => {
        const threshold = stepThresholds[index];
        const nextThreshold = stepThresholds[index + 1] ?? 100;

        if (progress >= nextThreshold) {
          return { ...step, status: 'complete' };
        } else if (progress >= threshold) {
          return { ...step, status: 'active' };
        }
        return { ...step, status: 'pending' };
      })
    );
  }, [progress]);

  // Update status message based on progress
  useEffect(() => {
    const messageIndex = Math.min(
      Math.floor(progress / (100 / STATUS_MESSAGES.length)),
      STATUS_MESSAGES.length - 1
    );
    setStatusMessage(STATUS_MESSAGES[messageIndex]);
  }, [progress]);

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
          <ProgressBar progress={progress} status={statusMessage} />

          {/* Step Indicators */}
          <StepIndicator steps={steps} />
        </div>
      </main>
    </div>
  );
}
