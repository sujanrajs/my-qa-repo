const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Handles API response errors and network failures
 * Converts various error types into consistent Error objects
 */
const handleApiError = (err: unknown): Error => {
  // Network errors (offline, connection failures)
  if (err instanceof TypeError && err.message.includes('Failed to fetch')) {
    return new Error('Failed to fetch');
  }
  
  // JSON parsing errors (empty responses, malformed JSON)
  if (err instanceof SyntaxError || (err instanceof TypeError && err.message.includes('JSON'))) {
    return new Error('Invalid response format');
  }
  
  // Re-throw if already an Error, otherwise wrap
  return err instanceof Error ? err : new Error('Request failed');
};

/**
 * Processes HTTP error responses
 * Extracts error messages and adds context for auth errors
 */
const processErrorResponse = async (response: Response): Promise<Error> => {
  const error = await response.json().catch(() => ({ error: 'Request failed' }));
  const errorMessage = error.error || 'Request failed';
  
  // Add context for authentication errors (401/403)
  if (response.status === 401 || response.status === 403) {
    const hasAuthKeywords = errorMessage.includes('Unauthorized') || 
                           errorMessage.includes('Forbidden') || 
                           errorMessage.includes('Token') || 
                           errorMessage.includes('expired');
    return new Error(hasAuthKeywords ? errorMessage : `Unauthorized: ${errorMessage}`);
  }
  
  return new Error(errorMessage);
};

/**
 * Creates headers for API requests
 */
const createHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const api = {
  get: async <T>(endpoint: string, token?: string): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: createHeaders(token),
      });

      if (!response.ok) {
        throw await processErrorResponse(response);
      }

      return await response.json();
    } catch (err) {
      throw handleApiError(err);
    }
  },

  post: async <T>(endpoint: string, data: any, token?: string): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: createHeaders(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await processErrorResponse(response);
      }

      return await response.json();
    } catch (err) {
      throw handleApiError(err);
    }
  },

  put: async <T>(endpoint: string, data: any, token?: string): Promise<T> => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: createHeaders(token),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw await processErrorResponse(response);
      }

      return await response.json();
    } catch (err) {
      throw handleApiError(err);
    }
  },
};
