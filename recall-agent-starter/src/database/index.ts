import { PostgresDatabaseAdapter } from '@elizaos/adapter-postgres';
import { SqliteDatabaseAdapter } from '@elizaos/adapter-sqlite';
import Database from 'better-sqlite3';
import path from 'path';

export function initializeDatabase(dataDir: string) {
  if (process.env.POSTGRES_URL) {
    const db = new PostgresDatabaseAdapter({
      connectionString: process.env.POSTGRES_URL,
    });
    return db;
  } else {
    try {
      // Use in-memory database by default to avoid SQLite binding issues
      const filePath = process.env.SQLITE_FILE ?? ':memory:';
      console.log('Using SQLite database at:', filePath);
      const db = new SqliteDatabaseAdapter(new Database(filePath));
      return db;
    } catch (error) {
      console.error('Error initializing SQLite database:', error);
      // Create a minimal mock adapter that matches the required interfaces
      return {
        init: () => Promise.resolve(),
        addTable: () => Promise.resolve(),
        removeTable: () => Promise.resolve(),
        addRow: () => Promise.resolve(),
        getRows: () => Promise.resolve([]),
        updateRow: () => Promise.resolve(),
        removeRow: () => Promise.resolve(),
        bulkRemoveRows: () => Promise.resolve(),
        getDistinct: () => Promise.resolve([]),
        createIndex: () => Promise.resolve(),
        dropIndex: () => Promise.resolve(),
        // Cache methods with correct return types
        getCache: () => Promise.resolve(null),
        setCache: () => Promise.resolve(true), // Must return Promise<boolean>
        deleteCache: () => Promise.resolve(true) // Should probably also return boolean for consistency
      };
    }
  }
}
