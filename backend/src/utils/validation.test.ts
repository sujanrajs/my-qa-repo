import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isNonEmptyString,
  isValidPassword,
  isValidName,
  sanitizeEmail,
  sanitizeName,
} from './validation';

describe('Validation Utilities', () => {
  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      const validEmails = [
        'test@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user123@example.co.uk',
        'user_name@example-domain.com',
        'user@sub.example.com',
      ];

      validEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        '',
        '   ',
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
        'invalid@domain.c', // This might pass basic regex, but is invalid
        'invalid@domain@com',
        'invalid@@domain.com',
      ];

      invalidEmails.forEach((email) => {
        const result = isValidEmail(email);
        // All invalid emails should be rejected
        // Note: The validation function now checks for spaces and consecutive dots
        expect(result).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidEmail(null as any)).toBe(false);
      expect(isValidEmail(undefined as any)).toBe(false);
      expect(isValidEmail(12345 as any)).toBe(false);
      expect(isValidEmail('  test@example.com  ')).toBe(true); // Trims whitespace
    });
  });

  describe('isNonEmptyString', () => {
    it('should validate non-empty strings', () => {
      expect(isNonEmptyString('test')).toBe(true);
      expect(isNonEmptyString('  test  ')).toBe(true); // Trims
      expect(isNonEmptyString('a')).toBe(true);
    });

    it('should reject empty or whitespace-only strings', () => {
      expect(isNonEmptyString('')).toBe(false);
      expect(isNonEmptyString('   ')).toBe(false);
      expect(isNonEmptyString('\t\n')).toBe(false);
    });

    it('should reject non-string values', () => {
      expect(isNonEmptyString(null as any)).toBe(false);
      expect(isNonEmptyString(undefined as any)).toBe(false);
      expect(isNonEmptyString(123 as any)).toBe(false);
      expect(isNonEmptyString([] as any)).toBe(false);
      expect(isNonEmptyString({} as any)).toBe(false);
    });
  });

  describe('isValidPassword', () => {
    it('should validate strong passwords', () => {
      const strongPasswords = [
        'Password123',
        'Str0ng#P@ss',
        'MyP@ssw0rd!',
        'Complex123!@#',
        'abc123XYZ',
      ];

      strongPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(true);
      });
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        '',
        'short', // Too short
        '12345678', // No letters
        'abcdefgh', // No numbers
        'ABCDEFGH', // No lowercase
        'password', // No numbers
      ];

      weakPasswords.forEach((password) => {
        expect(isValidPassword(password)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidPassword(null as any)).toBe(false);
      expect(isValidPassword(undefined as any)).toBe(false);
      expect(isValidPassword(12345 as any)).toBe(false);
    });
  });

  describe('isValidName', () => {
    it('should validate valid names', () => {
      const validNames = [
        'John Doe',
        "O'Brien",
        'José García',
        '李小明',
        'John-Doe',
        'A', // Single character
      ];

      validNames.forEach((name) => {
        expect(isValidName(name)).toBe(true);
      });
    });

    it('should reject invalid names', () => {
      const invalidNames = [
        '',
        '   ',
        '\t\n',
        'A'.repeat(101), // Too long
        'John123', // Contains numbers
        '123Shrestha', // Starts with numbers
        'Shrestha123', // Ends with numbers
        'John7Doe', // Contains numbers
        '12345', // Only numbers
        'John_Doe', // Underscore not allowed
        'John@Doe', // Special characters not allowed
        'John.Doe', // Period not allowed
        '---', // Only hyphens (no letters)
        "'''", // Only apostrophes (no letters)
      ];

      invalidNames.forEach((name) => {
        expect(isValidName(name)).toBe(false);
      });
    });

    it('should handle edge cases', () => {
      expect(isValidName(null as any)).toBe(false);
      expect(isValidName(undefined as any)).toBe(false);
      expect(isValidName(12345 as any)).toBe(false);
    });
  });

  describe('sanitizeEmail', () => {
    it('should trim and lowercase emails', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(sanitizeEmail('User@Example.com')).toBe('user@example.com');
      expect(sanitizeEmail('  user@test.com  ')).toBe('user@test.com');
    });

    it('should handle edge cases', () => {
      expect(sanitizeEmail(null as any)).toBe('');
      expect(sanitizeEmail(undefined as any)).toBe('');
      expect(sanitizeEmail(12345 as any)).toBe('');
    });
  });

  describe('sanitizeName', () => {
    it('should trim names', () => {
      expect(sanitizeName('  John Doe  ')).toBe('John Doe');
      expect(sanitizeName('  Test  ')).toBe('Test');
    });

    it('should handle edge cases', () => {
      expect(sanitizeName(null as any)).toBe('');
      expect(sanitizeName(undefined as any)).toBe('');
      expect(sanitizeName(12345 as any)).toBe('');
    });
  });
});

