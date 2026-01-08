import { describe, it, expect } from 'vitest';
import {
  isValidEmail,
  isNonEmptyString,
  isValidPassword,
  isValidName,
  getEmailError,
  getPasswordError,
  getNameError,
  validateLogin,
  validateSignup,
  validateProfile,
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
        'invalid@domain.c',
        'invalid@domain@com',
        'invalid@@domain.com',
      ];

      invalidEmails.forEach((email) => {
        expect(isValidEmail(email)).toBe(false);
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

  describe('getEmailError', () => {
    it('should return empty string for valid emails', () => {
      expect(getEmailError('test@example.com')).toBe('');
      expect(getEmailError('user.name@example.com')).toBe('');
    });

    it('should return appropriate error messages', () => {
      expect(getEmailError('')).toBe('Email is required');
      expect(getEmailError('   ')).toBe('Email is required');
      expect(getEmailError('invalid email@example.com')).toBe('Email cannot contain spaces');
      expect(getEmailError('invalid..dots@example.com')).toBe('Email cannot contain consecutive dots');
      expect(getEmailError('notanemail')).toBe('Invalid email format');
    });
  });

  describe('getPasswordError', () => {
    it('should return empty string for valid passwords', () => {
      expect(getPasswordError('Password123')).toBe('');
      expect(getPasswordError('abc123XYZ')).toBe('');
    });

    it('should return appropriate error messages', () => {
      expect(getPasswordError('')).toBe('Password is required');
      expect(getPasswordError('short')).toBe('Password must be at least 8 characters long');
      expect(getPasswordError('12345678')).toBe('Password must contain at least one letter');
      expect(getPasswordError('abcdefgh')).toBe('Password must contain at least one number');
    });
  });

  describe('getNameError', () => {
    it('should return empty string for valid names', () => {
      expect(getNameError('John Doe')).toBe('');
      expect(getNameError('Test')).toBe('');
      expect(getNameError("O'Brien")).toBe('');
      expect(getNameError('José García')).toBe('');
    });

    it('should return appropriate error messages', () => {
      expect(getNameError('')).toBe('Name is required');
      expect(getNameError('   ')).toBe('Name is required');
      expect(getNameError('A'.repeat(101))).toBe('Name cannot exceed 100 characters');
      expect(getNameError('John123')).toBe('Name cannot contain numbers');
      expect(getNameError('123Shrestha')).toBe('Name cannot contain numbers');
      expect(getNameError('Shrestha123')).toBe('Name cannot contain numbers');
      expect(getNameError('---')).toBe('Name must contain at least one letter');
      expect(getNameError("'''")).toBe('Name must contain at least one letter');
      expect(getNameError('John_Doe')).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
      expect(getNameError('John@Doe')).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
      expect(getNameError('John.Doe')).toBe('Name can only contain letters, spaces, hyphens, and apostrophes');
    });
  });

  describe('validateLogin', () => {
    it('should validate correct login credentials', () => {
      const result = validateLogin('test@example.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.emailError).toBe('');
      expect(result.passwordError).toBe('');
    });

    it('should reject invalid login credentials', () => {
      const result1 = validateLogin('', 'password123');
      expect(result1.isValid).toBe(false);
      expect(result1.emailError).toBeTruthy();

      const result2 = validateLogin('test@example.com', '');
      expect(result2.isValid).toBe(false);
      expect(result2.passwordError).toBe('Password is required');

      const result3 = validateLogin('invalid-email', 'password123');
      expect(result3.isValid).toBe(false);
      expect(result3.emailError).toBeTruthy();
    });
  });

  describe('validateSignup', () => {
    it('should validate correct signup data', () => {
      const result = validateSignup('John Doe', 'test@example.com', 'password123');
      expect(result.isValid).toBe(true);
      expect(result.nameError).toBe('');
      expect(result.emailError).toBe('');
      expect(result.passwordError).toBe('');
    });

    it('should reject invalid signup data', () => {
      const result1 = validateSignup('', 'test@example.com', 'password123');
      expect(result1.isValid).toBe(false);
      expect(result1.nameError).toBeTruthy();

      const result2 = validateSignup('John Doe', 'invalid-email', 'password123');
      expect(result2.isValid).toBe(false);
      expect(result2.emailError).toBeTruthy();

      const result3 = validateSignup('John Doe', 'test@example.com', 'short');
      expect(result3.isValid).toBe(false);
      expect(result3.passwordError).toBeTruthy();
    });
  });

  describe('validateProfile', () => {
    it('should validate correct profile data with both fields', () => {
      const result = validateProfile('John Doe', 'test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.nameError).toBe('');
      expect(result.emailError).toBe('');
    });

    it('should validate correct profile data with only name', () => {
      const result = validateProfile('John Doe', '');
      expect(result.isValid).toBe(true);
      expect(result.nameError).toBe('');
      expect(result.emailError).toBe('');
    });

    it('should validate correct profile data with only email', () => {
      const result = validateProfile('', 'test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.nameError).toBe('');
      expect(result.emailError).toBe('');
    });

    it('should reject when both fields are empty', () => {
      const result = validateProfile('', '');
      expect(result.isValid).toBe(false);
      expect(result.nameError).toContain('At least one field');
      expect(result.emailError).toContain('At least one field');
    });

    it('should reject invalid profile data', () => {
      const result1 = validateProfile('   ', 'test@example.com');
      expect(result1.isValid).toBe(false);
      expect(result1.nameError).toBeTruthy();
      expect(result1.emailError).toBe('');

      const result2 = validateProfile('John Doe', 'invalid-email');
      expect(result2.isValid).toBe(false);
      expect(result2.nameError).toBe('');
      expect(result2.emailError).toBeTruthy();
    });

    it('should reject when both provided fields are invalid', () => {
      const result = validateProfile('   ', 'invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.nameError).toBeTruthy();
      expect(result.emailError).toBeTruthy();
    });
  });
});

