import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Response } from 'express';
import { getProfile, updateProfile } from './profile.controller';
import * as db from '../database/db';
import { AuthRequest } from '../middleware/auth.middleware';
import { User } from '../types/user.types';

// Mock database
vi.mock('../database/db');

describe('Profile Controller', () => {
  let mockRequest: Partial<AuthRequest>;
  let mockResponse: Partial<Response>;

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
      userId: '123',
      body: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getProfile', () => {
    it('should return user profile', () => {
      vi.mocked(db.findUserById).mockReturnValue(mockUser);

      getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(db.findUserById).toHaveBeenCalledWith('123');
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 401 if userId is missing', () => {
      mockRequest.userId = undefined;

      getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 404 if user not found', () => {
      vi.mocked(db.findUserById).mockReturnValue(undefined);

      getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 500 on internal server error', () => {
      vi.mocked(db.findUserById).mockImplementation(() => {
        throw new Error('Database error');
      });

      getProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile with name', () => {
      mockRequest.body = { name: 'Updated Name' };
      const updatedUser = { ...mockUser, name: 'Updated Name' };

      vi.mocked(db.findUserById).mockReturnValue(mockUser);
      vi.mocked(db.updateUser).mockReturnValue(updatedUser);

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(db.updateUser).toHaveBeenCalledWith('123', { name: 'Updated Name' });
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should update user profile with email', () => {
      mockRequest.body = { email: 'newemail@example.com' };
      const updatedUser = { ...mockUser, email: 'newemail@example.com' };

      vi.mocked(db.findUserById).mockReturnValue(mockUser);
      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(db.updateUser).mockReturnValue(updatedUser);

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(db.findUserByEmail).toHaveBeenCalledWith('newemail@example.com');
      expect(db.updateUser).toHaveBeenCalledWith('123', { email: 'newemail@example.com' });
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should update user profile with both name and email', () => {
      mockRequest.body = {
        name: 'Updated Name',
        email: 'newemail@example.com',
      };
      const updatedUser = {
        ...mockUser,
        name: 'Updated Name',
        email: 'newemail@example.com',
      };

      vi.mocked(db.findUserById).mockReturnValue(mockUser);
      vi.mocked(db.findUserByEmail).mockReturnValue(undefined);
      vi.mocked(db.updateUser).mockReturnValue(updatedUser);

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(db.updateUser).toHaveBeenCalledWith('123', {
        name: 'Updated Name',
        email: 'newemail@example.com',
      });
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 401 if userId is missing', () => {
      mockRequest.userId = undefined;
      mockRequest.body = { name: 'Updated Name' };

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if no fields provided', () => {
      mockRequest.body = {};

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 400 if email is already taken by another user', () => {
      mockRequest.body = { email: 'taken@example.com' };
      const otherUser = { ...mockUser, id: '456', email: 'taken@example.com' };

      vi.mocked(db.findUserById).mockReturnValue(mockUser);
      vi.mocked(db.findUserByEmail).mockReturnValue(otherUser);

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should allow updating to same email', () => {
      mockRequest.body = { email: 'test@example.com' };
      const updatedUser = { ...mockUser };

      vi.mocked(db.findUserById).mockReturnValue(mockUser);
      vi.mocked(db.updateUser).mockReturnValue(updatedUser);

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      // Should not check for email if it's the same
      expect(db.updateUser).toHaveBeenCalled();
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 404 if user not found during update', () => {
      mockRequest.body = { name: 'Updated Name' };

      vi.mocked(db.findUserById).mockReturnValue(mockUser);
      vi.mocked(db.updateUser).mockReturnValue(null);

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });

    it('should return 500 on internal server error', () => {
      mockRequest.body = { name: 'Updated Name' };

      // Since there's no email in the body, findUserById won't be called on line 46
      // Instead, updateUser will be called on line 56
      // Make updateUser throw to trigger 500 error
      vi.mocked(db.updateUser).mockImplementation(() => {
        throw new Error('Database error');
      });

      updateProfile(mockRequest as AuthRequest, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const responseData = (mockResponse.json as any).mock.calls[0][0];
      expect(responseData).toMatchSnapshot();
    });
  });
});

