import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleUpdateProfile, handleLogout } from './profile.events';
import { authService } from '../../services/auth.service';
import type { UpdateProfileRequest, User } from '../../types/user.types';

vi.mock('../../services/auth.service');

describe('profile.events', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('handleUpdateProfile', () => {
    it('should call authService.updateProfile with updates', async () => {
      const updates: UpdateProfileRequest = {
        name: 'Updated Name',
      };

      const updatedUser: User = {
        id: '1',
        email: 'test@example.com',
        name: 'Updated Name',
      };

      vi.mocked(authService.updateProfile).mockResolvedValueOnce(updatedUser);

      const result = await handleUpdateProfile(updates);

      expect(authService.updateProfile).toHaveBeenCalledWith(updates);
      expect(authService.updateProfile).toHaveBeenCalledTimes(1);
      expect(result).toEqual(updatedUser);
      expect(result).toMatchSnapshot();
    });

    it('should propagate errors from authService.updateProfile', async () => {
      const updates: UpdateProfileRequest = {
        name: 'Updated Name',
      };

      const error = new Error('Update failed');
      vi.mocked(authService.updateProfile).mockRejectedValueOnce(error);

      await expect(handleUpdateProfile(updates)).rejects.toMatchSnapshot();
    });
  });

  describe('handleLogout', () => {
    it('should call authService.logout', async () => {
      vi.mocked(authService.logout).mockResolvedValueOnce(undefined);

      await handleLogout();

      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it('should propagate errors from authService.logout', async () => {
      const error = new Error('Logout failed');
      vi.mocked(authService.logout).mockRejectedValueOnce(error);

      await expect(handleLogout()).rejects.toMatchSnapshot();
    });
  });
});

