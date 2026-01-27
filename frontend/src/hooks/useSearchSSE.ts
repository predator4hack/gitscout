import { useState, useEffect, useRef } from 'react';
import { config } from '../config';

export type SearchStep = 'analyze' | 'search' | 'rank' | 'prepare';

interface SSEState {
  progress: number;
  currentStep: SearchStep;
  message: string;
  sessionId: string | null;
  totalFound: number;
  error: string | null;
  isComplete: boolean;
}

const initialState: SSEState = {
  progress: 0,
  currentStep: 'analyze',
  message: 'Initializing...',
  sessionId: null,
  totalFound: 0,
  error: null,
  isComplete: false,
};

export function useSearchSSE(jobDescription: string, provider: string = config.defaultLLMProvider) {
  const [state, setState] = useState<SSEState>(initialState);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!jobDescription) {
      return;
    }

    // Reset state when starting new search
    setState(initialState);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchSSE = async () => {
      try {
        const response = await fetch(`${config.apiBaseUrl}/api/search/repos/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jd_text: jobDescription,
            provider: provider,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Search failed: ${response.status} ${response.statusText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        let buffer = '';

        // Helper function to process a single SSE line
        const processLine = (line: string) => {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.event === 'step') {
                setState(prev => ({
                  ...prev,
                  progress: data.progress,
                  currentStep: data.step as SearchStep,
                  message: data.message,
                }));
              } else if (data.event === 'complete') {
                setState(prev => ({
                  ...prev,
                  progress: 100,
                  sessionId: data.sessionId,
                  totalFound: data.totalFound,
                  isComplete: true,
                  message: 'Search complete!',
                }));
              } else if (data.event === 'error') {
                setState(prev => ({
                  ...prev,
                  error: data.message,
                }));
              }
            } catch (parseError) {
              console.error('Failed to parse SSE data:', parseError);
            }
          }
        };

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            processLine(line);
          }
        }

        // Process any remaining data in buffer after stream ends
        if (buffer.trim()) {
          processLine(buffer.trim());
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('SSE connection error:', err);
          setState(prev => ({
            ...prev,
            error: (err as Error).message || 'Connection failed',
          }));
        }
      }
    };

    fetchSSE();

    return () => {
      controller.abort();
      abortControllerRef.current = null;
    };
  }, [jobDescription, provider]);

  return state;
}
