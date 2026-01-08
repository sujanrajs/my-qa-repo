/**
 * Input validation utilities
 * These functions match the backend validation rules exactly
 * Used to validate user input before API submission for better UX
 */

/**
 * Validates email format using a simple regex
 * Matches backend validation exactly
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
 * Matches backend validation exactly
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
 * Matches backend validation exactly
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
 * Gets user-friendly error message for email validation
 */
export function getEmailError(email: string): string {
  if (!email || !email.trim()) {
    return 'Email is required';
  }
  if (!isValidEmail(email)) {
    if (email.includes(' ')) {
      return 'Email cannot contain spaces';
    }
    if (email.includes('..')) {
      return 'Email cannot contain consecutive dots';
    }
    return 'Invalid email format';
  }
  return '';
}

/**
 * Gets user-friendly error message for password validation
 */
export function getPasswordError(password: string): string {
  if (!password) {
    return 'Password is required';
  }
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  if (!/[a-zA-Z]/.test(password)) {
    return 'Password must contain at least one letter';
  }
  if (!/[0-9]/.test(password)) {
    return 'Password must contain at least one number';
  }
  return '';
}

/**
 * Gets user-friendly error message for name validation
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
 * Validates login form data
 */
export interface LoginValidationResult {
  isValid: boolean;
  emailError: string;
  passwordError: string;
}

export function validateLogin(email: string, password: string): LoginValidationResult {
  const emailError = getEmailError(email);
  const passwordError = password ? '' : 'Password is required';
  
  return {
    isValid: !emailError && !passwordError,
    emailError,
    passwordError,
  };
}

/**
 * Validates signup form data
 */
export interface SignupValidationResult {
  isValid: boolean;
  nameError: string;
  emailError: string;
  passwordError: string;
}

export function validateSignup(name: string, email: string, password: string): SignupValidationResult {
  const nameError = getNameError(name);
  const emailError = getEmailError(email);
  const passwordError = getPasswordError(password);
  
  return {
    isValid: !nameError && !emailError && !passwordError,
    nameError,
    emailError,
    passwordError,
  };
}

/**
 * Validates profile update form data
 * At least one field (name or email) must be provided and valid
 */
export interface ProfileValidationResult {
  isValid: boolean;
  nameError: string;
  emailError: string;
}

export function validateProfile(name: string, email: string): ProfileValidationResult {
  // Check if fields have any content (including whitespace)
  const hasName = Boolean(name);
  const hasEmail = Boolean(email);
  
  // At least one field must be provided (non-empty after trim)
  const hasValidName = Boolean(name && name.trim());
  const hasValidEmail = Boolean(email && email.trim());
  
  if (!hasValidName && !hasValidEmail) {
    return {
      isValid: false,
      nameError: hasName ? '' : 'At least one field (name or email) is required',
      emailError: hasEmail ? '' : 'At least one field (name or email) is required',
    };
  }
  
  // Validate name if it has content (even if just whitespace, we validate it)
  const nameError = hasName ? getNameError(name) : '';
  // Validate email if it has content
  const emailError = hasEmail ? getEmailError(email) : '';
  
  // Valid if all provided fields are valid
  const isValid = !nameError && !emailError;
  
  return {
    isValid,
    nameError,
    emailError,
  };
}

