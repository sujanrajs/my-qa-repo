import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleLogin } from './login.events';
import { authService } from '../../services/auth.service';
import type { LoginRequest } from '../../types/user.types';

vi.mock('../../services/auth.service');

describe('login.events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleLogin', () => {
    it('should call authService.login with credentials', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockResponse = {
        token: 'test-token',
        user: {
          id: '1',
          email: 'test@example.com',
          name: 'Test User',
        },
      };

      vi.mocked(authService.login).mockResolvedValueOnce(mockResponse);

      await handleLogin(credentials);

      expect(authService.login).toHaveBeenCalledWith(credentials);
      expect(authService.login).toHaveBeenCalledTimes(1);
      expect(mockResponse).toMatchSnapshot();
    });

    it('should propagate errors from authService.login', async () => {
      const credentials: LoginRequest = {
        email: 'test@example.com',
        password: 'wrong-password',
      };

      const error = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValueOnce(error);

      await expect(handleLogin(credentials)).rejects.toMatchSnapshot();
    });
  });
});

