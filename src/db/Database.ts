import mongoose from 'mongoose';
import type { ConnectOptions, Connection } from 'mongoose';

import { isTesting } from '../env';

type TDatabase = typeof mongoose;
type TConnection = Connection;
interface IDBOptions extends ConnectOptions {
  url: string;
}
const DB_NAME = isTesting ? 'egrul_egrip_test' : 'egrul_egrip';

const URL = `mongodb://127.0.0.1:27017/${DB_NAME}`;

class Database {
  private _db: TDatabase;
  private readonly _options: IDBOptions;

  constructor(db: TDatabase, options: IDBOptions) {
    this._db = db;
    this._options = options;
  }

  async connect(): Promise<void> {
    try {
      const { url, ...options } = this._options;
      await this._db.connect(url, options);
      console.log('Connected to database');
    } catch (error) {
      console.error('Error connecting to database');
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this._db.disconnect();
      console.log('Disconnected from database');
    } catch (error) {
      console.error('Error disconnecting from database');
    }
  }

  get connection(): TConnection {
    return this._db.connection;
  }
}

export const db = new Database(mongoose, {
  url: URL,
  serverSelectionTimeoutMS: 5000,
});

db.connection.on('error', (error) => {
  throw error;
});
