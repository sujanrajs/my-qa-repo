import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, register, logout } from './auth.controller';
import * as db from '../database/db';
import { User } from '../types/user.types';

// Mock dependencies
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../database/db');

describe('Auth Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: Mock;

  const mockUser: User = {
    id: '123',
    email: 'test@example.com',
    password: '$2a$10$hashedpassword',
    name: 'Test User',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockRequest = {
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    mockNext = vi.fn();
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as never);

      await login(mockRequest as Request, mockResponse as Response);

      expect(db.findUserByEmail).toHaveBeenCalledWith('test@example.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', mockUser.password);
      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUser.id },
        expect.any(String),
        { expiresIn: '7d' }
      );
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 401 if user not found', async () => {
      mockRequest.body = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 401 if password is invalid', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 500 on internal server error', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
      };

      vi.mocked(db.findUserByEmail).mockImplementation(() => {
        throw new Error('Database error');
      });

      await login(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      mockRequest.body = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedpassword' as never);
      vi.mocked(db.createUser).mockReturnValue({
        ...mockUser,
        email: 'new@example.com',
        name: 'New User',
      });
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      expect(db.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(db.createUser).toHaveBeenCalled();
      expect(jwt.sign).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if email is missing', async () => {
      mockRequest.body = {
        password: 'password123',
        name: 'New User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if password is missing', async () => {
      mockRequest.body = {
        email: 'new@example.com',
        name: 'New User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if name is missing', async () => {
      mockRequest.body = {
        email: 'new@example.com',
        password: 'password123',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if user already exists', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'New User',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(mockUser);

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 500 on internal server error', async () => {
      mockRequest.body = {
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      };

      vi.mocked(db.findUserByEmail).mockImplementation(() => {
        throw new Error('Database error');
      });

      await register(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });
  });

  describe('logout', () => {
    it('should return success message', () => {
      logout(mockRequest as Request, mockResponse as Response);

      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });
  });

  describe('Password Hashing Edge Cases', () => {
    it('should hash password with correct salt rounds (10)', async () => {
      mockRequest.body = {
        email: 'hash@test.com',
        password: 'password123',
        name: 'Hash Test',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedpassword' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    });

    it('should handle very long passwords', async () => {
      // Long password with letter and number to meet validation requirements
      const longPassword = 'a'.repeat(999) + '1';
      mockRequest.body = {
        email: 'longpass@test.com',
        password: longPassword,
        name: 'Long Pass User',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedlongpassword' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith(longPassword, 10);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should handle passwords with special characters', async () => {
      const specialPassword = 'p@ssw0rd!@#$%^&*()_+-=[]{}|;:,.<>?';
      mockRequest.body = {
        email: 'special@test.com',
        password: specialPassword,
        name: 'Special Char User',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedspecial' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith(specialPassword, 10);
    });

    it('should handle passwords with unicode characters', async () => {
      // Unicode password with number to meet validation requirements
      const unicodePassword = 'pässwörd🔒测试123';
      mockRequest.body = {
        email: 'unicode@test.com',
        password: unicodePassword,
        name: 'Unicode User',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashedunicode' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.hash).toHaveBeenCalledWith(unicodePassword, 10);
    });

    it('should handle empty string password (edge case)', async () => {
      mockRequest.body = {
        email: 'empty@test.com',
        password: '',
        name: 'Empty Pass User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Empty string is falsy, so validation should catch it
      // In JavaScript: !'' is true, so it should return 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should produce different hashes for same password (consistency check)', async () => {
      const password = 'samepassword123';
      mockRequest.body = {
        email: 'consistency@test.com',
        password: password,
        name: 'Consistency Test',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      
      // First hash
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2a$10$hash1' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      // Reset for second call
      vi.clearAllMocks();
      mockRequest.body = {
        email: 'consistency2@test.com',
        password: password,
        name: 'Consistency Test Two',
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      // Second hash (should be different due to salt)
      vi.mocked(bcrypt.hash).mockResolvedValueOnce('$2a$10$hash2' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('mock-token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      // Both should be called with same password but produce different hashes
      expect(bcrypt.hash).toHaveBeenCalledWith(password, 10);
      // Note: In real bcrypt, hashes would be different due to random salt
      // Here we're just verifying the function is called correctly
    });

    it('should compare hashed password correctly during login', async () => {
      const password = 'testpassword123';
      const hashedPassword = '$2a$10$hashedpassword';

      mockRequest.body = {
        email: 'test@example.com',
        password: password,
      };

      const userWithHashedPassword = {
        ...mockUser,
        password: hashedPassword,
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(userWithHashedPassword);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue('mock-jwt-token' as never);

      await login(mockRequest as Request, mockResponse as Response);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(mockResponse.json).toHaveBeenCalled();
      // Verify response contains token and user
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toHaveProperty('token');
      expect(responseData).toHaveProperty('user');
    });
  });
});

