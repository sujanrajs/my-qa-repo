import { api } from './api';
import { storage } from '../utils/storage';
import type { LoginRequest, SignupRequest, AuthResponse, User, UpdateProfileRequest } from '../types/user.types';

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    storage.setToken(response.token);
    storage.setUser(response.user);
    return response;
  },

  signup: async (userData: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', userData);
    storage.setToken(response.token);
    storage.setUser(response.user);
    return response;
  },

  logout: async (): Promise<void> => {
    try {
      const token = storage.getToken();
      if (token) {
        await api.post('/auth/logout', {}, token);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      storage.clear();
    }
  },

  getProfile: async (): Promise<User> => {
    const token = storage.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    return api.get<User>('/profile', token);
  },

  updateProfile: async (updates: UpdateProfileRequest): Promise<User> => {
    const token = storage.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const updatedUser = await api.put<User>('/profile', updates, token);
    storage.setUser(updatedUser);
    return updatedUser;
  },

  isAuthenticated: (): boolean => {
    return !!storage.getToken();
  },

  getCurrentUser: (): User | null => {
    return storage.getUser();
  },
};

