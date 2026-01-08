import { User } from '../types/user.types';

export interface Database {
  readUsers(): User[];
  writeUsers(users: User[]): void;
  findUserByEmail(email: string): User | undefined;
  findUserById(id: string): User | undefined;
  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User;
  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null;
  clear(): void;
}

