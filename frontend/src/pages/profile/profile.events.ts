import { authService } from '../../services/auth.service';
import type { UpdateProfileRequest, User } from '../../types/user.types';

export const handleUpdateProfile = async (updates: UpdateProfileRequest): Promise<User> => {
  return await authService.updateProfile(updates);
};

export const handleLogout = async (): Promise<void> => {
  await authService.logout();
};

