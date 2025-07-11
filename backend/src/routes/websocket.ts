/**
 * WebSocket Management API Routes
 * Admin and monitoring endpoints for WebSocket connections
 */

import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { generalRateLimit } from '../config/security.js';
import winston from 'winston';

const router = express.Router();

// Logger for WebSocket API
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/websocket-api.log' }),
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

// WebSocketServiceのインスタンスを外部から注入できるように
let webSocketService: any = null;

export function setWebSocketService(service: any) {
  webSocketService = service;
}

/**
 * GET /api/websocket/stats
 * Get WebSocket connection statistics
 */
router.get('/stats',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      
      // Only admins and support can view connection stats
      if (userRole !== 'ADMIN' && userRole !== 'SUPPORT') {
        return res.status(403).json({
          success: false,
          error: 'この機能にアクセスする権限がありません',
          errorCode: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      if (!webSocketService) {
        return res.status(503).json({
          success: false,
          error: 'WebSocketサービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      const stats = webSocketService.getConnectionStats();

      logger.info('WebSocket stats requested', {
        requestedBy: req.user?.id,
        userRole,
        connectionCount: stats.totalConnections
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
      logger.error('Error retrieving WebSocket stats', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'WebSocket統計の取得に失敗しました',
        errorCode: 'STATS_RETRIEVAL_ERROR'
      });
    }
  }
);

/**
 * POST /api/websocket/notification
 * Send notification to users via WebSocket
 */
router.post('/notification',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const { type, title, message, userId, applicationId, data } = req.body;

      // Validate input
      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'type、title、messageは必須です',
          errorCode: 'INVALID_INPUT'
        });
      }

      // Permission check
      if (userRole !== 'ADMIN' && userRole !== 'SUPPORT') {
        return res.status(403).json({
          success: false,
          error: '通知送信権限がありません',
          errorCode: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      if (!webSocketService) {
        return res.status(503).json({
          success: false,
          error: 'WebSocketサービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      // Create notification object
      const notification = {
        type,
        title,
        message,
        data,
        timestamp: new Date().toISOString(),
        userId,
        applicationId
      };

      // Send notification
      await webSocketService.sendNotification(notification);

      logger.info('Notification sent via WebSocket', {
        sentBy: req.user?.id,
        targetUser: userId || 'broadcast',
        type,
        title
      });

      res.json({
        success: true,
        message: '通知を送信しました',
        data: {
          notificationId: `notif_${Date.now()}`,
          targetUser: userId || 'broadcast',
          type,
          timestamp: notification.timestamp
        },
        metadata: {
          timestamp: new Date().toISOString(),
          sentBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error sending WebSocket notification', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: '通知の送信に失敗しました',
        errorCode: 'NOTIFICATION_SEND_ERROR'
      });
    }
  }
);

/**
 * POST /api/websocket/broadcast
 * Broadcast system message to all connected users
 */
router.post('/broadcast',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;
      const { type, title, message, priority } = req.body;

      // Only admins can broadcast
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'ブロードキャスト権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          error: 'type、title、messageは必須です',
          errorCode: 'INVALID_INPUT'
        });
      }

      if (!webSocketService) {
        return res.status(503).json({
          success: false,
          error: 'WebSocketサービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      const broadcast = {
        type: 'info',
        title: `🔔 システム通知: ${title}`,
        message,
        data: {
          priority: priority || 'normal',
          fromAdmin: true,
          adminId: req.user?.id
        },
        timestamp: new Date().toISOString()
      };

      // Send broadcast (no userId means broadcast to all)
      await webSocketService.sendNotification(broadcast);

      logger.info('System broadcast sent', {
        sentBy: req.user?.id,
        title,
        priority
      });

      res.json({
        success: true,
        message: 'システム通知をブロードキャストしました',
        data: {
          broadcastId: `broadcast_${Date.now()}`,
          title,
          priority,
          timestamp: broadcast.timestamp
        },
        metadata: {
          timestamp: new Date().toISOString(),
          sentBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error sending broadcast', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'ブロードキャストの送信に失敗しました',
        errorCode: 'BROADCAST_ERROR'
      });
    }
  }
);

/**
 * GET /api/websocket/health
 * WebSocket service health check
 */
router.get('/health',
  generalRateLimit,
  async (req: Request, res: Response) => {
    try {
      if (!webSocketService) {
        return res.status(503).json({
          success: false,
          status: 'unavailable',
          message: 'WebSocketサービスが利用できません'
        });
      }

      const stats = webSocketService.getConnectionStats();

      res.json({
        success: true,
        status: 'healthy',
        data: {
          serviceStatus: 'running',
          activeConnections: stats.totalConnections,
          activeApplications: stats.activeApplications,
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      logger.error('WebSocket health check failed', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        status: 'unhealthy',
        error: 'ヘルスチェックに失敗しました'
      });
    }
  }
);

/**
 * POST /api/websocket/cleanup
 * Manually trigger cleanup of inactive connections
 */
router.post('/cleanup',
  authenticateToken,
  generalRateLimit,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user?.role;

      // Only admins can trigger cleanup
      if (userRole !== 'ADMIN') {
        return res.status(403).json({
          success: false,
          error: 'クリーンアップ実行権限がありません',
          errorCode: 'ADMIN_ONLY'
        });
      }

      if (!webSocketService) {
        return res.status(503).json({
          success: false,
          error: 'WebSocketサービスが利用できません',
          errorCode: 'SERVICE_UNAVAILABLE'
        });
      }

      await webSocketService.cleanupInactiveConnections();

      logger.info('Manual WebSocket cleanup triggered', {
        triggeredBy: req.user?.id
      });

      res.json({
        success: true,
        message: '非アクティブ接続のクリーンアップを実行しました',
        metadata: {
          timestamp: new Date().toISOString(),
          triggeredBy: req.user?.id
        }
      });

    } catch (error: any) {
      logger.error('Error during manual cleanup', {
        userId: req.user?.id,
        error: error.message
      });

      res.status(500).json({
        success: false,
        error: 'クリーンアップの実行に失敗しました',
        errorCode: 'CLEANUP_ERROR'
      });
    }
  }
);

export default router;