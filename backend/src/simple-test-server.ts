/**
 * 簡易テストサーバー - UIテスト用
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
const PORT = 3001;

// 環境変数設定
process.env.JWT_SECRET = 'your-super-secret-jwt-key-for-testing-only-12345678901234567890';

// メモリ内データストア（テスト用）
const users: any[] = [];
const applications: any[] = [];
const subsidyPrograms = [
  {
    id: 'jizokukahojokin',
    name: '小規模事業者持続化補助金',
    category: '一般型',
    maxAmount: 500000,
    description: '販路開拓・業務効率化の取組を支援',
    requirements: ['従業員数20人以下', '商工会議所の事業支援計画書が必要'],
  },
  {
    id: 'itdounyu',
    name: 'IT導入補助金',
    category: 'デジタル化基盤導入類型',
    maxAmount: 4500000,
    description: 'ITツール導入による業務効率化支援',
    requirements: ['中小企業・小規模事業者', 'IT導入支援事業者による申請'],
  },
  {
    id: 'monodukuri',
    name: 'ものづくり補助金',
    category: '一般・グローバル展開型',
    maxAmount: 10000000,
    description: '革新的な製品・サービス開発支援',
    requirements: ['認定支援機関の事業計画策定支援', '3～5年の事業計画策定'],
  },
];

app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());

// ログミドルウェア
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  next();
});

// ===== 認証API =====

// ユーザー登録
app.post('/api/auth/register', async (req, res) => {
  try {
    console.log('Registration request:', req.body);
    
    const { email, password, companyName, representativeName, businessType, foundedYear, employeeCount } = req.body;
    
    // 既存ユーザーチェック
    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: { message: 'このメールアドレスは既に登録されています' }
      });
    }
    
    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);
    
    // ユーザー作成
    const user = {
      id: `user-${Date.now()}`,
      email,
      passwordHash,
      companyName,
      representativeName,
      businessType,
      foundedYear,
      employeeCount,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
    };
    
    users.push(user);
    
    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    // レスポンス用ユーザー情報（パスワードハッシュを除外）
    const { passwordHash: _, ...userResponse } = user;
    
    console.log('User registered successfully:', userResponse);
    
    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました',
      user: userResponse,
      token,
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'ユーザー登録に失敗しました' }
    });
  }
});

// ログイン
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Login request:', req.body);
    
    const { email, password } = req.body;
    
    // ユーザー検索
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'メールアドレスまたはパスワードが正しくありません' }
      });
    }
    
    // パスワード検証
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'メールアドレスまたはパスワードが正しくありません' }
      });
    }
    
    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    // レスポンスデータ（パスワードハッシュを除外）
    const { passwordHash, ...userResponse } = user;
    
    console.log('User logged in successfully:', userResponse);
    
    res.json({
      success: true,
      message: 'ログインが成功しました',
      user: userResponse,
      token,
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'ログインに失敗しました' }
    });
  }
});

// ユーザー情報取得
app.get('/api/auth/me', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '認証トークンが必要です' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'ユーザーが見つかりません' }
      });
    }
    
    const { passwordHash, ...userResponse } = user;
    
    res.json({
      success: true,
      user: userResponse
    });
    
  } catch (error) {
    console.error('User fetch error:', error);
    res.status(401).json({
      success: false,
      error: { message: '無効な認証トークンです' }
    });
  }
});

// ===== 申請書API =====

// 申請書作成
app.post('/api/applications', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '認証が必要です' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    
    const application = {
      id: `app-${Date.now()}`,
      userId,
      subsidyProgramId: req.body.subsidyProgramId,
      title: req.body.projectTitle,
      status: 'GENERATING',
      inputData: JSON.stringify(req.body),
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    applications.push(application);
    
    // 模擬AI生成（3秒後にCOMPLETEDに変更）
    setTimeout(() => {
      const app = applications.find(a => a.id === application.id);
      if (app) {
        app.status = 'COMPLETED';
        app.progress = 100;
        app.generatedContent = JSON.stringify({
          sections: {
            companyOverview: '【企業概要】AI補助金テスト株式会社は、最先端のIT技術を活用した革新的なソリューションを提供する企業です。豊富な実績と専門知識を持つチームが、お客様のデジタル変革を強力にサポートしています。',
            projectDescription: '【事業内容】本事業では、AIを活用した業務効率化システムの開発・導入を行います。従来の手作業による処理を自動化し、生産性の大幅な向上を実現します。',
            marketAnalysis: '【市場分析】デジタル化が急速に進む現在、AI技術への需要は年々増加しており、市場規模は今後も拡大が予想されます。当社の技術力により、競合他社との差別化を図ります。',
          }
        });
        app.estimatedScore = 85;
        app.wordCount = 3500;
        app.updatedAt = new Date().toISOString();
        console.log('AI generation completed for application:', application.id);
      }
    }, 3000);
    
    res.json({
      success: true,
      message: 'AI申請書生成を開始しました',
      data: {
        applicationId: application.id,
        status: 'GENERATING',
      }
    });
    
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      error: { message: '申請書の作成に失敗しました' }
    });
  }
});

// 申請書一覧取得
app.get('/api/applications', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '認証が必要です' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    
    const userApplications = applications
      .filter(app => app.userId === userId)
      .map(app => ({
        ...app,
        subsidyProgram: subsidyPrograms.find(p => p.id === app.subsidyProgramId) || {
          name: '不明な補助金プログラム',
          category: '不明',
        }
      }));
    
    res.json({
      success: true,
      data: {
        applications: userApplications
      }
    });
    
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({
      success: false,
      error: { message: '申請書一覧の取得に失敗しました' }
    });
  }
});

// 申請書詳細取得
app.get('/api/applications/:id', (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '認証が必要です' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const userId = decoded.userId;
    const applicationId = req.params.id;
    
    const application = applications.find(app => app.id === applicationId && app.userId === userId);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        error: { message: '申請書が見つかりません' }
      });
    }
    
    const subsidyProgram = subsidyPrograms.find(p => p.id === application.subsidyProgramId);
    
    res.json({
      success: true,
      data: {
        ...application,
        subsidyProgram
      }
    });
    
  } catch (error) {
    console.error('Application fetch error:', error);
    res.status(500).json({
      success: false,
      error: { message: '申請書の取得に失敗しました' }
    });
  }
});

// 補助金プログラム一覧
app.get('/api/applications/subsidy-programs', (req, res) => {
  res.json({
    success: true,
    data: subsidyPrograms
  });
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ai-subsidy-simple-test-backend',
    environment: 'test',
    features: {
      lowCostAI: true,
      gpt35Support: true,
      testLogin: true,
      memoryStorage: true,
    },
    stats: {
      registeredUsers: users.length,
      applications: applications.length,
    }
  });
});

// 404ハンドラー
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: { message: `ルート ${req.originalUrl} が見つかりません` }
  });
});

// エラーハンドラー
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: { message: 'サーバーエラーが発生しました' }
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 簡易テスト用バックエンドサーバー起動`);
  console.log(`📡 ポート: ${PORT}`);
  console.log(`🧪 環境: メモリ内データストア`);
  console.log(`💰 低コストAI対応済み`);
  console.log(`\n🔗 テスト用エンドポイント:`);
  console.log(`   ヘルスチェック: http://localhost:${PORT}/api/health`);
  console.log(`   ユーザー登録: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   ログイン: POST http://localhost:${PORT}/api/auth/login`);
  console.log(`\n🧪 テスト用アカウント情報:`);
  console.log(`   メール: test@ai-subsidy.com`);
  console.log(`   パスワード: Test123!@#`);
  console.log(`   会社名: AI補助金テスト株式会社`);
});