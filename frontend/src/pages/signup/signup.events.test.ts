import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleSignup } from './signup.events';
import { authService } from '../../services/auth.service';
import type { SignupRequest } from '../../types/user.types';

vi.mock('../../services/auth.service');

describe('signup.events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleSignup', () => {
    it('should call authService.signup with user data', async () => {
      const userData: SignupRequest = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const mockResponse = {
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      vi.mocked(authService.signup).mockResolvedValueOnce(mockResponse);

      await handleSignup(userData);

      expect(authService.signup).toHaveBeenCalledWith(userData);
      expect(authService.signup).toHaveBeenCalledTimes(1);
      expect(mockResponse).toMatchSnapshot();
    });

    it('should propagate errors from authService.signup', async () => {
      const userData: SignupRequest = {
        email: 'existing@example.com',
        password: 'password123',
        name: 'Test User',
      };

      const error = new Error('Email already exists');
      vi.mocked(authService.signup).mockRejectedValueOnce(error);

      await expect(handleSignup(userData)).rejects.toMatchSnapshot();
    });
  });
});

