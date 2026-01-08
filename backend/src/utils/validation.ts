/**
 * Input validation utilities
 * These functions should be used to validate user input before processing
 */

/**
 * Validates email format using a simple regex
 * For production, consider using a library like validator.js or email-validator
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedEmail = email.trim();
  
  // Basic email regex pattern
  // More comprehensive patterns exist, but this covers most cases
  // Requires at least one character before @, domain with at least one dot, and TLD with at least 2 chars
  // Also rejects spaces and consecutive dots
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  
  // Additional checks for common invalid patterns
  if (trimmedEmail.includes(' ')) {
    return false; // No spaces allowed
  }
  if (trimmedEmail.includes('..')) {
    return false; // No consecutive dots
  }
  
  return emailRegex.test(trimmedEmail) && trimmedEmail.length > 0;
}

/**
 * Validates that a string is not empty or whitespace-only
 */
export function isNonEmptyString(value: string): boolean {
  if (typeof value !== 'string') {
    return false;
  }
  return value.trim().length > 0;
}

/**
 * Validates password strength
 * Minimum requirements:
 * - At least 8 characters
 * - At least one letter
 * - At least one number
 * 
 * For production, consider more complex requirements
 */
export function isValidPassword(password: string): boolean {
  if (!password || typeof password !== 'string') {
    return false;
  }

  // Minimum length
  if (password.length < 8) {
    return false;
  }

  // At least one letter
  if (!/[a-zA-Z]/.test(password)) {
    return false;
  }

  // At least one number
  if (!/[0-9]/.test(password)) {
    return false;
  }

  return true;
}

/**
 * Validates name (allows letters, spaces, hyphens, apostrophes, and unicode)
 * Rejects numeric digits as they are not valid in legal names
 */
export function isValidName(name: string): boolean {
  if (!isNonEmptyString(name)) {
    return false;
  }

  const trimmedName = name.trim();
  
  // Max length check
  if (trimmedName.length > 100) {
    return false;
  }

  // Reject names containing numeric digits (0-9)
  // Legal names do not contain numeric digits
  if (/\d/.test(trimmedName)) {
    return false;
  }

  // Must contain at least one letter (to avoid pure punctuation/spaces)
  // This regex matches unicode letters (supports international names)
  if (!/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(trimmedName)) {
    return false;
  }

  // Allow letters, spaces, hyphens, apostrophes, and unicode characters
  // Reject other special characters and digits
  // This pattern allows: letters (including unicode), spaces, hyphens, apostrophes
  const namePattern = /^[\p{L}\s'-]+$/u;
  return namePattern.test(trimmedName);
}

/**
 * Sanitizes email by trimming whitespace and converting to lowercase
 */
export function sanitizeEmail(email: string): string {
  if (typeof email !== 'string') {
    return '';
  }
  return email.trim().toLowerCase();
}

/**
 * Gets user-friendly error message for name validation
 * Returns specific error messages to help users understand what's wrong
 */
export function getNameError(name: string): string {
  if (!name || !name.trim()) {
    return 'Name is required';
  }
  if (name.trim().length > 100) {
    return 'Name cannot exceed 100 characters';
  }
  if (/\d/.test(name.trim())) {
    return 'Name cannot contain numbers';
  }
  // Check if it contains at least one letter
  if (!/[a-zA-Z\u00C0-\u024F\u1E00-\u1EFF\u0400-\u04FF\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(name.trim())) {
    return 'Name must contain at least one letter';
  }
  // Check for invalid characters
  const namePattern = /^[\p{L}\s'-]+$/u;
  if (!namePattern.test(name.trim())) {
    return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  }
  return '';
}

/**
 * Sanitizes name by trimming whitespace
 */
export function sanitizeName(name: string): string {
  if (typeof name !== 'string') {
    return '';
  }
  return name.trim();
}

