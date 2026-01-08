import { Database } from './db.interface';
import { FileDatabase } from './db.file';
import { InMemoryDatabase } from './db.in-memory';

let databaseInstance: Database | null = null;

export function getDatabase(): Database {
  if (!databaseInstance) {
    databaseInstance = new FileDatabase();
  }
  return databaseInstance;
}

export function setDatabase(db: Database): void {
  databaseInstance = db;
}

export function resetDatabase(): void {
  databaseInstance = null;
}

export function createFileDatabase(dbPath?: string): Database {
  return new FileDatabase(dbPath);
}

export function createInMemoryDatabase(): Database {
  return new InMemoryDatabase();
}

