import { User } from '../types/user.types';

let testCounter = 0;

export function generateUniqueEmail(prefix = 'test'): string {
  testCounter++;
  return `${prefix}-${Date.now()}-${testCounter}-${Math.random().toString(36).substr(2, 9)}@test.com`;
}

export function generateUniqueId(prefix = 'user'): string {
  testCounter++;
  return `${prefix}-${Date.now()}-${testCounter}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createTestUserData(overrides: Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>> = {}): Omit<User, 'id' | 'createdAt' | 'updatedAt'> {
  // Convert number to word to avoid numbers in names
  const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const counterWord = testCounter < numberWords.length ? numberWords[testCounter] : `Test${testCounter}`;
  return {
    email: generateUniqueEmail(),
    password: 'password123',
    name: `Test User ${counterWord}`,
    ...overrides,
  };
}

export function createTestUser(overrides: Partial<User> = {}): User {
  // Convert number to word to avoid numbers in names
  const numberWords = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
  const counterWord = testCounter < numberWords.length ? numberWords[testCounter] : `Test${testCounter}`;
  return {
    id: generateUniqueId(),
    email: generateUniqueEmail(),
    password: 'hashedpassword123',
    name: `Test User ${counterWord}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function resetTestCounter(): void {
  testCounter = 0;
}

