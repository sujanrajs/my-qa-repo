import { User } from '../types/user.types';
import { Database } from './db.interface';

export class InMemoryDatabase implements Database {
  private users: User[] = [];

  readUsers(): User[] {
    return [...this.users];
  }

  writeUsers(users: User[]): void {
    this.users = [...users];
  }

  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  findUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...userData,
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const userIndex = this.users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }
    
    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    return this.users[userIndex];
  }

  clear(): void {
    this.users = [];
  }
}

