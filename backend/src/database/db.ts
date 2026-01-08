import { User } from '../types/user.types';
import { getDatabase } from './db.manager';

// Re-export database functions using the database manager
// This maintains backward compatibility with existing code
export const readUsers = (): User[] => {
  return getDatabase().readUsers();
};

export const writeUsers = (users: User[]): void => {
  getDatabase().writeUsers(users);
};

export const findUserByEmail = (email: string): User | undefined => {
  return getDatabase().findUserByEmail(email);
};

export const findUserById = (id: string): User | undefined => {
  return getDatabase().findUserById(id);
};

export const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User => {
  return getDatabase().createUser(userData);
};

export const updateUser = (id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null => {
  return getDatabase().updateUser(id, updates);
};

