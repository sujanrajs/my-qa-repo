import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api } from './api';

// Mock fetch globally
global.fetch = vi.fn();

describe('api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('get', () => {
    it('should make GET request without token', async () => {
      const mockData = { id: '1', name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.get('/test');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should make GET request with token', async () => {
      const mockData = { id: '1', name: 'Test' };
      const token = 'test-token';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.get('/test', token);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Not found' }),
      });

      await expect(api.get('/test')).rejects.toThrow('Not found');
    });

    it('should throw generic error when response json parsing fails', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => {
          throw new Error('Parse error');
        },
      });

      await expect(api.get('/test')).rejects.toThrow('Request failed');
    });

    it('should handle network errors (Failed to fetch)', async () => {
      // Test: Network error (offline, connection failure)
      // Expected: Throws "Failed to fetch" error
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(api.get('/test')).rejects.toThrow('Failed to fetch');
    });

    it('should handle invalid JSON response (empty body)', async () => {
      // Test: Server returns empty body with JSON content type
      // Expected: Throws "Invalid response format" error
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected end of JSON input');
        },
      });

      await expect(api.get('/test')).rejects.toThrow('Invalid response format');
    });

    it('should handle 401 error with auth context', async () => {
      // Test: 401 Unauthorized error
      // Expected: Error message includes auth context if not already present
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Access denied' }),
      });

      await expect(api.get('/test')).rejects.toThrow('Unauthorized: Access denied');
    });

    it('should handle 401 error with existing auth keywords', async () => {
      // Test: 401 error already contains auth keywords
      // Expected: Error message as-is, no additional context
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Token expired' }),
      });

      await expect(api.get('/test')).rejects.toThrow('Token expired');
    });

    it('should handle 403 Forbidden error', async () => {
      // Test: 403 Forbidden error
      // Expected: Error message includes auth context if not already present
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({ error: 'Access denied' }),
      });

      await expect(api.get('/test')).rejects.toThrow('Unauthorized: Access denied');
    });
  });

  describe('post', () => {
    it('should make POST request without token', async () => {
      const mockData = { id: '1', name: 'Test' };
      const requestData = { name: 'Test' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.post('/test', requestData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should make POST request with token', async () => {
      const mockData = { id: '1', name: 'Test' };
      const requestData = { name: 'Test' };
      const token = 'test-token';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.post('/test', requestData, token);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Validation failed' }),
      });

      await expect(api.post('/test', {})).rejects.toThrow('Validation failed');
    });

    it('should handle network errors (Failed to fetch)', async () => {
      // Test: Network error during POST
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(api.post('/test', {})).rejects.toThrow('Failed to fetch');
    });

    it('should handle invalid JSON response', async () => {
      // Test: Invalid JSON in response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(api.post('/test', {})).rejects.toThrow('Invalid response format');
    });
  });

  describe('put', () => {
    it('should make PUT request without token', async () => {
      const mockData = { id: '1', name: 'Updated' };
      const requestData = { name: 'Updated' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.put('/test', requestData);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should make PUT request with token', async () => {
      const mockData = { id: '1', name: 'Updated' };
      const requestData = { name: 'Updated' };
      const token = 'test-token';
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      });

      const result = await api.put('/test', requestData, token);

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/test',
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(requestData),
        }
      );
      expect(result).toEqual(mockData);
    });

    it('should throw error when response is not ok', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Update failed' }),
      });

      await expect(api.put('/test', {})).rejects.toThrow('Update failed');
    });

    it('should handle network errors (Failed to fetch)', async () => {
      // Test: Network error during PUT
      (global.fetch as any).mockRejectedValueOnce(
        new TypeError('Failed to fetch')
      );

      await expect(api.put('/test', {})).rejects.toThrow('Failed to fetch');
    });

    it('should handle invalid JSON response', async () => {
      // Test: Invalid JSON in response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      });

      await expect(api.put('/test', {})).rejects.toThrow('Invalid response format');
    });
  });
});
