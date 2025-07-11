/**
 * テスト用サーバー - UI検証用
 */

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = 3001;
const prisma = new PrismaClient();

// 環境変数設定
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-for-testing-only';

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
    const { email, password, companyName, representativeName, businessType, foundedYear, employeeCount } = req.body;
    
    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        error: { message: 'このメールアドレスは既に登録されています' }
      });
    }
    
    // パスワードハッシュ化
    const passwordHash = await bcrypt.hash(password, 12);
    
    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        companyName,
        representativeName,
        businessType,
        foundedYear,
        employeeCount,
        role: 'USER',
        status: 'ACTIVE',
      },
      select: {
        id: true,
        email: true,
        companyName: true,
        representativeName: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    
    // JWTトークン生成
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      success: true,
      message: 'ユーザー登録が完了しました',
      user,
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
    const { email, password } = req.body;
    
    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        companyName: true,
        representativeName: true,
        role: true,
        status: true,
      }
    });
    
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
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: { message: '認証トークンが必要です' }
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        companyName: true,
        representativeName: true,
        businessType: true,
        foundedYear: true,
        employeeCount: true,
        role: true,
        status: true,
        createdAt: true,
      }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: { message: 'ユーザーが見つかりません' }
      });
    }
    
    res.json({
      success: true,
      data: { user }
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
app.post('/api/applications', async (req, res) => {
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
    
    const application = await prisma.application.create({
      data: {
        userId,
        subsidyProgramId: req.body.subsidyProgramId,
        title: req.body.projectTitle,
        status: 'GENERATING',
        inputData: JSON.stringify(req.body),
        progress: 0,
      },
    });
    
    // 模擬AI生成（即座にCOMPLETEDに変更）
    setTimeout(async () => {
      await prisma.application.update({
        where: { id: application.id },
        data: {
          status: 'COMPLETED',
          progress: 100,
          generatedContent: JSON.stringify({
            sections: {
              companyOverview: '【企業概要】サンプルテキスト...',
              projectDescription: '【事業内容】サンプルテキスト...',
              marketAnalysis: '【市場分析】サンプルテキスト...',
            }
          }),
          estimatedScore: 85,
          wordCount: 3500,
        },
      });
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
app.get('/api/applications', async (req, res) => {
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
    
    const applications = await prisma.application.findMany({
      where: { userId },
      include: {
        subsidyProgram: {
          select: {
            name: true,
            category: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    res.json({
      success: true,
      data: { applications }
    });
    
  } catch (error) {
    console.error('Applications fetch error:', error);
    res.status(500).json({
      success: false,
      error: { message: '申請書一覧の取得に失敗しました' }
    });
  }
});

// 補助金プログラム一覧
app.get('/api/applications/subsidy-programs', async (req, res) => {
  try {
    const programs = await prisma.subsidyProgram.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        category: true,
        maxAmount: true,
        description: true,
        requirements: true,
        applicationEnd: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    
    res.json({
      success: true,
      data: programs
    });
    
  } catch (error) {
    console.error('Subsidy programs fetch error:', error);
    res.status(500).json({
      success: false,
      error: { message: '補助金プログラムの取得に失敗しました' }
    });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'ai-subsidy-test-backend',
    environment: 'test',
    features: {
      lowCostAI: true,
      gpt35Support: true,
      testLogin: true,
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
  console.log(`🚀 テスト用バックエンドサーバー起動`);
  console.log(`📡 ポート: ${PORT}`);
  console.log(`🧪 環境: テスト用`);
  console.log(`💰 低コストAI対応済み`);
  console.log(`\n🔗 テスト用エンドポイント:`);
  console.log(`   ヘルスチェック: http://localhost:${PORT}/api/health`);
  console.log(`   ユーザー登録: POST http://localhost:${PORT}/api/auth/register`);
  console.log(`   ログイン: POST http://localhost:${PORT}/api/auth/login`);
  
  // データベース接続テスト
  prisma.$queryRaw`SELECT 1`
    .then(() => console.log('✅ データベース接続成功'))
    .catch((err) => console.error('❌ データベース接続失敗:', err));
});