/**
 * Track A + B 統合用 簡易API サーバー
 * フロントエンド統合テスト用の実装（パスワードハッシュ化なし）
 */

const express = require('express');
const cors = require('cors');
const aiService = require('./ai-service');
const pdfService = require('./pdf-service');

const app = express();
const PORT = 3001;

// 基本ミドルウェア
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// インメモリデータストア（テスト用）
const users = [];
const applications = [];
let userIdCounter = 1;
let appIdCounter = 1;

// 認証ミドルウェア（簡易版）
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: '認証が必要です',
        code: 'AUTHENTICATION_ERROR'
      }
    });
  }

  // 簡易トークン検証
  const token = authHeader.substring(7);
  const userId = token.replace('token-', '');
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({
      error: {
        message: 'ユーザーが見つかりません',
        code: 'AUTHENTICATION_ERROR'
      }
    });
  }
  
  req.user = user;
  next();
};

// ===== 認証API =====

// POST /api/auth/register - 新規登録
app.post('/api/auth/register', (req, res) => {
  const { email, password, companyName, representativeName, phone } = req.body;
  
  // バリデーション
  if (!email || !password || !companyName || !representativeName) {
    return res.status(400).json({
      error: {
        message: '必須フィールドが不足しています',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // メール重複チェック
  if (users.find(u => u.email === email)) {
    return res.status(409).json({
      error: {
        message: 'このメールアドレスは既に登録されています',
        code: 'CONFLICT_ERROR'
      }
    });
  }

  // ユーザー作成（パスワードそのまま保存 - テスト用）
  const user = {
    id: String(userIdCounter++),
    email,
    password,
    companyName,
    representativeName,
    phone: phone || null,
    address: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lastLoginAt: null
  };
  
  users.push(user);
  console.log(`✅ User registered: ${email}`);

  // 簡易トークン生成
  const token = `token-${user.id}`;

  res.status(201).json({
    message: 'ユーザー登録が完了しました',
    user: {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      representativeName: user.representativeName,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt
    },
    token
  });
});

// POST /api/auth/login - ログイン
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({
      error: {
        message: 'メールアドレスとパスワードが必要です',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  // ユーザー検索
  const user = users.find(u => u.email === email);
  if (!user || user.password !== password) {
    return res.status(401).json({
      error: {
        message: 'メールアドレスまたはパスワードが間違っています',
        code: 'AUTHENTICATION_ERROR'
      }
    });
  }

  // ログイン時刻更新
  user.lastLoginAt = new Date().toISOString();
  console.log(`✅ User logged in: ${email}`);

  // 簡易トークン生成
  const token = `token-${user.id}`;

  res.json({
    message: 'ログインしました',
    user: {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      representativeName: user.representativeName,
      phone: user.phone,
      address: user.address,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt
    },
    token
  });
});

// GET /api/auth/me - 現在のユーザー情報
app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      companyName: req.user.companyName,
      representativeName: req.user.representativeName,
      phone: req.user.phone,
      address: req.user.address,
      createdAt: req.user.createdAt,
      lastLoginAt: req.user.lastLoginAt
    }
  });
});

// ===== ユーザー管理API =====

// PUT /api/users/profile - プロフィール更新
app.put('/api/users/profile', authenticate, (req, res) => {
  const { companyName, representativeName, phone, address } = req.body;
  
  // ユーザー更新
  const user = req.user;
  if (companyName !== undefined) user.companyName = companyName;
  if (representativeName !== undefined) user.representativeName = representativeName;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  user.updatedAt = new Date().toISOString();

  console.log(`✅ Profile updated for user: ${user.email}`);

  res.json({
    message: 'プロフィールを更新しました',
    user: {
      id: user.id,
      email: user.email,
      companyName: user.companyName,
      representativeName: user.representativeName,
      phone: user.phone,
      address: user.address,
      updatedAt: user.updatedAt
    }
  });
});

// GET /api/users/stats - ダッシュボード統計
app.get('/api/users/stats', authenticate, (req, res) => {
  const userApps = applications.filter(app => app.userId === req.user.id);
  
  const stats = {
    totalApplications: userApps.length,
    submittedApplications: userApps.filter(app => app.status === 'SUBMITTED').length,
    approvedApplications: userApps.filter(app => app.result === 'APPROVED').length,
    rejectedApplications: userApps.filter(app => app.result === 'REJECTED').length,
    totalAiUsage: userApps.length * 2, // Mock AI usage
    recentActivity: userApps.slice(-5).map(app => ({
      id: app.id,
      title: app.projectTitle,
      status: app.status,
      updatedAt: app.updatedAt
    }))
  };

  res.json({ stats });
});

