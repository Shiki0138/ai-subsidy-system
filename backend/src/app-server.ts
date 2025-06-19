/**
 * AI補助金申請書自動作成システム - シンプルサーバー
 * 新しく実装したAPIエンドポイントをテスト
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// ルートのインポート
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import applicationRoutes from './routes/applications';
import healthRoutes from './routes/health';

// 環境変数の読み込み
dotenv.config();

// アプリケーション設定
const app = express();
const PORT = process.env.PORT || 3001;
const prisma = new PrismaClient();

// ミドルウェア設定
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ログ出力ミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});


// API ルート
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);

// エラーハンドリング
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `ルート ${req.originalUrl} が見つかりません` }
  });
});

app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    error: { 
      message: process.env.NODE_ENV === 'production' 
        ? 'サーバーエラーが発生しました'
        : error.message 
    }
  });
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`🚀 AI補助金申請システム バックエンドサーバー起動`);
  console.log(`📡 ポート: ${PORT}`);
  console.log(`🌍 環境: ${process.env.NODE_ENV || 'development'}`);
  
  // データベース接続テスト
  prisma.$queryRaw`SELECT 1`
    .then(() => console.log('✅ データベース接続成功'))
    .catch((err) => console.error('❌ データベース接続失敗:', err));
});

// グレースフルシャットダウン
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    prisma.$disconnect()
      .then(() => console.log('Database disconnected'))
      .catch((err) => console.error('Error disconnecting database:', err));
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  process.emit('SIGTERM');
});

export { app, prisma };