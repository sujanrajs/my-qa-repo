import { authService } from '../../services/auth.service';
import type { SignupRequest } from '../../types/user.types';

export const handleSignup = async (userData: SignupRequest): Promise<void> => {
  await authService.signup(userData);
};

