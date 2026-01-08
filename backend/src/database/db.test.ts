import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  readUsers,
  writeUsers,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
} from './db';
import { User } from '../types/user.types';

// Mock fs module
vi.mock('fs');
vi.mock('path');

describe('Database Functions', () => {
  const mockUsers: User[] = [
    {
      id: '1',
      email: 'test@example.com',
      password: 'hashedpassword1',
      name: 'Test User',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      id: '2',
      email: 'another@example.com',
      password: 'hashedpassword2',
      name: 'Another User',
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('readUsers', () => {
    it('should read users from JSON file', () => {
      const mockData = JSON.stringify(mockUsers);
      vi.mocked(fs.readFileSync).mockReturnValue(mockData);

      const users = readUsers();

      expect(users).toMatchSnapshot();
      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should return empty array if file read fails', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('File not found');
      });

      const users = readUsers();

      expect(users).toEqual([]);
    });

    it('should return empty array if JSON is invalid', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('invalid json');

      const users = readUsers();

      expect(users).toEqual([]);
    });

    it('should handle corrupted JSON with partial data', () => {
      // JSON that starts correctly but is truncated
      vi.mocked(fs.readFileSync).mockReturnValue('[{ "id": "1", "email": "test@example.com"');

      const users = readUsers();

      expect(users).toEqual([]);
    });

    it('should handle empty file', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('');

      const users = readUsers();

      expect(users).toEqual([]);
    });

    it('should handle file with only whitespace', () => {
      vi.mocked(fs.readFileSync).mockReturnValue('   \n\t  ');

      const users = readUsers();

      expect(users).toEqual([]);
    });
  });

  describe('Database File Initialization', () => {
    it('should handle file that does not exist gracefully', () => {
      // When file doesn't exist, readFileSync throws, which is caught and returns []
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      const users = readUsers();

      expect(users).toEqual([]);
    });
  });

  describe('File Permission Errors', () => {
    it('should handle file read permission errors', () => {
      vi.mocked(fs.readFileSync).mockImplementation(() => {
        const error = new Error('EACCES: permission denied') as any;
        error.code = 'EACCES';
        throw error;
      });

      const users = readUsers();

      expect(users).toEqual([]);
    });

    it('should handle file write permission errors', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {
        const error = new Error('EACCES: permission denied') as any;
        error.code = 'EACCES';
        throw error;
      });

      // This will throw, but we test that it throws the permission error
      expect(() => {
        writeUsers(mockUsers);
      }).toThrow('EACCES');
    });
  });

  describe('writeUsers', () => {
    it('should write users to JSON file', () => {
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      writeUsers(mockUsers);

      // Since DB_PATH is calculated at module load time, we can't easily mock path.join
      // Instead, just verify that writeFileSync was called with the correct data
      expect(fs.writeFileSync).toHaveBeenCalled();
      const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(callArgs[1]).toBe(JSON.stringify(mockUsers, null, 2));
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));

      const user = findUserByEmail('test@example.com');

      expect(user).toMatchSnapshot();
    });

    it('should return undefined if user not found', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));

      const user = findUserByEmail('notfound@example.com');

      expect(user).toBeUndefined();
    });
  });

  describe('findUserById', () => {
    it('should find user by id', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));

      const user = findUserById('1');

      expect(user).toMatchSnapshot();
    });

    it('should return undefined if user not found', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));

      const user = findUserById('999');

      expect(user).toBeUndefined();
    });
  });

  describe('createUser', () => {
    it('should create a new user with generated id and timestamps', () => {
      // Use fake timers to control Date
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify([]));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const newUserData = {
        email: 'new@example.com',
        password: 'hashedpassword',
        name: 'New User',
      };

      const createdUser = createUser(newUserData);

      expect(createdUser).toMatchSnapshot();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should add user to existing users array', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const newUserData = {
        email: 'new@example.com',
        password: 'hashedpassword',
        name: 'New User',
      };

      createUser(newUserData);

      // Verify writeFileSync was called and contains the new user email
      expect(fs.writeFileSync).toHaveBeenCalled();
      const callArgs = vi.mocked(fs.writeFileSync).mock.calls[0];
      expect(callArgs[1]).toContain('new@example.com');
    });
  });

  describe('updateUser', () => {
    it('should update existing user', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-02T00:00:00.000Z'));
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const updates = { name: 'Updated Name' };
      const updatedUser = updateUser('1', updates);

      expect(updatedUser).toMatchSnapshot();
      expect(fs.writeFileSync).toHaveBeenCalled();
    });

    it('should update email if provided', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-02T00:00:00.000Z'));
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const updates = { email: 'newemail@example.com' };
      const updatedUser = updateUser('1', updates);

      expect(updatedUser?.email).toBe('newemail@example.com');
    });

    it('should return null if user not found', () => {
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));

      const updatedUser = updateUser('999', { name: 'New Name' });

      expect(updatedUser).toBeNull();
    });

    it('should preserve existing fields when updating', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2024-01-02T00:00:00.000Z'));
      
      vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockUsers));
      vi.mocked(fs.writeFileSync).mockImplementation(() => {});

      const updates = { name: 'Updated Name' };
      const updatedUser = updateUser('1', updates);

      expect(updatedUser?.email).toBe('test@example.com');
      expect(updatedUser?.password).toBe('hashedpassword1');
      expect(updatedUser?.id).toBe('1');
    });
  });
});

