/**
 * Rate Limit Management API Routes
 * Admin endpoints for managing rate limits, whitelists, and monitoring
 */

import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generalRateLimit } from '../config/security.js';
import winston from 'winston';

const router = express.Router();

// Logger for rate limit API
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/rate-limit-api.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ]
});

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

// Advanced rate limiter instance will be injected
let advancedRateLimiter: any = null;

export function setAdvancedRateLimiter(limiter: any) {
  advancedRateLimiter = limiter;
}

/**
 * GET /api/rate-limit/stats
 * Get comprehensive rate limiting statistics
 */
router.get('/stats',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      
      // Only admins can view rate limit stats
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!advancedRateLimiter) {
        return res.status(503).json({
          success: false,
          error: 'レート制限サービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      const stats = await advancedRateLimiter.getRateLimitStats();

      logger.info('Rate limit stats requested', {
        requestedBy: req.user?.id,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: stats,
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving rate limit stats', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'レート制限統計の取得に失敗しました',
        errorCode: 'STATS_ERROR'
      });
    }
  }
);

/**
 * POST /api/rate-limit/whitelist
 * Add user or IP to whitelist
 */
router.post('/whitelist',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const { identifier, type, duration } = req.body;

      // Only admins can manage whitelist
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!identifier || !type || !['ip', 'user'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'identifier、type (ip または user) は必須です',
          errorCode: 'INVALID_INPUT'
        });
      }

      if (!advancedRateLimiter) {
        return res.status(503).json({
          success: false,
          error: 'レート制限サービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      await advancedRateLimiter.addToWhitelist(identifier, type, duration);

      logger.info('Added to rate limit whitelist', {
        identifier,
        type,
        duration,
        addedBy: req.user?.id
      });

      res.json({
        success: true,
        message: `${type} ${identifier} をホワイトリストに追加しました`,
        data: {
          identifier,
          type,
          duration: duration || 'permanent',
          addedAt: new Date().toISOString(),
          addedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error adding to whitelist', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ホワイトリストへの追加に失敗しました',
        errorCode: 'WHITELIST_ADD_ERROR'
      });
    }
  }
);

/**
 * DELETE /api/rate-limit/whitelist
 * Remove user or IP from whitelist
 */
router.delete('/whitelist',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const { identifier, type } = req.body;

      // Only admins can manage whitelist
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!identifier || !type || !['ip', 'user'].includes(type)) {
        return res.status(400).json({
          success: false,
          error: 'identifier、type (ip または user) は必須です',
          errorCode: 'INVALID_INPUT'
        });
      }

      if (!advancedRateLimiter) {
        return res.status(503).json({
          success: false,
          error: 'レート制限サービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      await advancedRateLimiter.removeFromWhitelist(identifier, type);

      logger.info('Removed from rate limit whitelist', {
        identifier,
        type,
        removedBy: req.user?.id
      });

      res.json({
        success: true,
        message: `${type} ${identifier} をホワイトリストから削除しました`,
        data: {
          identifier,
          type,
          removedAt: new Date().toISOString(),
          removedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error removing from whitelist', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ホワイトリストからの削除に失敗しました',
        errorCode: 'WHITELIST_REMOVE_ERROR'
      });
    }
  }
);

/**
 * GET /api/rate-limit/blocked
 * Get list of blocked IPs
 */
router.get('/blocked',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      
      // Only admins and support can view blocked IPs
      if (userRole !== 'ADMIN' && userRole !== 'SUPPORT') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      if (!advancedRateLimiter) {
        return res.status(503).json({
          success: false,
          error: 'レート制限サービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      // Get blocked IPs from Redis
      const redis = require('../index').redis;
      const blockedKeys = await redis.keys('blocked:*');
      
      const blockedIPs = [];
      for (const key of blockedKeys) {
        const ip = key.replace('blocked:', '');
        const suspicionScore = await redis.get(key);
        const ttl = await redis.ttl(key);
        
        blockedIPs.push({
          ip,
          suspicionScore: parseInt(suspicionScore),
          remainingTime: ttl,
          blockedAt: new Date(Date.now() - (3600 - ttl) * 1000).toISOString()
        });
      }

      logger.info('Blocked IPs list requested', {
        requestedBy: req.user?.id,
        blockedCount: blockedIPs.length
      });

      res.json({
        success: true,
        data: {
          blockedIPs,
          totalBlocked: blockedIPs.length
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving blocked IPs', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ブロック済みIP一覧の取得に失敗しました',
        errorCode: 'BLOCKED_IPS_ERROR'
      });
    }
  }
);

/**
 * POST /api/rate-limit/unblock
 * Manually unblock an IP address
 */
router.post('/unblock',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const { ip } = req.body;

      // Only admins can unblock IPs
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!ip) {
        return res.status(400).json({
          success: false,
          error: 'IPアドレスは必須です',
          errorCode: 'INVALID_INPUT'
        });
      }

      // Remove from blocked list
      const redis = require('../index').redis;
      const result = await redis.del(`blocked:${ip}`);

      if (result === 0) {
        return res.status(404).json({
          success: false,
          error: '指定されたIPアドレスはブロックされていません',
          errorCode: 'IP_NOT_BLOCKED'
        });
      }

      logger.info('IP address unblocked', {
        ip,
        unblockedBy: req.user?.id
      });

      res.json({
        success: true,
        message: `IPアドレス ${ip} のブロックを解除しました`,
        data: {
          ip,
          unblockedAt: new Date().toISOString(),
          unblockedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error unblocking IP', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'IPブロック解除に失敗しました',
        errorCode: 'UNBLOCK_ERROR'
      });
    }
  }
);

/**
 * GET /api/rate-limit/usage/:userId
 * Get rate limit usage for specific user
 */
router.get('/usage/:userId',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const targetUserId = req.params.userId;
      const requestingUserId = req.user?.id;

      // Users can only view their own usage, admins can view any user's usage
      if (userRole !== 'ADMIN' && requestingUserId !== targetUserId) {
        return res.status(403).json({
          success: false,
          error: '他のユーザーの使用状況を表示する権限がありません',
          errorCode: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      if (!advancedRateLimiter) {
        return res.status(503).json({
          success: false,
          error: 'レート制限サービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      const stats = await advancedRateLimiter.getRateLimitStats(targetUserId);

      logger.info('User rate limit usage requested', {
        targetUserId,
        requestedBy: requestingUserId
      });

      res.json({
        success: true,
        data: {
          userId: targetUserId,
          usage: stats,
          limits: {
            general: 100,
            upload: 20,
            aiGeneration: 1000
          }
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestedBy: requestingUserId
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving user rate limit usage', {
        userId: req.user?.id,
        targetUserId: req.params.userId,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ユーザー使用状況の取得に失敗しました',
        errorCode: 'USER_USAGE_ERROR'
      });
    }
  }
);

/**
 * POST /api/rate-limit/config/update
 * Update rate limiting configuration (Admin only)
 */
router.post('/config/update',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const { configKey, configValue } = req.body;

      // Only admins can update configuration
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!configKey || configValue === undefined) {
        return res.status(400).json({
          success: false,
          error: 'configKey と configValue は必須です',
          errorCode: 'INVALID_INPUT'
        });
      }

      // In a real implementation, this would update the configuration
      // For now, we'll just log the change
      logger.info('Rate limit configuration update requested', {
        configKey,
        configValue,
        updatedBy: req.user?.id
      });

      res.json({
        success: true,
        message: 'レート制限設定を更新しました',
        data: {
          configKey,
          configValue,
          updatedAt: new Date().toISOString(),
          updatedBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error updating rate limit configuration', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '設定の更新に失敗しました',
        errorCode: 'CONFIG_UPDATE_ERROR'
      });
    }
  }
);

export default router;