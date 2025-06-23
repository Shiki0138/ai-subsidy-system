/**
 * AI補助金申請書自動作成システム - メインサーバー
 * 
 * 世界最高レベルのセキュリティとパフォーマンスを実現
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import connectRedis from 'connect-redis';
import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import winston from 'winston';
import { createServer } from 'http';
import { Request, Response, NextFunction } from 'express';

// 設定・ミドルウェアのインポート
import * as security from './config/security';
import * as requestLogger from './middleware/requestLogger';
import * as errorHandler from './middleware/errorHandler';
import { AuthenticatedRequest } from './middleware/authenticate';
import { conditionalAuth } from './middleware/devAuthBypass';
import devAuthRoutes from './routes/devAuth';

// ルーターのインポート
import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import userRoutes from './routes/users';
import healthRoutes from './routes/health';
import subsidyGuidelinesRoutes from './routes/subsidyGuidelines';
import adoptedCasesRoutes from './routes/adoptedCases';
import autoFillRoutes from './routes/autoFill';
import uploadsRoutes from './routes/uploads';
import websocketRoutes, { setWebSocketService } from './routes/websocket';
// import rateLimitRoutes, { setAdvancedRateLimiter } from './routes/rateLimit';
import aiTextGenerationRoutes from './routes/aiTextGeneration';
import companyAutoFillRoutes from './routes/companyAutoFill';
import notificationRoutes from './routes/notifications';
import subsidyDocumentsRoutes from './routes/subsidyDocuments';
import subsidiesRoutes from './routes/subsidies';
import applicationGenerationRoutes from './routes/applicationGeneration';
import marketAnalysisRoutes from './routes/marketAnalysis';
import corporateAnalysisRoutes from './routes/corporateAnalysis';
import patentAnalysisRoutes from './routes/patentAnalysis';
import financialAnalysisRoutes from './routes/financialAnalysis';
import matchSubsidyRoutes from './routes/matchSubsidy';
import billingRoutes from './routes/billing';
import progressManagementRoutes from './routes/progressManagement';
import milestonesRoutes from './routes/milestones';
import resultReportsRoutes from './routes/resultReports';
import documentTemplatesRoutes from './routes/documentTemplates';
import sustainabilitySubsidyRoutes from './routes/sustainabilitySubsidy';
import monozukuriRoutes from './routes/monozukuri';
import businessImprovementSubsidyRoutes from './routes/businessImprovementSubsidy';
import reconstructionSubsidyRoutes from './routes/reconstructionSubsidy';
import WebSocketService from './services/websocketService';
// import AdvancedRateLimiter from './middleware/advancedRateLimit';
// import RATE_LIMIT_CONFIG from './config/rateLimitConfig';
import * as envValidator from './utils/validateEnvironment';

// 環境変数の読み込み
dotenv.config();

// 環境変数の検証
try {
  envValidator.validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

// ===== ロガー設定 =====
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'ai-subsidy-backend',
    version: process.env.APP_VERSION || '1.0.0'
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
  ]
});

// 本番環境ではElasticsearchにログ送信
if (process.env.NODE_ENV === 'production' && process.env.ELASTICSEARCH_URL) {
  const ElasticsearchTransport = require('winston-elasticsearch');
  logger.add(new ElasticsearchTransport({
    level: 'info',
    clientOpts: {
      node: process.env.ELASTICSEARCH_URL
    },
    index: 'ai-subsidy-logs'
  }));
}

// ===== データベース・Redis接続 =====
const prisma = new PrismaClient({
  log: process.env.DEBUG_SQL === 'true' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error']
});

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  maxRetriesPerRequest: 3
});

// Redis接続イベント
redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error('Redis connection error:', err);
});

// ===== Express アプリケーション設定 =====
const app = express();
const PORT = process.env.PORT || 7001;

// 基本ミドルウェア
app.use(security.helmetConfig);
app.use(cors(security.corsOptions));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// レート制限
app.use(security.generalRateLimit);

// セッション管理  
app.use(session({
  ...security.ENCRYPTION.sessionOptions,
  store: new connectRedis({
    client: redis,
  }),
}));

// リクエストログ
app.use(requestLogger.requestLogger(logger));

// ===== API ルート =====
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// 開発用ルート（本番環境では無効）
if (process.env.NODE_ENV !== 'production') {
  app.use('/api/dev-auth', devAuthRoutes);
  logger.info('🔧 開発用認証エンドポイントを有効化しました');
}
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/subsidy-guidelines', subsidyGuidelinesRoutes);
app.use('/api/adopted-cases', adoptedCasesRoutes);
app.use('/api/auto-fill', autoFillRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/files', uploadsRoutes); // フロントエンドの互換性のため
app.use('/api/websocket', websocketRoutes);
// app.use('/api/rate-limit', rateLimitRoutes);
app.use('/api/ai', aiTextGenerationRoutes);
app.use('/api/company-autofill', companyAutoFillRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/subsidy-documents', subsidyDocumentsRoutes);
app.use('/api/subsidies', subsidiesRoutes);
app.use('/api/applications', applicationGenerationRoutes);
app.use('/api/market-analysis', marketAnalysisRoutes);
app.use('/api/corporate-analysis', corporateAnalysisRoutes);
app.use('/api/patent-analysis', patentAnalysisRoutes);
app.use('/api/financial-analysis', financialAnalysisRoutes);
app.use('/api/match-subsidy', matchSubsidyRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/progress', progressManagementRoutes);
app.use('/api/milestones', milestonesRoutes);
app.use('/api/result-reports', resultReportsRoutes);
app.use('/api/document-templates', documentTemplatesRoutes);
app.use('/api/sustainability-subsidy', sustainabilitySubsidyRoutes);
app.use('/api/monozukuri', monozukuriRoutes);
app.use('/api/business-improvement-subsidy', businessImprovementSubsidyRoutes);
app.use('/api/reconstruction-subsidy', reconstructionSubsidyRoutes);

// プロセスステータス確認用エンドポイント（汎用）
app.get('/api/processes/:processId/status', async (req: Request, res: Response) => {
  const { processId } = req.params;
  
  // TODO: 実際のプロセス管理システムと連携
  res.json({
    success: true,
    data: {
      processId,
      status: 'completed',
      progress: 100,
      result: {
        message: '処理が完了しました'
      }
    }
  });
});

// ===== エラーハンドリング =====
app.use(errorHandler.notFoundHandler);
app.use(errorHandler.errorHandler(logger));

// ===== グレースフルシャットダウン =====
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  // HTTP サーバーを閉じる
  server.close(() => {
    logger.info('HTTP server closed');
    
    // データベース接続を閉じる
    prisma.$disconnect()
      .then(() => logger.info('Database disconnected'))
      .catch((err) => logger.error('Error disconnecting database:', err));
    
    // Redis接続を閉じる
    redis.disconnect();
    logger.info('Redis disconnected');
    
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.emit('SIGTERM');
});

// 未処理例外のキャッチ
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// ===== 高度なレート制限システム初期化 =====
// TODO: Fix TypeScript issues in rate limiting
// const advancedRateLimiter = new AdvancedRateLimiter(redis, logger);
const advancedRateLimiter = null;

// IP ブロックチェックミドルウェア
// TODO: Re-enable after fixing TypeScript issues
/*
app.use(async (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';
  const isBlocked = await advancedRateLimiter.isIPBlocked(clientIP);
  if (isBlocked) {
    logger.warn('Blocked IP attempted access', { ip: clientIP, path: req.path });
    return res.status(429).json(RATE_LIMIT_CONFIG.ERROR_RESPONSES.IP_BLOCKED);
  }
  
  // Check whitelist
  const isWhitelisted = await advancedRateLimiter.isWhitelisted(clientIP, 'ip');
  if (isWhitelisted) {
    return next(); // Skip all rate limiting for whitelisted IPs
  }
  
  next();
});

// 不審なアクティビティ検出（設定で有効な場合）
if (RATE_LIMIT_CONFIG.FEATURES.enableSuspiciousActivityDetection) {
  const suspiciousActivityDetector = advancedRateLimiter.createSuspiciousActivityDetector() as any;
  app.use(suspiciousActivityDetector);
}
*/

