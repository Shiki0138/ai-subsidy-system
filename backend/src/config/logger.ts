/**
 * ログ設定
 * 高度なログ管理とセキュリティ監査
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';

// ログレベルの定義
const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// ログフォーマットの設定
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf((info: any) => {
    const { timestamp, level, message, stack, ...meta } = info;
    const log: any = {
      timestamp,
      level,
      message,
      ...meta
    };
    
    if (stack) {
      (log as any).stack = stack;
    }
    
    return JSON.stringify(log);
  })
);

// ログディレクトリの確保
const logDir = path.join(process.cwd(), 'logs');

// 基本設定
const createLogger = () => {
  const transports: winston.transport[] = [
    // コンソール出力（開発時）
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf((info: any) => {
          const { timestamp, level, message, ...meta } = info;
          const metaStr = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
          return `${timestamp} [${level}]: ${message}${metaStr}`;
        })
      )
    })
  ];

  // 本番環境用ファイル出力
  if (process.env.NODE_ENV === 'production') {
    // 一般ログ（Info以上）
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        level: 'info',
        format: logFormat
      })
    );

    // エラーログ（専用ファイル）
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '90d',
        level: 'error',
        format: logFormat
      })
    );

    // セキュリティログ（認証・認可関連）
    transports.push(
      new DailyRotateFile({
        filename: path.join(logDir, 'security-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '365d',
        level: 'warn',
        format: logFormat
      })
    );
  }

  return winston.createLogger({
    levels: logLevels,
    format: logFormat,
    transports,
    // 未処理例外とPromise拒否のキャッチ
    exceptionHandlers: [
      new winston.transports.File({ 
        filename: path.join(logDir, 'exceptions.log'),
        format: logFormat
      })
    ],
    rejectionHandlers: [
      new winston.transports.File({ 
        filename: path.join(logDir, 'rejections.log'),
        format: logFormat
      })
    ]
  });
};

const logger = createLogger();

// セキュリティ専用ログ関数
export const securityLogger = {
  info: (message: string, meta?: any) => logger.info(message, { type: 'security', ...meta }),
  warn: (message: string, meta?: any) => logger.warn(message, { type: 'security', ...meta }),
  error: (message: string, meta?: any) => logger.error(message, { type: 'security', ...meta })
};

// API ログ関数
export const apiLogger = {
  info: (message: string, meta?: any) => logger.info(message, { type: 'api', ...meta }),
  warn: (message: string, meta?: any) => logger.warn(message, { type: 'api', ...meta }),
  error: (message: string, meta?: any) => logger.error(message, { type: 'api', ...meta })
};

// データベースログ関数
export const dbLogger = {
  info: (message: string, meta?: any) => logger.info(message, { type: 'database', ...meta }),
  warn: (message: string, meta?: any) => logger.warn(message, { type: 'database', ...meta }),
  error: (message: string, meta?: any) => logger.error(message, { type: 'database', ...meta })
};

export { logger };
export default logger;