// ===== 申請書管理API =====

// GET /api/applications - 申請書一覧
app.get('/api/applications', authenticate, (req, res) => {
  const userApps = applications
    .filter(app => app.userId === req.user.id)
    .map(app => ({
      id: app.id,
      projectTitle: app.projectTitle,
      status: app.status,
      result: app.result,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      subsidyProgramId: app.subsidyProgramId
    }));

  res.json({ 
    applications: userApps,
    total: userApps.length 
  });
});

// POST /api/applications - 申請書作成
app.post('/api/applications', authenticate, (req, res) => {
  const { 
    projectTitle, 
    subsidyProgramId, 
    businessPlan, 
    requestedAmount 
  } = req.body;
  
  if (!projectTitle || !subsidyProgramId || !businessPlan) {
    return res.status(400).json({
      error: {
        message: '必須フィールドが不足しています',
        code: 'VALIDATION_ERROR'
      }
    });
  }

  const application = {
    id: String(appIdCounter++),
    userId: req.user.id,
    projectTitle,
    subsidyProgramId,
    businessPlan,
    requestedAmount: requestedAmount || 0,
    status: 'DRAFT',
    result: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  applications.push(application);
  console.log(`✅ Application created: ${projectTitle} by ${req.user.email}`);

  res.status(201).json({
    message: '申請書を作成しました',
    application
  });
});

// GET /api/applications/:id - 申請書詳細
app.get('/api/applications/:id', authenticate, (req, res) => {
  const application = applications.find(
    app => app.id === req.params.id && app.userId === req.user.id
  );

  if (!application) {
    return res.status(404).json({
      error: {
        message: '申請書が見つかりません',
        code: 'NOT_FOUND_ERROR'
      }
    });
  }

  res.json({ application });
});

// PUT /api/applications/:id - 申請書更新
app.put('/api/applications/:id', authenticate, (req, res) => {
  const application = applications.find(
    app => app.id === req.params.id && app.userId === req.user.id
  );

  if (!application) {
    return res.status(404).json({
      error: {
        message: '申請書が見つかりません',
        code: 'NOT_FOUND_ERROR'
      }
    });
  }

  // 更新可能フィールド
  const { projectTitle, businessPlan, requestedAmount, status } = req.body;
  
  if (projectTitle !== undefined) application.projectTitle = projectTitle;
  if (businessPlan !== undefined) application.businessPlan = businessPlan;
  if (requestedAmount !== undefined) application.requestedAmount = requestedAmount;
  if (status !== undefined) application.status = status;
  application.updatedAt = new Date().toISOString();

  console.log(`✅ Application updated: ${application.projectTitle} by ${req.user.email}`);

  res.json({
    message: '申請書を更新しました',
    application
  });
});

// ===== AI機能API =====

// POST /api/ai/generate-business-plan - AIビジネスプラン生成
app.post('/api/ai/generate-business-plan', authenticate, async (req, res) => {
  try {
    const { projectTitle, industry, targetMarket, fundingAmount, projectDescription } = req.body;
    
    if (!projectTitle || !industry) {
      return res.status(400).json({
        error: {
          message: 'プロジェクト名と業界は必須です',
          code: 'VALIDATION_ERROR'
        }
      });
    }

    const userInput = {
      projectTitle,
      industry,
      targetMarket,
      fundingAmount,
      projectDescription,
      companyName: req.user.companyName
    };

    console.log(`🤖 AI生成開始: ${projectTitle} by ${req.user.email}`);
    const result = await aiService.generateBusinessPlan(userInput);
    
    if (result.success) {
      res.json({
        message: 'ビジネスプランを生成しました',
        businessPlan: result.businessPlan,
        usage: result.usage
      });
    } else {
      res.status(500).json({
        error: {
          message: result.error || 'AI生成に失敗しました',
          code: 'AI_GENERATION_ERROR'
        }
      });
    }
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

// POST /api/ai/improve-application - 申請書改善提案
app.post('/api/ai/improve-application/:id', authenticate, async (req, res) => {
  try {
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: {
          message: '申請書が見つかりません',
          code: 'NOT_FOUND_ERROR'
        }
      });
    }

    console.log(`🔍 AI分析開始: ${application.projectTitle} by ${req.user.email}`);
    const result = await aiService.improvementSuggestions(application);
    
    if (result.success) {
      res.json({
        message: '改善提案を生成しました',
        suggestions: JSON.parse(result.content),
        usage: result.usage
      });
    } else {
      res.status(500).json({
        error: {
          message: result.error || 'AI分析に失敗しました',
          code: 'AI_ANALYSIS_ERROR'
        }
      });
    }
  } catch (error) {
    console.error('AI improvement error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

// GET /api/ai/recommendations - 補助金プログラム推奨
app.get('/api/ai/recommendations', authenticate, async (req, res) => {
  try {
    const companyProfile = {
      companyName: req.user.companyName,
      industry: req.query.industry,
      employees: req.query.employees,
      revenue: req.query.revenue
    };

    console.log(`🎯 AI推奨開始: ${req.user.companyName}`);
    const result = await aiService.recommendSubsidyPrograms(companyProfile);
    
    if (result.success) {
      res.json({
        message: '補助金プログラムを推奨しました',
        recommendations: JSON.parse(result.content),
        usage: result.usage
      });
    } else {
      res.status(500).json({
        error: {
          message: result.error || 'AI推奨に失敗しました',
          code: 'AI_RECOMMENDATION_ERROR'
        }
      });
    }
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

// GET /api/ai/usage-stats - AI使用統計
app.get('/api/ai/usage-stats', authenticate, (req, res) => {
  const stats = aiService.getAIUsageStats();
  res.json({
    message: 'AI使用統計を取得しました',
    stats
  });
});

// ===== PDF生成API =====

// POST /api/pdf/generate/:id - 申請書PDF生成
app.post('/api/pdf/generate/:id', authenticate, async (req, res) => {
  try {
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: {
          message: '申請書が見つかりません',
          code: 'NOT_FOUND_ERROR'
        }
      });
    }

    console.log(`📄 PDF生成開始: ${application.projectTitle} by ${req.user.email}`);
    const result = await pdfService.generateApplicationPDF(application, req.user);
    
    if (result.success) {
      // レスポンスヘッダー設定
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.size);
      
      // PDFバイナリ送信
      res.send(result.buffer);
      
      console.log(`✅ PDF送信完了: ${result.filename} (${Math.round(result.size / 1024)}KB)`);
    } else {
      res.status(500).json({
        error: {
          message: result.error || 'PDF生成に失敗しました',
          code: 'PDF_GENERATION_ERROR'
        }
      });
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      }
    });
  }
});

// GET /api/pdf/preview/:id - 申請書HTMLプレビュー
app.get('/api/pdf/preview/:id', authenticate, (req, res) => {
  try {
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: {
          message: '申請書が見つかりません',
          code: 'NOT_FOUND_ERROR'
        }
      });
    }

    const html = pdfService.generateApplicationHTML(application, req.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
    console.log(`👀 HTMLプレビュー: ${application.projectTitle} by ${req.user.email}`);
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      error: {
        message: 'プレビュー生成に失敗しました',
        code: 'PREVIEW_GENERATION_ERROR'
      }
    });
  }
});

