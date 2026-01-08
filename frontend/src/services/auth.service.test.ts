import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from './auth.service';
import { api } from './api';
import { storage } from '../utils/storage';
import type { User, LoginRequest, SignupRequest, UpdateProfileRequest } from '../types/user.types';

// Mock dependencies
vi.mock('./api');
vi.mock('../utils/storage');

describe('authService', () => {
  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
  };

  const mockAuthResponse = {
    token: 'test-token-123',
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login user and store token and user data', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockAuthResponse);

      const result = await authService.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(storage.setToken).toHaveBeenCalledWith('test-token-123');
      expect(storage.setUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('signup', () => {
    it('should signup user and store token and user data', async () => {
      const userData: SignupRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      vi.mocked(api.post).mockResolvedValueOnce(mockAuthResponse);

      const result = await authService.signup(userData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(storage.setToken).toHaveBeenCalledWith('test-token-123');
      expect(storage.setUser).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('logout', () => {
    it('should call logout API and clear storage when token exists', async () => {
      vi.mocked(storage.getToken).mockReturnValueOnce('test-token');
      vi.mocked(api.post).mockResolvedValueOnce(undefined);

      await authService.logout();

      expect(api.post).toHaveBeenCalledWith('/auth/logout', {}, 'test-token');
      expect(storage.clear).toHaveBeenCalled();
    });

    it('should clear storage even if token does not exist', async () => {
      vi.mocked(storage.getToken).mockReturnValueOnce(null);

      await authService.logout();

      expect(api.post).not.toHaveBeenCalled();
      expect(storage.clear).toHaveBeenCalled();
    });

    it('should clear storage even if API call fails', async () => {
      vi.mocked(storage.getToken).mockReturnValueOnce('test-token');
      vi.mocked(api.post).mockRejectedValueOnce(new Error('Network error'));
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await authService.logout();

      expect(storage.clear).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getProfile', () => {
    it('should fetch profile when token exists', async () => {
      vi.mocked(storage.getToken).mockReturnValueOnce('test-token');
      vi.mocked(api.get).mockResolvedValueOnce(mockUser);

      const result = await authService.getProfile();

      expect(storage.getToken).toHaveBeenCalled();
      expect(api.get).toHaveBeenCalledWith('/profile', 'test-token');
      expect(result).toEqual(mockUser);
    });

    it('should throw error when token does not exist', async () => {
      vi.mocked(storage.getToken).mockReturnValueOnce(null);

      await expect(authService.getProfile()).rejects.toThrow('No token found');
      expect(api.get).not.toHaveBeenCalled();
    });
  });

  describe('updateProfile', () => {
    it('should update profile when token exists', async () => {
      const updates: UpdateProfileRequest = {
        name: 'Updated Name',
      };
      const updatedUser: User = {
        ...mockUser,
        name: 'Updated Name',
      };

      vi.mocked(storage.getToken).mockReturnValueOnce('test-token');
      vi.mocked(api.put).mockResolvedValueOnce(updatedUser);

      const result = await authService.updateProfile(updates);

      expect(storage.getToken).toHaveBeenCalled();
      expect(api.put).toHaveBeenCalledWith('/profile', updates, 'test-token');
      expect(storage.setUser).toHaveBeenCalledWith(updatedUser);
      expect(result).toEqual(updatedUser);
    });

    it('should throw error when token does not exist', async () => {
      vi.mocked(storage.getToken).mockReturnValueOnce(null);

      await expect(authService.updateProfile({})).rejects.toThrow('No token found');
      expect(api.put).not.toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      vi.mocked(storage.getToken).mockReturnValueOnce('test-token');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      vi.mocked(storage.getToken).mockReturnValueOnce(null);
      expect(authService.isAuthenticated()).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from storage', () => {
      vi.mocked(storage.getUser).mockReturnValueOnce(mockUser);
      expect(authService.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when user does not exist', () => {
      vi.mocked(storage.getUser).mockReturnValueOnce(null);
      expect(authService.getCurrentUser()).toBeNull();
    });
  });
});

