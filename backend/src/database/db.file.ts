import fs from 'fs';
import path from 'path';
import { User } from '../types/user.types';
import { Database } from './db.interface';

export class FileDatabase implements Database {
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(__dirname, 'users.json');
    this.initialize();
  }

  private initialize(): void {
    if (!fs.existsSync(this.dbPath)) {
      fs.writeFileSync(this.dbPath, JSON.stringify([], null, 2));
    }
  }

  readUsers(): User[] {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  writeUsers(users: User[]): void {
    fs.writeFileSync(this.dbPath, JSON.stringify(users, null, 2));
  }

  findUserByEmail(email: string): User | undefined {
    const users = this.readUsers();
    return users.find(user => user.email === email);
  }

  findUserById(id: string): User | undefined {
    const users = this.readUsers();
    return users.find(user => user.id === id);
  }

  createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const users = this.readUsers();
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.writeUsers(users);
    return newUser;
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const users = this.readUsers();
    const userIndex = users.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }
    
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    this.writeUsers(users);
    return users[userIndex];
  }

  clear(): void {
    this.writeUsers([]);
  }
}