// ===== ヘルスチェック =====
app.get('/api/health', (req, res) => {
  const aiStats = aiService.getAIUsageStats();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'integration-test',
    users: users.length,
    applications: applications.length,
    ai: {
      model: 'gpt-3.5-turbo',
      totalRequests: aiStats.totalRequests,
      totalCost: `$${aiStats.totalCost}`
    },
    endpoints: {
      auth: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me'],
      users: ['PUT /api/users/profile', 'GET /api/users/stats'],
      applications: ['GET /api/applications', 'POST /api/applications', 'GET /api/applications/:id', 'PUT /api/applications/:id'],
      ai: ['POST /api/ai/generate-business-plan', 'POST /api/ai/improve-application/:id', 'GET /api/ai/recommendations'],
      pdf: ['POST /api/pdf/generate/:id', 'GET /api/pdf/preview/:id']
    }
  });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'エンドポイントが見つかりません',
      code: 'NOT_FOUND'
    }
  });
});

// サーバー起動
const server = app.listen(PORT, () => {
  console.log(`🚀 Track A + B 統合サーバー起動: http://localhost:${PORT}`);
  console.log(`📋 API一覧: http://localhost:${PORT}/api/health`);
  console.log(`🔗 フロントエンド対応: http://localhost:3000`);
  console.log('✅ 統合テスト準備完了！');
});

// グレースフルシャットダウン
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;