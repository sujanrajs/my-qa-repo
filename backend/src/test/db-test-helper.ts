import { Database } from '../database/db.interface';
import { createInMemoryDatabase, setDatabase, resetDatabase } from '../database/db.manager';

let testDatabase: Database | null = null;

export function setupTestDatabase(): Database {
  testDatabase = createInMemoryDatabase();
  setDatabase(testDatabase);
  return testDatabase;
}

export function clearTestDatabase(): void {
  if (testDatabase) {
    testDatabase.clear();
  }
}

export function teardownTestDatabase(): void {
  clearTestDatabase();
  resetDatabase();
  testDatabase = null;
}

export function getTestDatabase(): Database {
  if (!testDatabase) {
    return setupTestDatabase();
  }
  return testDatabase;
}

