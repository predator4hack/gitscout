/**
 * Centralized API client with automatic authentication headers
 */

import { auth } from '../lib/firebase';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get the current Firebase ID token for API authentication
 */
async function getAuthToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) {
    return null;
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return null;
  }
}

/**
 * Make an authenticated API request
 */
export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  // Get auth token if user is signed in
  const token = await getAuthToken();

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Make request
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle errors
  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;

    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch (e) {
      // Failed to parse error response, use default message
    }

    throw new Error(errorMessage);
  }

  // Parse response
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return response.json();
  }

  return response.text() as any;
}

/**
 * GET request
 */
export async function apiGet<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(
  endpoint: string,
  data?: any
): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Server-Sent Events (SSE) request with authentication
 */
export async function apiSSE(
  endpoint: string,
  onMessage: (data: any) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const token = await getAuthToken();

  // Build URL with auth token as query param (since EventSource doesn't support headers)
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  if (token) {
    url.searchParams.set('token', token);
  }

  const eventSource = new EventSource(url.toString());

  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      onMessage(data);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  };

  eventSource.onerror = (event) => {
    console.error('SSE error:', event);
    eventSource.close();
    if (onError) {
      onError(new Error('Server-Sent Events connection failed'));
    }
  };

  // Return a cleanup function
  return () => {
    eventSource.close();
  };
}

export default {
  request: apiRequest,
  get: apiGet,
  post: apiPost,
  patch: apiPatch,
  delete: apiDelete,
  sse: apiSSE,
};
