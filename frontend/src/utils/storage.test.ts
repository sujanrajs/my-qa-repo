import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from './storage';

describe('storage', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('setToken', () => {
    it('should store token in localStorage', () => {
      const token = 'test-token-123';
      storage.setToken(token);
      expect(localStorage.getItem('auth_token')).toBe(token);
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      const token = 'test-token-123';
      localStorage.setItem('auth_token', token);
      expect(storage.getToken()).toBe(token);
    });

    it('should return null if token does not exist', () => {
      expect(storage.getToken()).toBeNull();
    });
  });

  describe('removeToken', () => {
    it('should remove token from localStorage', () => {
      localStorage.setItem('auth_token', 'test-token');
      storage.removeToken();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should store user data in localStorage as JSON', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      storage.setUser(user);
      const stored = localStorage.getItem('user_data');
      expect(stored).toBe(JSON.stringify(user));
    });
  });

  describe('getUser', () => {
    it('should return parsed user data from localStorage', () => {
      const user = { id: '1', email: 'test@example.com', name: 'Test User' };
      localStorage.setItem('user_data', JSON.stringify(user));
      expect(storage.getUser()).toEqual(user);
    });

    it('should return null if user data does not exist', () => {
      expect(storage.getUser()).toBeNull();
    });
  });

  describe('removeUser', () => {
    it('should remove user data from localStorage', () => {
      localStorage.setItem('user_data', JSON.stringify({ id: '1' }));
      storage.removeUser();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });

  describe('clear', () => {
    it('should remove both token and user data from localStorage', () => {
      localStorage.setItem('auth_token', 'test-token');
      localStorage.setItem('user_data', JSON.stringify({ id: '1' }));
      storage.clear();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('user_data')).toBeNull();
    });
  });
});

