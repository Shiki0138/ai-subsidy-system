/**
 * リクエストログミドルウェア
 * セキュリティ監査とパフォーマンス監視のためのログ記録
 */

import { Request, Response, NextFunction } from 'express';
import winston from 'winston';
import { v4 as uuidv4 } from 'uuid';

// リクエスト情報の型定義
interface RequestInfo {
  requestId: string;
  method: string;
  url: string;
  userAgent?: string;
  ip: string;
  userId?: string;
  timestamp: string;
  responseTime?: number;
  statusCode?: number;
  contentLength?: number;
}

// センシティブ情報をマスクするフィールド
const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'authorization',
  'cookie',
  'x-api-key'
];

/**
 * センシティブ情報のマスキング
 */
function maskSensitiveData(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const masked = { ...obj };
  
  for (const key in masked) {
    const lowerKey = key.toLowerCase();
    
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      masked[key] = '[MASKED]';
    } else if (typeof masked[key] === 'object') {
      masked[key] = maskSensitiveData(masked[key]);
    }
  }
  
  return masked;
}

/**
 * IPアドレスの取得
 */
function getClientIp(req: Request): string {
  return (
    req.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.get('x-real-ip') ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

/**
 * User-Agentの分析
 */
function analyzeUserAgent(userAgent?: string): {
  browser?: string;
  os?: string;
  device?: string;
  isBot: boolean;
} {
  if (!userAgent) {
    return { isBot: false };
  }

  const ua = userAgent.toLowerCase();
  const isBot = /bot|crawler|spider|crawling/i.test(userAgent);
  
  let browser = 'unknown';
  if (ua.includes('chrome')) browser = 'chrome';
  else if (ua.includes('firefox')) browser = 'firefox';
  else if (ua.includes('safari')) browser = 'safari';
  else if (ua.includes('edge')) browser = 'edge';
  
  let os = 'unknown';
  if (ua.includes('windows')) os = 'windows';
  else if (ua.includes('mac')) os = 'macos';
  else if (ua.includes('linux')) os = 'linux';
  else if (ua.includes('android')) os = 'android';
  else if (ua.includes('ios')) os = 'ios';
  
  let device = 'desktop';
  if (ua.includes('mobile')) device = 'mobile';
  else if (ua.includes('tablet')) device = 'tablet';

  return { browser, os, device, isBot };
}

/**
 * リクエストログミドルウェア
 */
export function requestLogger(logger: winston.Logger) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const requestId = uuidv4();
    
    // リクエストIDをレスポンスヘッダーに追加
    res.set('X-Request-ID', requestId);
    
    // リクエスト情報の収集
    const requestInfo: RequestInfo = {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('user-agent'),
      ip: getClientIp(req),
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString()
    };

    // User-Agent分析
    const uaAnalysis = analyzeUserAgent(requestInfo.userAgent);
    
    // リクエスト開始ログ
    logger.info('Request started', {
      ...requestInfo,
      userAgentAnalysis: uaAnalysis,
      headers: maskSensitiveData(req.headers),
      query: req.query,
      ...(req.method !== 'GET' && {
        body: maskSensitiveData(req.body)
      })
    });

    // ボット検出のログ
    if (uaAnalysis.isBot) {
      logger.warn('Bot detected', {
        requestId,
        ip: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        url: requestInfo.url
      });
    }

    // レスポンス完了時の処理
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const contentLength = res.get('content-length');
      
      const logData = {
        ...requestInfo,
        responseTime,
        statusCode: res.statusCode,
        contentLength: contentLength ? parseInt(contentLength) : undefined,
        userAgentAnalysis: uaAnalysis
      };

      // ステータスコードに応じたログレベル
      if (res.statusCode >= 500) {
        logger.error('Request completed with server error', logData);
      } else if (res.statusCode >= 400) {
        logger.warn('Request completed with client error', logData);
      } else {
        logger.info('Request completed successfully', logData);
      }

      // パフォーマンス監視
      if (responseTime > 5000) {
        logger.warn('Slow request detected', {
          ...logData,
          performance: 'slow'
        });
      }

      // セキュリティイベントの記録
      if (res.statusCode === 401) {
        logger.warn('Authentication failed', {
          ...logData,
          securityEvent: 'AUTH_FAILED'
        });
      } else if (res.statusCode === 403) {
        logger.warn('Authorization failed', {
          ...logData,
          securityEvent: 'AUTHZ_FAILED'
        });
      } else if (res.statusCode === 429) {
        logger.warn('Rate limit exceeded', {
          ...logData,
          securityEvent: 'RATE_LIMIT_EXCEEDED'
        });
      }
    });

    // レスポンスエラー時の処理
    res.on('error', (error) => {
      logger.error('Response error', {
        ...requestInfo,
        error: {
          message: error.message,
          stack: error.stack
        }
      });
    });

    next();
  };
}

/**
 * APIエンドポイント別のメトリクス収集
 */
export function metricsLogger(logger: winston.Logger) {
  const metrics = new Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastAccessed: Date;
  }>();

  // 定期的なメトリクス出力（5分間隔）
  setInterval(() => {
    if (metrics.size > 0) {
      const metricsData = Array.from(metrics.entries()).map(([endpoint, data]) => ({
        endpoint,
        averageResponseTime: Math.round(data.totalTime / data.count),
        requestCount: data.count,
        errorCount: data.errors,
        errorRate: Math.round((data.errors / data.count) * 100),
        lastAccessed: data.lastAccessed
      }));

      logger.info('API Metrics', {
        type: 'metrics',
        period: '5min',
        endpoints: metricsData
      });

      // メトリクスリセット
      metrics.clear();
    }
  }, 5 * 60 * 1000);

  return (req: Request, res: Response, next: NextFunction): void => {
    const startTime = Date.now();
    const endpoint = `${req.method} ${req.route?.path || req.path}`;

    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      const isError = res.statusCode >= 400;

      const current = metrics.get(endpoint) || {
        count: 0,
        totalTime: 0,
        errors: 0,
        lastAccessed: new Date()
      };

      metrics.set(endpoint, {
        count: current.count + 1,
        totalTime: current.totalTime + responseTime,
        errors: current.errors + (isError ? 1 : 0),
        lastAccessed: new Date()
      });
    });

    next();
  };
}

export default {
  requestLogger,
  metricsLogger
};