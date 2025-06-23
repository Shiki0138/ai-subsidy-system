const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 7001;

// ミドルウェア
app.use(cors({
  origin: 'http://localhost:7002',
  credentials: true
}));
app.use(express.json());

// 開発用認証エンドポイント
app.post('/api/dev-auth/auto-login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-jwt-token-for-development',
    user: {
      id: 'mock-user-id',
      email: 'test@example.com',
      role: 'USER'
    }
  });
});

// 小規模事業持続化補助金 - 書類生成エンドポイント
app.post('/api/sustainability-subsidy/generate-all-documents', (req, res) => {
  console.log('📄 書類生成リクエストを受信:', req.body);
  
  // 模擬的な遅延
  setTimeout(() => {
    res.json({
      success: true,
      message: 'All application documents generated successfully',
      data: {
        documents: [
          {
            id: 'form1',
            title: '様式1：申請書',
            description: '小規模事業者持続化補助金に係る申請書',
            content: '申請書の内容がここに生成されます...',
            downloadUrl: '/mock/form1.pdf'
          },
          {
            id: 'form2',
            title: '様式2：経営計画書',
            description: '経営計画書兼補助事業計画書①',
            content: 'AI生成された経営計画書の内容...',
            downloadUrl: '/mock/form2.pdf'
          },
          {
            id: 'form3',
            title: '様式3：補助事業計画書',
            description: '補助事業計画書②（経費明細）',
            content: '経費明細を含む補助事業計画書...',
            downloadUrl: '/mock/form3.pdf'
          },
          {
            id: 'form5',
            title: '様式5：交付申請書',
            description: '補助金交付申請書',
            content: '交付申請書の内容...',
            downloadUrl: '/mock/form5.pdf'
          },
          {
            id: 'form6',
            title: '様式6：宣誓・同意書',
            description: '宣誓・同意書',
            content: '宣誓・同意書の内容...',
            downloadUrl: '/mock/form6.pdf'
          }
        ],
        summary: {
          totalDocuments: 5,
          estimatedSubsidyAmount: req.body.budgetPlan?.subsidyAmount || 1000000,
          projectCost: req.body.budgetPlan?.totalProjectCost || 1500000,
          subsidyRate: ((req.body.budgetPlan?.subsidyAmount || 1000000) / (req.body.budgetPlan?.totalProjectCost || 1500000) * 100).toFixed(1) + '%'
        }
      }
    });
  }, 2000); // 2秒の遅延でリアルな感覚を演出
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mock backend is running',
    timestamp: new Date().toISOString()
  });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl
  });
});

// エラーハンドラー
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Backend Server running on http://localhost:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  POST /api/dev-auth/auto-login');
  console.log('  POST /api/sustainability-subsidy/generate-all-documents');
  console.log('  GET  /api/health');
});