import 'reflect-metadata';
import 'dotenv/config';
import { DataSource } from 'typeorm';
import { createDatabaseOptions } from './database.config.js';

// CLI dùng file JS đã build để giữ nguyên cơ chế ESM của ứng dụng.
export default new DataSource(createDatabaseOptions(process.env.DATABASE_URL));
