export interface User {
  id: string;
  email: string;
  password: string; // hashed
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
}

