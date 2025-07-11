/**
 * 環境変数の検証
 */

import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('3001'),
  
  // データベース
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379'),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.string().default('0'),
  
  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  
  // API Keys
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  
  // セキュリティ
  SALT_ROUNDS: z.string().default('12'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  
  // その他
  LOG_LEVEL: z.string().default('info'),
  DEBUG_SQL: z.string().default('false'),
  APP_VERSION: z.string().default('1.0.0'),
  
  // オプショナル
  ELASTICSEARCH_URL: z.string().optional(),
});

export function validateEnvironment(): void {
  try {
    envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(
        (err) => `${err.path.join('.')}: ${err.message}`
      );
      throw new Error(`Environment validation failed:\n${errorMessages.join('\n')}`);
    }
    throw error;
  }
}

export default { validateEnvironment };