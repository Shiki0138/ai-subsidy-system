/**
 * AI補助金申請書自動作成システム - シンプルサーバー
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// データベース接続
const prisma = new PrismaClient();

// Express アプリケーション設定
const app = express();
const PORT = process.env.PORT || 3001;

// 基本ミドルウェア
app.use(helmet());
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ai-subsidy-backend'
  });
});

// 補助金プログラム一覧取得
app.get('/api/subsidy-programs', async (req, res) => {
  try {
    const programs = await prisma.subsidyProgram.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        maxAmount: true,
        description: true,
      },
    });
    
    res.json({
      success: true,
      data: programs,
    });
  } catch (error) {
    console.error('Error fetching subsidy programs:', error);
    res.status(500).json({
      success: false,
      error: { message: 'データの取得に失敗しました' }
    });
  }
});

// エラーハンドリング
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: {
      message: 'サーバーエラーが発生しました',
      timestamp: new Date().toISOString()
    }
  });
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    error: {
      message: 'リソースが見つかりません',
      path: req.path,
      timestamp: new Date().toISOString()
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

export { app, prisma };