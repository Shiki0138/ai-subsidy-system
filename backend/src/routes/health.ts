/**
 * ヘルスチェック API
 * システムの稼働状況と各サービスの接続状態を確認
 */

import { Router, Request, Response } from 'express';
import { prisma, redis, logger } from '../index';

const router = Router();

/**
 * 基本ヘルスチェック
 * GET /api/health
 */
router.get('/', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: 'unknown',
      redis: 'unknown',
      memory: {
        used: process.memoryUsage(),
        free: Math.round((process.memoryUsage().heapTotal - process.memoryUsage().heapUsed) / 1024 / 1024),
        percentage: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100)
      }
    },
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };

  try {
    // データベース接続チェック
    await prisma.$queryRaw`SELECT 1`;
    healthCheck.services.database = 'connected';
  } catch (error) {
    healthCheck.services.database = 'disconnected';
    healthCheck.status = 'degraded';
    logger.error('Database health check failed:', error);
  }

  try {
    // Redis接続チェック
    await redis.ping();
    healthCheck.services.redis = 'connected';
  } catch (error) {
    healthCheck.services.redis = 'disconnected';
    healthCheck.status = 'degraded';
    logger.error('Redis health check failed:', error);
  }

  // ステータスコードの決定
  const statusCode = healthCheck.status === 'ok' ? 200 : 503;
  
  res.status(statusCode).json(healthCheck);
});

/**
 * 詳細ヘルスチェック
 * GET /api/health/detailed
 */
router.get('/detailed', async (req: Request, res: Response) => {
  const detailedHealth = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    checks: {
      database: { status: 'unknown', responseTime: 0, details: {} },
      redis: { status: 'unknown', responseTime: 0, details: {} },
      external_apis: {
        openai: { status: 'unknown', responseTime: 0 },
        anthropic: { status: 'unknown', responseTime: 0 }
      }
    },
    system: {
      nodejs_version: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime_seconds: process.uptime(),
      memory_usage: process.memoryUsage(),
      cpu_usage: process.cpuUsage()
    }
  };

  // データベース詳細チェック
  try {
    const dbStart = Date.now();
    const result = await prisma.$queryRaw`
      SELECT 
        current_database() as database_name,
        version() as version,
        now() as server_time
    ` as any[];
    
    detailedHealth.checks.database = {
      status: 'connected',
      responseTime: Date.now() - dbStart,
      details: result[0] || {}
    };
  } catch (error) {
    detailedHealth.checks.database = {
      status: 'disconnected',
      responseTime: 0,
      details: { error: (error as Error).message }
    };
    detailedHealth.status = 'degraded';
  }

  // Redis詳細チェック
  try {
    const redisStart = Date.now();
    await redis.ping();
    const info = await redis.info('server');
    
    detailedHealth.checks.redis = {
      status: 'connected',
      responseTime: Date.now() - redisStart,
      details: {
        version: info.match(/redis_version:([\\d\\.]+)/)?.[1] || 'unknown',
        uptime: info.match(/uptime_in_seconds:(\\d+)/)?.[1] || 'unknown'
      }
    };
  } catch (error) {
    detailedHealth.checks.redis = {
      status: 'disconnected',
      responseTime: 0,
      details: { error: (error as Error).message }
    };
    detailedHealth.status = 'degraded';
  }

  // 外部API接続チェック（簡易）
  if (process.env.OPENAI_API_KEY) {
    try {
      // OpenAI API の簡易チェック（実際のAPIコールは避ける）
      detailedHealth.checks.external_apis.openai = {
        status: 'configured',
        responseTime: 0
      };
    } catch (error) {
      detailedHealth.checks.external_apis.openai = {
        status: 'error',
        responseTime: 0
      };
    }
  }

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      // Anthropic API の簡易チェック
      detailedHealth.checks.external_apis.anthropic = {
        status: 'configured',
        responseTime: 0
      };
    } catch (error) {
      detailedHealth.checks.external_apis.anthropic = {
        status: 'error',
        responseTime: 0
      };
    }
  }

  const statusCode = detailedHealth.status === 'ok' ? 200 : 503;
  res.status(statusCode).json(detailedHealth);
});

/**
 * レディネスチェック
 * GET /api/health/ready
 * Kubernetesのreadiness probeで使用
 */
router.get('/ready', async (req: Request, res: Response) => {
  try {
    // 重要なサービスの接続確認
    await Promise.all([
      prisma.$queryRaw`SELECT 1`,
      redis.ping()
    ]);

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Readiness check failed:', error);
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: (error as Error).message
    });
  }
});

/**
 * ライブネスチェック  
 * GET /api/health/live
 * Kubernetesのliveness probeで使用
 */
router.get('/live', (req: Request, res: Response) => {
  // 基本的な生存確認
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

export default router;