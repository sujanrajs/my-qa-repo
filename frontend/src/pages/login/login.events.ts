import { authService } from '../../services/auth.service';
import type { LoginRequest } from '../../types/user.types';

export const handleLogin = async (credentials: LoginRequest): Promise<void> => {
  await authService.login(credentials);
};

