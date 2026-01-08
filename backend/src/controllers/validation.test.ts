import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, register } from './auth.controller';
import { updateProfile } from './profile.controller';
import * as db from '../database/db';
import { User } from '../types/user.types';
import { AuthRequest } from '../middleware/auth.middleware';

// Mock dependencies
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../database/db');

describe('Input Validation Tests', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockAuthRequest: Partial<AuthRequest>;

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

    mockAuthRequest = {
      userId: '123',
      body: {},
    };
  });

  describe('Email Format Validation', () => {
    const invalidEmails = [
      'notanemail',
      'missing@domain',
      '@missinglocal.com',
      'spaces in@email.com',
      'invalid..dots@email.com',
      'invalid@',
      'invalid@.com',
      'invalid@com',
      'invalid@domain.',
      'invalid@domain..com',
      'invalid@domain.c',
      'invalid@domain@com',
      'invalid@@domain.com',
    ];

    invalidEmails.forEach((invalidEmail) => {
      it(`should reject invalid email format: "${invalidEmail}"`, async () => {
        mockRequest.body = {
          email: invalidEmail,
          password: 'password123',
          name: 'Test User',
        };

        await register(mockRequest as Request, mockResponse as Response);

        // Invalid emails should now be rejected with 400 error
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        const responseData = (mockResponse.json as any).mock.calls[0][0];
        expect(responseData.error).toContain('Invalid email format');
        // Database should not be called for invalid emails
        expect(db.findUserByEmail).not.toHaveBeenCalled();
      });
    });

    it('should reject empty email string (validation catches before format check)', async () => {
      mockRequest.body = {
        email: '',
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Empty string is falsy, so validation rejects it before format check
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(db.findUserByEmail).not.toHaveBeenCalled();
    });

    it('should reject whitespace-only email', async () => {
      mockRequest.body = {
        email: '   ',
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Whitespace-only email should now be rejected
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Invalid email format');
      expect(db.findUserByEmail).not.toHaveBeenCalled();
    });

    const validEmails = [
      'test@example.com',
      'user.name@example.com',
      'user+tag@example.com',
      'user123@example.co.uk',
      'user_name@example-domain.com',
    ];

    validEmails.forEach((validEmail) => {
      it(`should accept valid email format: "${validEmail}"`, async () => {
        mockRequest.body = {
          email: validEmail,
          password: 'password123',
          name: 'Test User',
        };

        vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
        vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
        vi.mocked(db.createUser).mockReturnValue(mockUser);
        vi.mocked(jwt.sign).mockReturnValue('token' as never);

        await register(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe('Password Strength/Requirements Validation', () => {
    it('should reject empty password', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: '',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Empty password is caught by required field check
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('required');
    });

    const weakPasswords = [
      '12345', // Too short
      'password', // Common word (no number)
      '12345678', // Only numbers (no letter)
      'abcdefgh', // Only letters (no number)
      'ABCDEFGH', // Only uppercase (no number)
    ];

    weakPasswords.forEach((weakPassword) => {
      it(`should reject weak password: "${weakPassword.substring(0, 10)}..."`, async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: weakPassword,
          name: 'Test User',
        };

        await register(mockRequest as Request, mockResponse as Response);

        // Weak passwords should now be rejected
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        const responseData = (mockResponse.json as any).mock.calls[0][0];
        expect(responseData.error).toContain('Password must be');
        // Password hashing should not be called for weak passwords
        expect(vi.mocked(bcrypt.hash)).not.toHaveBeenCalled();
      });
    });

    const strongPasswords = [
      'Password123!',
      'Str0ng#P@ss',
      'MyP@ssw0rd!',
      'Complex123!@#',
    ];

    strongPasswords.forEach((strongPassword) => {
      it(`should accept strong password: "${strongPassword}"`, async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: strongPassword,
          name: 'Test User',
        };

        vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
        vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
        vi.mocked(db.createUser).mockReturnValue(mockUser);
        vi.mocked(jwt.sign).mockReturnValue('token' as never);

        await register(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe('Name Validation', () => {
    const invalidNames = [
      '', // Empty string
      '   ', // Only whitespace
      '\t\n', // Only whitespace characters
      'A'.repeat(1000), // Very long name
    ];

    invalidNames.forEach((invalidName) => {
      it(`should handle invalid name: "${invalidName.substring(0, 20)}..." (current implementation only checks truthy)`, async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'password123',
          name: invalidName,
        };

        // Empty string is falsy, so will be rejected
        // Whitespace-only strings should now be rejected
        // Very long names (>100 chars) should be rejected
        if (!invalidName) {
          // Empty string is falsy
          await register(mockRequest as Request, mockResponse as Response);
          expect(mockResponse.status).toHaveBeenCalledWith(400);
        } else if (invalidName.trim().length === 0) {
          // Whitespace-only should be rejected
          await register(mockRequest as Request, mockResponse as Response);
          expect(mockResponse.status).toHaveBeenCalledWith(400);
          const responseData = (mockResponse.json as any).mock.calls[0][0];
          expect(responseData.error).toContain('Name');
        } else if (invalidName.length > 100) {
          // Very long names should be rejected
          await register(mockRequest as Request, mockResponse as Response);
          expect(mockResponse.status).toHaveBeenCalledWith(400);
          const responseData = (mockResponse.json as any).mock.calls[0][0];
          expect(responseData.error).toContain('Name');
        }
      });
    });

    const validNames = [
      'John Doe',
      "O'Brien",
      'José García',
      '李小明',
      'John-Doe',
      'A', // Single character
    ];

    validNames.forEach((validName) => {
      it(`should accept valid name: "${validName}"`, async () => {
        mockRequest.body = {
          email: 'test@example.com',
          password: 'password123',
          name: validName,
        };

        vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
        vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
        vi.mocked(db.createUser).mockReturnValue(mockUser);
        vi.mocked(jwt.sign).mockReturnValue('token' as never);

        await register(mockRequest as Request, mockResponse as Response);

        expect(mockResponse.status).toHaveBeenCalledWith(201);
      });
    });
  });

  describe('Request Body Validation Edge Cases', () => {
    it('should handle null values in request body', async () => {
      mockRequest.body = {
        email: null,
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // null is falsy, so should return 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should handle undefined values in request body', async () => {
      mockRequest.body = {
        email: undefined,
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // undefined is falsy, so should return 400
      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject numeric values where strings expected', async () => {
      mockRequest.body = {
        email: 12345, // Number instead of string
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Number converted to string will fail email validation
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Invalid email format');
      expect(db.findUserByEmail).not.toHaveBeenCalled();
    });

    it('should reject boolean values where strings expected', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: true, // Boolean instead of string
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Boolean converted to string "true" will fail password validation (no number)
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Password must be');
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should reject array values where strings expected', async () => {
      mockRequest.body = {
        email: ['test@example.com'], // Array instead of string
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Array converted to string will fail email validation
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Invalid email format');
      expect(db.findUserByEmail).not.toHaveBeenCalled();
    });

    it('should reject object values where strings expected', async () => {
      mockRequest.body = {
        email: { value: 'test@example.com' }, // Object instead of string
        password: 'password123',
        name: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      // Object converted to string "[object Object]" will fail email validation
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Invalid email format');
      expect(db.findUserByEmail).not.toHaveBeenCalled();
    });

    it('should handle extra fields in request body', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
        extraField: 'should be ignored',
        anotherField: 123,
      };

      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(bcrypt.hash).mockResolvedValue('$2a$10$hashed' as never);
      vi.mocked(db.createUser).mockReturnValue(mockUser);
      vi.mocked(jwt.sign).mockReturnValue('token' as never);

      await register(mockRequest as Request, mockResponse as Response);

      // Extra fields should be ignored (not cause errors)
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });

    it('should reject profile update with invalid email format', async () => {
      mockAuthRequest.body = {
        email: 'notanemail',
      };

      await updateProfile(mockAuthRequest as AuthRequest, mockResponse as Response);

      // Invalid email format should now be rejected
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Invalid email format');
      expect(db.updateUser).not.toHaveBeenCalled();
    });

    it('should handle profile update with empty name', async () => {
      mockAuthRequest.body = {
        name: '',
      };

      // Empty string is falsy, so validation will fail
      await updateProfile(mockAuthRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should reject profile update with whitespace-only name', async () => {
      mockAuthRequest.body = {
        name: '   ',
      };

      await updateProfile(mockAuthRequest as AuthRequest, mockResponse as Response);

      // Whitespace-only name should now be rejected
      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData.error).toContain('Name');
      expect(db.updateUser).not.toHaveBeenCalled();
    });
  });
});

