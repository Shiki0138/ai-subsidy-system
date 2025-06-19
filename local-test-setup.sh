#!/bin/bash

# ローカルテスト環境セットアップ（Docker不要版）

set -e

echo "🚀 AI補助金システム - ローカルテスト環境セットアップ（Docker不要版）"

# 色付きログ出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 現在のサーバーを停止
log_info "既存のサーバーを停止中..."
pkill -f node 2>/dev/null || true

# バックエンドディレクトリに移動
cd backend

# 環境変数設定
log_info "テスト環境変数設定中..."
cp .env.test .env 2>/dev/null || true

# Node.js依存関係確認
log_info "Node.js依存関係確認中..."
if [ ! -d "node_modules" ]; then
    log_info "依存関係をインストール中..."
    npm install
fi

# 簡易ファイルベースDBディレクトリ作成
log_info "ローカルテスト用データディレクトリ作成中..."
mkdir -p ./test-data/db
mkdir -p ./test-data/uploads
mkdir -p ./test-data/pdfs

# テスト用データベースAPIサーバー作成
log_info "ファイルベースDB付きテストサーバーを作成中..."

cat > test-local-api.js << 'EOF'
/**
 * ローカルテスト用APIサーバー（ファイルベースDB）
 * PostgreSQL/Redis不要でテスト可能
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const aiService = require('./ai-service');
const pdfService = require('./pdf-service');

const app = express();
const PORT = 3001;

// ファイルベースDB設定
const DB_DIR = path.join(__dirname, 'test-data', 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const APPS_FILE = path.join(DB_DIR, 'applications.json');
const SESSIONS_FILE = path.join(DB_DIR, 'sessions.json');

// 基本ミドルウェア
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// ファイルベースDB関数
async function readDB(file) {
  try {
    const data = await fs.readFile(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function writeDB(file, data) {
  await fs.writeFile(file, JSON.stringify(data, null, 2));
}

async function initDB() {
  try {
    await fs.access(DB_DIR);
  } catch {
    await fs.mkdir(DB_DIR, { recursive: true });
  }
  
  // 初期ファイル作成
  if (!(await fileExists(USERS_FILE))) await writeDB(USERS_FILE, []);
  if (!(await fileExists(APPS_FILE))) await writeDB(APPS_FILE, []);
  if (!(await fileExists(SESSIONS_FILE))) await writeDB(SESSIONS_FILE, []);
}

async function fileExists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

// カウンター管理
let userIdCounter = 1;
let appIdCounter = 1;

// 認証ミドルウェア（簡易版）
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: '認証が必要です', code: 'AUTHENTICATION_ERROR' }
    });
  }

  const token = authHeader.substring(7);
  const users = await readDB(USERS_FILE);
  const user = users.find(u => `token-${u.id}` === token);
  
  if (!user) {
    return res.status(401).json({
      error: { message: 'ユーザーが見つかりません', code: 'AUTHENTICATION_ERROR' }
    });
  }
  
  req.user = user;
  next();
};

// ===== 認証API =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName, representativeName, phone } = req.body;
    
    if (!email || !password || !companyName || !representativeName) {
      return res.status(400).json({
        error: { message: '必須フィールドが不足しています', code: 'VALIDATION_ERROR' }
      });
    }

    const users = await readDB(USERS_FILE);
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        error: { message: 'このメールアドレスは既に登録されています', code: 'CONFLICT_ERROR' }
      });
    }

    const user = {
      id: String(userIdCounter++),
      email, password, companyName, representativeName,
      phone: phone || null, address: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };
    
    users.push(user);
    await writeDB(USERS_FILE, users);

    const token = `token-${user.id}`;
    console.log(`✅ ユーザー登録: ${email}`);

    res.status(201).json({
      message: 'ユーザー登録が完了しました',
      user: { ...user, password: undefined },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: { message: 'メールアドレスとパスワードが必要です', code: 'VALIDATION_ERROR' }
      });
    }

    const users = await readDB(USERS_FILE);
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        error: { message: 'メールアドレスまたはパスワードが間違っています', code: 'AUTHENTICATION_ERROR' }
      });
    }

    user.lastLoginAt = new Date().toISOString();
    await writeDB(USERS_FILE, users);

    const token = `token-${user.id}`;
    console.log(`✅ ログイン: ${email}`);

    res.json({
      message: 'ログインしました',
      user: { ...user, password: undefined },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  const { password, ...userWithoutPassword } = req.user;
  res.json({ user: userWithoutPassword });
});

// ===== ユーザー管理API =====
app.put('/api/users/profile', authenticate, async (req, res) => {
  try {
    const { companyName, representativeName, phone, address } = req.body;
    
    const users = await readDB(USERS_FILE);
    const userIndex = users.findIndex(u => u.id === req.user.id);
    
    if (userIndex === -1) {
      return res.status(404).json({
        error: { message: 'ユーザーが見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    const user = users[userIndex];
    if (companyName !== undefined) user.companyName = companyName;
    if (representativeName !== undefined) user.representativeName = representativeName;
    if (phone !== undefined) user.phone = phone;
    if (address !== undefined) user.address = address;
    user.updatedAt = new Date().toISOString();

    users[userIndex] = user;
    await writeDB(USERS_FILE, users);

    console.log(`✅ プロフィール更新: ${user.email}`);

    const { password, ...userWithoutPassword } = user;
    res.json({
      message: 'プロフィールを更新しました',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.get('/api/users/stats', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const userApps = applications.filter(app => app.userId === req.user.id);
    
    const stats = {
      totalApplications: userApps.length,
      submittedApplications: userApps.filter(app => app.status === 'SUBMITTED').length,
      approvedApplications: userApps.filter(app => app.result === 'APPROVED').length,
      rejectedApplications: userApps.filter(app => app.result === 'REJECTED').length,
      totalAiUsage: userApps.length * 2,
      recentActivity: userApps.slice(-5).map(app => ({
        id: app.id, title: app.projectTitle,
        status: app.status, updatedAt: app.updatedAt
      }))
    };

    res.json({ stats });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

// ===== 申請書管理API =====
app.get('/api/applications', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const userApps = applications
      .filter(app => app.userId === req.user.id)
      .map(app => ({
        id: app.id, projectTitle: app.projectTitle,
        status: app.status, result: app.result,
        createdAt: app.createdAt, updatedAt: app.updatedAt,
        subsidyProgramId: app.subsidyProgramId
      }));

    res.json({ applications: userApps, total: userApps.length });
  } catch (error) {
    console.error('Applications list error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.post('/api/applications', authenticate, async (req, res) => {
  try {
    const { projectTitle, subsidyProgramId, businessPlan, requestedAmount } = req.body;
    
    if (!projectTitle || !subsidyProgramId || !businessPlan) {
      return res.status(400).json({
        error: { message: '必須フィールドが不足しています', code: 'VALIDATION_ERROR' }
      });
    }

    const applications = await readDB(APPS_FILE);
    
    const application = {
      id: String(appIdCounter++),
      userId: req.user.id,
      projectTitle, subsidyProgramId, businessPlan,
      requestedAmount: requestedAmount || 0,
      status: 'DRAFT', result: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    applications.push(application);
    await writeDB(APPS_FILE, applications);

    console.log(`✅ 申請書作成: ${projectTitle} by ${req.user.email}`);

    res.status(201).json({
      message: '申請書を作成しました',
      application
    });
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.get('/api/applications/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    res.json({ application });
  } catch (error) {
    console.error('Application detail error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.put('/api/applications/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const appIndex = applications.findIndex(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (appIndex === -1) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    const { projectTitle, businessPlan, requestedAmount, status } = req.body;
    const application = applications[appIndex];
    
    if (projectTitle !== undefined) application.projectTitle = projectTitle;
    if (businessPlan !== undefined) application.businessPlan = businessPlan;
    if (requestedAmount !== undefined) application.requestedAmount = requestedAmount;
    if (status !== undefined) application.status = status;
    application.updatedAt = new Date().toISOString();

    applications[appIndex] = application;
    await writeDB(APPS_FILE, applications);

    console.log(`✅ 申請書更新: ${application.projectTitle} by ${req.user.email}`);

    res.json({
      message: '申請書を更新しました',
      application
    });
  } catch (error) {
    console.error('Application update error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

// ===== AI機能API =====
app.post('/api/ai/generate-business-plan', authenticate, async (req, res) => {
  try {
    const { projectTitle, industry, targetMarket, fundingAmount, projectDescription } = req.body;
    
    if (!projectTitle || !industry) {
      return res.status(400).json({
        error: { message: 'プロジェクト名と業界は必須です', code: 'VALIDATION_ERROR' }
      });
    }

    const userInput = {
      projectTitle, industry, targetMarket, fundingAmount, projectDescription,
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
        error: { message: result.error || 'AI生成に失敗しました', code: 'AI_GENERATION_ERROR' }
      });
    }
  } catch (error) {
    console.error('AI generation error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.post('/api/ai/improve-application/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
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
        error: { message: result.error || 'AI分析に失敗しました', code: 'AI_ANALYSIS_ERROR' }
      });
    }
  } catch (error) {
    console.error('AI improvement error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

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
        error: { message: result.error || 'AI推奨に失敗しました', code: 'AI_RECOMMENDATION_ERROR' }
      });
    }
  } catch (error) {
    console.error('AI recommendation error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.get('/api/ai/usage-stats', authenticate, (req, res) => {
  const stats = aiService.getAIUsageStats();
  res.json({ message: 'AI使用統計を取得しました', stats });
});

// ===== PDF生成API =====
app.post('/api/pdf/generate/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    console.log(`📄 PDF生成開始: ${application.projectTitle} by ${req.user.email}`);
    const result = await pdfService.generateApplicationPDF(application, req.user);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.size);
      res.send(result.buffer);
      
      console.log(`✅ PDF送信完了: ${result.filename} (${Math.round(result.size / 1024)}KB)`);
    } else {
      res.status(500).json({
        error: { message: result.error || 'PDF生成に失敗しました', code: 'PDF_GENERATION_ERROR' }
      });
    }
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({
      error: { message: 'サーバーエラーが発生しました', code: 'INTERNAL_SERVER_ERROR' }
    });
  }
});

app.get('/api/pdf/preview/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.id
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    const html = pdfService.generateApplicationHTML(application, req.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
    console.log(`👀 HTMLプレビュー: ${application.projectTitle} by ${req.user.email}`);
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      error: { message: 'プレビュー生成に失敗しました', code: 'PREVIEW_GENERATION_ERROR' }
    });
  }
});

// ===== ヘルスチェック =====
app.get('/api/health', async (req, res) => {
  try {
    const users = await readDB(USERS_FILE);
    const applications = await readDB(APPS_FILE);
    const aiStats = aiService.getAIUsageStats();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: 'local-test',
      database: 'file-based',
      users: users.length,
      applications: applications.length,
      ai: {
        model: 'gpt-3.5-turbo (mock)',
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
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      error: { message: 'ヘルスチェックに失敗しました', code: 'HEALTH_CHECK_ERROR' }
    });
  }
});

// 404ハンドラー
app.use('*', (req, res) => {
  res.status(404).json({
    error: { message: 'エンドポイントが見つかりません', code: 'NOT_FOUND' }
  });
});

// 初期化とサーバー起動
async function startServer() {
  try {
    await initDB();
    
    const server = app.listen(PORT, () => {
      console.log(`🚀 ローカルテストサーバー起動: http://localhost:${PORT}`);
      console.log(`📋 API一覧: http://localhost:${PORT}/api/health`);
      console.log(`🔗 フロントエンド対応: http://localhost:3000`);
      console.log(`💾 データベース: ファイルベース (${DB_DIR})`);
      console.log('✅ ローカルテスト環境準備完了！');
    });

    // グレースフルシャットダウン
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      server.close(() => {
        console.log('Server closed');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Server startup error:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
EOF

log_success "ローカルテストサーバー作成完了"

cd ..

# テスト実行スクリプト作成
log_info "テスト実行スクリプト作成中..."

cat > run-local-test.sh << 'EOF'
#!/bin/bash

echo "🧪 ローカルテスト実行開始"

# 既存サーバー停止
pkill -f node 2>/dev/null || true

# バックエンドディレクトリに移動
cd backend

# テストサーバー起動（バックグラウンド）
echo "🚀 ローカルテストサーバー起動中..."
node test-local-api.js &
SERVER_PID=$!

# サーバー起動待機
sleep 3

# テスト実行
echo "🧪 統合テスト実行中..."
cd ..
node ai-pdf-test.js

# サーバー停止
echo "🛑 テストサーバー停止中..."
kill $SERVER_PID 2>/dev/null || true

echo "✅ ローカルテスト完了"
EOF

chmod +x run-local-test.sh

log_success "テスト実行スクリプト作成完了"

echo ""
echo "🎉 ローカルテスト環境セットアップ完了（Docker不要版）！"
echo ""
echo "📊 利用可能な機能:"
echo "  📁 ファイルベースデータベース"
echo "  🤖 AIモック機能（GPT-3.5-turbo）"
echo "  📄 PDF生成機能"
echo "  🔐 認証・セッション管理"
echo "  📱 フロントエンド連携対応"
echo ""
echo "🔧 使用方法:"
echo "  手動サーバー起動: cd backend && node test-local-api.js"
echo "  自動テスト実行: ./run-local-test.sh"
echo "  フロントエンド起動: cd frontend && npm run dev"
echo ""
echo "📝 データ保存場所: backend/test-data/db/"
echo "📋 ヘルスチェック: http://localhost:3001/api/health"
echo ""

log_success "セットアップ完了 - ローカルテストを開始できます！"