// ===== HTTPサーバーとWebSocketサービス起動 =====
const httpServer = createServer(app);
const webSocketService = new WebSocketService(httpServer, prisma, redis, logger);

// WebSocketサービスをルートに注入
setWebSocketService(webSocketService);

// 高度なレート制限サービスをルートに注入
// setAdvancedRateLimiter(advancedRateLimiter);

// 定期的な非アクティブ接続のクリーンアップ
setInterval(() => {
  webSocketService.cleanupInactiveConnections();
}, 15 * 60 * 1000); // 15分ごと

const server = httpServer.listen(PORT, () => {
  logger.info(`🚀 AI補助金申請システム バックエンドサーバー起動`);
  logger.info(`📡 ポート: ${PORT}`);
  logger.info(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔒 セキュリティ: 最高レベル有効`);
  logger.info(`🤖 AI統合: OpenAI + Anthropic`);
  logger.info(`🌐 WebSocket: リアルタイム通信有効`);
  
  // データベース接続テスト
  prisma.$queryRaw`SELECT 1`
    .then(() => logger.info('✅ データベース接続成功'))
    .catch((err) => logger.error('❌ データベース接続失敗:', err));
  
  // Redis接続テスト
  redis.ping()
    .then(() => logger.info('✅ Redis接続成功'))
    .catch((err) => logger.error('❌ Redis接続失敗:', err));
});

// アプリケーションとプリズマクライアントをエクスポート
export { app, prisma, redis, logger, webSocketService, advancedRateLimiter };