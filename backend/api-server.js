/**
 * Track A + B 統合用 API サーバー
 * フロントエンド統合テスト用の実装
 */

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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

// JWT秘密鍵（テスト用）
const JWT_SECRET = 'test-secret-key-for-integration';

// 認証ミドルウェア
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: {
        message: '認証が必要です',
        code: 'AUTHENTICATION_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 401
    });
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'ユーザーが見つかりません',
          code: 'AUTHENTICATION_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 401
      });
    }
    
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: {
        message: '無効なトークンです',
        code: 'AUTHENTICATION_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 401
    });
  }
};

// ===== 認証API =====

// POST /api/auth/register - 新規登録
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName, representativeName, phone } = req.body;
    
    // バリデーション
    if (!email || !password || !companyName || !representativeName) {
      return res.status(400).json({
        error: {
          message: '必須フィールドが不足しています',
          code: 'VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 400
      });
    }

    // メール重複チェック
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        error: {
          message: 'このメールアドレスは既に登録されています',
          code: 'CONFLICT_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 409
      });
    }

    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);
    
    // ユーザー作成
    const user = {
      id: String(userIdCounter++),
      email,
      passwordHash,
      companyName,
      representativeName,
      phone: phone || null,
      address: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };
    
    users.push(user);

    // JWT生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 500
    });
  }
});

// POST /api/auth/login - ログイン
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: {
          message: 'メールアドレスとパスワードが必要です',
          code: 'VALIDATION_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 400
      });
    }

    // ユーザー検索
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        error: {
          message: 'メールアドレスまたはパスワードが間違っています',
          code: 'AUTHENTICATION_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 401
      });
    }

    // パスワード確認
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          message: 'メールアドレスまたはパスワードが間違っています',
          code: 'AUTHENTICATION_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 401
      });
    }

    // ログイン時刻更新
    user.lastLoginAt = new Date().toISOString();

    // JWT生成
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 500
    });
  }
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
  try {
    const { companyName, representativeName, phone, address } = req.body;
    
    // ユーザー更新
    const user = req.user;
    if (companyName !== undefined) user.companyName = companyName;
    if (representativeName !== undefined) user.representativeName = representativeName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    user.updatedAt = new Date().toISOString();

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
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 500
    });
  }
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
  try {
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
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 400
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

    res.status(201).json({
      message: '申請書を作成しました',
      application
    });
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 500
    });
  }
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
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 404
    });
  }

  res.json({ application });
});

// PUT /api/applications/:id - 申請書更新
app.put('/api/applications/:id', authenticate, (req, res) => {
  try {
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: {
          message: '申請書が見つかりません',
          code: 'NOT_FOUND_ERROR'
        },
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method,
        statusCode: 404
      });
    }

    // 更新可能フィールド
    const { projectTitle, businessPlan, requestedAmount, status } = req.body;
    
    if (projectTitle !== undefined) application.projectTitle = projectTitle;
    if (businessPlan !== undefined) application.businessPlan = businessPlan;
    if (requestedAmount !== undefined) application.requestedAmount = requestedAmount;
    if (status !== undefined) application.status = status;
    application.updatedAt = new Date().toISOString();

    res.json({
      message: '申請書を更新しました',
      application
    });
  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({
      error: {
        message: 'サーバーエラーが発生しました',
        code: 'INTERNAL_SERVER_ERROR'
      },
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method,
      statusCode: 500
    });
  }
});

// ===== ヘルスチェック =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'integration-test',
    endpoints: {
      auth: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me'],
      users: ['PUT /api/users/profile', 'GET /api/users/stats'],
      applications: ['GET /api/applications', 'POST /api/applications', 'GET /api/applications/:id', 'PUT /api/applications/:id']
    }
  });
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: {
      message: 'エンドポイントが見つかりません',
      code: 'NOT_FOUND'
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode: 404
  });
});

// エラーハンドラー
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: {
      message: 'サーバーエラーが発生しました',
      code: 'INTERNAL_SERVER_ERROR'
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    statusCode: 500
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