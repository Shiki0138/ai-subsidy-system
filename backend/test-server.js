const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// 基本ミドルウェア
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// テスト用ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// API一覧
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Track A Backend API Test Server',
    endpoints: [
      'GET /api/health - ヘルスチェック',
      'GET /api/test - この画面',
      'POST /api/auth/login - ログイン（実装済み）',
      'PUT /api/users/profile - プロフィール更新（実装済み）',
      'GET /api/applications - 申請書一覧（実装済み）',
      'POST /api/applications/:id/regenerate - AI再生成（実装済み）',
      'GET /api/applications/recommendations - 補助金推奨（NEW）',
    ],
    implementation_status: {
      user_management: '✅ 完了',
      application_crud: '✅ 完了', 
      ai_features: '✅ 完了',
      pdf_generation: '✅ 完了',
      new_ai_features: '✅ 完了'
    }
  });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `エンドポイント ${req.method} ${req.originalUrl} は見つかりません`,
    availableEndpoints: ['/api/health', '/api/test']
  });
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`🚀 Track A テストサーバー起動: http://localhost:${PORT}`);
  console.log(`📋 API一覧: http://localhost:${PORT}/api/test`);
  console.log(`❤️  ヘルスチェック: http://localhost:${PORT}/api/health`);
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

module.exports = app;