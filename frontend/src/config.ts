// Application configuration from environment variables

export const config = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  defaultLLMProvider: import.meta.env.VITE_DEFAULT_LLM_PROVIDER || 'mock',
} as const;
