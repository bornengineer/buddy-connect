import pg from 'pg';
import { env } from '../config/env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl:
    env.DATABASE_SSL_MODE === 'require'
      ? {
          rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED
        }
      : undefined
});
