/**
 * ローカルテスト用APIサーバー（ファイルベースDB）
 * PostgreSQL/Redis不要でテスト可能
 */

const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const { generateToken, verifyToken } = require('./src/utils/auth');
const aiService = require('./ai-service');
const pdfService = require('./pdf-service');
const multer = require('multer');

// 簡易メール送信機能 (開発環境用)
const emailService = {
  async sendApplicationCompleteEmail(userEmail, applicationTitle) {
    console.log(`📧 メール送信 (開発モード):`);
    console.log(`   宛先: ${userEmail}`);
    console.log(`   件名: 申請書作成完了のお知らせ - ${applicationTitle}`);
    console.log(`   内容: 申請書「${applicationTitle}」の作成が完了しました。`);
    console.log(`   ダッシュボードから内容をご確認ください。`);
    return true;
  },
  
  async sendPasswordResetEmail(userEmail, resetToken) {
    console.log(`📧 パスワードリセットメール送信 (開発モード):`);
    console.log(`   宛先: ${userEmail}`);
    console.log(`   件名: パスワードリセットのご案内`);
    console.log(`   リセットトークン: ${resetToken}`);
    return true;
  }
};

const app = express();
const PORT = 3001;

// ファイルベースDB設定
const DB_DIR = path.join(__dirname, 'test-data', 'db');
const USERS_FILE = path.join(DB_DIR, 'users.json');
const APPS_FILE = path.join(DB_DIR, 'applications.json');
const SESSIONS_FILE = path.join(DB_DIR, 'sessions.json');

// ファイルアップロード設定
const UPLOAD_DIR = path.join(__dirname, 'test-data', 'uploads');
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      await fs.access(UPLOAD_DIR);
    } catch {
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ 
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('許可されていないファイル形式です'), false);
    }
  }
});

// 基本ミドルウェア
// CORS設定
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

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

// 認証ミドルウェア（JWT版）
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'アクセストークンが必要です' }
      });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: { message: 'トークンが無効です' }
      });
    }

    // データベースからユーザー情報を取得
    const users = await readDB(USERS_FILE);
    const user = users.find(u => u.id === decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'ユーザーが見つかりません' }
      });
    }

    req.user = { ...decoded, userData: user };
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { message: '認証に失敗しました' }
    });
  }
};

// ===== 認証API =====
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, companyName, name, phone } = req.body;
    
    if (!email || !password || !companyName || !name) {
      return res.status(400).json({
        success: false,
        error: { message: '必須フィールドが不足しています' }
      });
    }

    const users = await readDB(USERS_FILE);
    if (users.find(u => u.email === email)) {
      return res.status(409).json({
        success: false,
        error: { message: 'このメールアドレスは既に登録されています' }
      });
    }

    // パスワードハッシュ化
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      id: String(userIdCounter++),
      email, 
      password: hashedPassword, 
      companyName, 
      representativeName: name,
      phone: phone || null, 
      address: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    };
    
    users.push(user);
    await writeDB(USERS_FILE, users);

    const token = generateToken(user);
    console.log(`✅ ユーザー登録: ${email}`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.representativeName,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'サーバーエラーが発生しました' }
    });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'メールアドレスとパスワードを入力してください' }
      });
    }

    const users = await readDB(USERS_FILE);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'メールアドレスまたはパスワードが間違っています' }
      });
    }

    // パスワード検証（ハッシュ化されていない場合は平文比較）
    const isValidPassword = user.password.startsWith('$2b$') 
      ? await bcrypt.compare(password, user.password)
      : user.password === password;
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: { message: 'メールアドレスまたはパスワードが間違っています' }
      });
    }

    const token = generateToken(user);
    
    // ログイン時刻更新
    user.lastLoginAt = new Date().toISOString();
    await writeDB(USERS_FILE, users);

    console.log(`✅ ログイン: ${email}`);

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.representativeName,
        companyName: user.companyName
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'ログインに失敗しました' }
    });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const users = await readDB(USERS_FILE);
    const user = users.find(u => u.id === req.user.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'ユーザーが見つかりません' }
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.representativeName,
        companyName: user.companyName
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: '認証確認に失敗しました' }
    });
  }
});

// パスワードリセット要求
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        error: { message: 'メールアドレスが必要です' }
      });
    }

    const users = await readDB(USERS_FILE);
    const user = users.find(u => u.email === email);
    
    if (!user) {
      // セキュリティのため、存在しないメールでも成功レスポンス
      return res.json({
        success: true,
        message: 'パスワードリセットの案内をメールで送信しました'
      });
    }

    // リセットトークン生成 (実環境では暗号化が必要)
    const resetToken = Math.random().toString(36).substr(2, 15);
    
    // メール送信
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    console.log(`🔑 パスワードリセット要求: ${email}`);

    res.json({
      success: true,
      message: 'パスワードリセットの案内をメールで送信しました'
    });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'サーバーエラーが発生しました' }
    });
  }
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
    const { 
      title, 
      subsidyType, 
      companyInfo, 
      businessPlan, 
      projectDescription, 
      budget, 
      schedule, 
      expectedResults, 
      status 
    } = req.body;
    
    if (!title || !subsidyType || !businessPlan) {
      return res.status(400).json({
        success: false,
        error: { message: '必須フィールドが不足しています' }
      });
    }

    const applications = await readDB(APPS_FILE);
    
    const application = {
      id: String(appIdCounter++),
      userId: req.user.userId,
      title,
      subsidyType,
      companyInfo: companyInfo || {},
      businessPlan,
      projectDescription: projectDescription || '',
      budget: budget || '',
      schedule: schedule || '',
      expectedResults: expectedResults || '',
      status: status || 'DRAFT',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      submittedAt: null
    };

    applications.push(application);
    await writeDB(APPS_FILE, applications);

    console.log(`✅ 申請書作成: ${title} by ${req.user.userData.email}`);

    // 申請書作成完了メール送信
    try {
      await emailService.sendApplicationCompleteEmail(
        req.user.userData.email,
        title
      );
    } catch (error) {
      console.error('メール送信エラー:', error);
      // メール送信失敗でも申請書作成は継続
    }

    res.status(201).json({
      success: true,
      data: application,
      application: application  // フロントエンドの互換性のため
    });
  } catch (error) {
    console.error('Application creation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'サーバーエラーが発生しました' }
    });
  }
});

app.get('/api/applications/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.userId
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    res.json({ 
      application,
      data: application  // フロントエンドの互換性のため
    });
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
      app => app.id === req.params.id && app.userId === req.user.userId
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

// ===== ファイルアップロードAPI =====
app.post('/api/files/upload', authenticate, upload.array('files', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'ファイルが選択されていません', code: 'NO_FILES_ERROR' }
      });
    }

    const uploadedFiles = req.files.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      originalName: file.originalname,
      fileName: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date().toISOString(),
      userId: req.user.userId,
      url: `/api/files/download/${file.filename}`
    }));

    console.log(`📁 ファイルアップロード: ${uploadedFiles.length}ファイル by ${req.user.email}`);

    res.json({
      success: true,
      message: `${uploadedFiles.length}ファイルのアップロードが完了しました`,
      data: {
        files: uploadedFiles
      }
    });
  } catch (error) {
    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'ファイルアップロードに失敗しました', code: 'UPLOAD_ERROR' }
    });
  }
});

app.get('/api/files/download/:filename', (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // ファイルの存在確認
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: { message: 'ファイルが見つかりません', code: 'FILE_NOT_FOUND' }
      });
    }

    res.download(filePath);
  } catch (error) {
    console.error('File download error:', error);
    res.status(500).json({
      error: { message: 'ファイルダウンロードに失敗しました', code: 'DOWNLOAD_ERROR' }
    });
  }
});

app.delete('/api/files/:filename', authenticate, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(UPLOAD_DIR, filename);
    
    // ファイルの存在確認
    const fs = require('fs');
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        error: { message: 'ファイルが見つかりません', code: 'FILE_NOT_FOUND' }
      });
    }

    // ファイル削除
    await fs.promises.unlink(filePath);
    
    console.log(`🗑️ ファイル削除: ${filename} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'ファイルを削除しました'
    });
  } catch (error) {
    console.error('File delete error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'ファイル削除に失敗しました', code: 'DELETE_ERROR' }
    });
  }
});

// ===== PDF生成API =====
app.post('/api/pdf/generate/:id', authenticate, async (req, res) => {
  try {
    const applications = await readDB(APPS_FILE);
    const application = applications.find(
      app => app.id === req.params.id && app.userId === req.user.userId
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    console.log(`📄 PDF生成開始: ${application.title} by ${req.user.userData.email}`);
    
    // PDF serviceに適合するデータ形式に変換
    const applicationData = {
      id: application.id,
      projectTitle: application.title,
      status: application.status,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      requestedAmount: 5000000,  // デフォルト値
      ...application
    };
    
    const userData = {
      companyName: req.user.userData.companyName,
      representativeName: req.user.userData.representativeName || 'テスト太郎',
      email: req.user.userData.email,
      phone: req.user.userData.phone || '03-0000-0000',
      address: req.user.userData.address || '東京都渋谷区'
    };
    
    const result = await pdfService.generateApplicationPDF(applicationData, userData);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.setHeader('Content-Length', result.size);
      res.send(result.buffer);
      
      console.log(`✅ PDF送信完了: ${result.filename} (${Math.round(result.size / 1024)}KB)`);
    } else if (result.fallbackToHTML) {
      // HTMLプレビューにフォールバック
      res.json({
        success: false,
        fallbackToHTML: true,
        message: result.message,
        previewUrl: `/api/pdf/preview/${req.params.id}`,
        error: { message: result.error, code: 'PDF_GENERATION_ERROR' }
      });
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
      app => app.id === req.params.id && app.userId === req.user.userId
    );

    if (!application) {
      return res.status(404).json({
        error: { message: '申請書が見つかりません', code: 'NOT_FOUND_ERROR' }
      });
    }

    // PDF serviceに適合するデータ形式に変換
    const applicationData = {
      id: application.id,
      projectTitle: application.title,
      status: application.status,
      createdAt: application.createdAt,
      updatedAt: application.updatedAt,
      requestedAmount: 5000000,  // デフォルト値
      ...application
    };
    
    const userData = {
      companyName: req.user.userData.companyName,
      representativeName: req.user.userData.representativeName || 'テスト太郎',
      email: req.user.userData.email,
      phone: req.user.userData.phone || '03-0000-0000',
      address: req.user.userData.address || '東京都渋谷区'
    };
    
    const html = pdfService.generateApplicationHTML(applicationData, userData);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
    
    console.log(`👀 HTMLプレビュー: ${application.title} by ${req.user.userData.email}`);
  } catch (error) {
    console.error('Preview generation error:', error);
    res.status(500).json({
      error: { message: 'プレビュー生成に失敗しました', code: 'PREVIEW_GENERATION_ERROR' }
    });
  }
});

// ===== AI機能API =====

// 事業計画生成API
app.post('/api/ai/generate-business-plan', authenticate, async (req, res) => {
  try {
    const { companyInfo, subsidyType } = req.body;
    
    const prompt = PROMPTS.businessPlan
      .replace('{companyName}', companyInfo.companyName || 'サンプル企業')
      .replace('{industry}', companyInfo.industry || 'IT業界')
      .replace('{employeeCount}', companyInfo.employeeCount || '10名')
      .replace('{businessDescription}', companyInfo.businessDescription || 'システム開発')
      .replace('{subsidyType}', subsidyType || '小規模事業者持続化補助金');

    const result = await aiService.makeAIRequest(prompt);
    
    res.json({
      success: true,
      data: {
        content: result.content,
        metadata: {
          processingTime: result.processingTime,
          timestamp: result.timestamp,
          mock: result.mock || false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'AI生成に失敗しました' }
    });
  }
});

// 申請書内容生成API
app.post('/api/ai/generate-application-content', authenticate, async (req, res) => {
  try {
    const { section, companyInfo, businessPlan, subsidyType } = req.body;
    
    const prompt = PROMPTS.applicationContent
      .replace('{section}', section)
      .replace('{companyInfo}', JSON.stringify(companyInfo))
      .replace('{businessPlan}', businessPlan)
      .replace('{subsidyType}', subsidyType);

    const result = await aiService.makeAIRequest(prompt);
    
    res.json({
      success: true,
      data: {
        content: result.content,
        section,
        metadata: {
          processingTime: result.processingTime,
          timestamp: result.timestamp,
          mock: result.mock || false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: 'AI生成に失敗しました' }
    });
  }
});

// 採択率予測API
app.post('/api/ai/predict-approval-rate', authenticate, async (req, res) => {
  try {
    const { applicationContent, subsidyType } = req.body;
    
    const prompt = PROMPTS.approvalPrediction
      .replace('{applicationContent}', applicationContent)
      .replace('{subsidyType}', subsidyType);

    const result = await aiService.makeAIRequest(prompt);
    
    // JSON形式のレスポンスをパース
    let prediction;
    try {
      prediction = JSON.parse(result.content);
    } catch (e) {
      // パースに失敗した場合のフォールバック
      prediction = {
        totalScore: 75,
        breakdown: {
          feasibility: 78,
          viability: 72,
          effectiveness: 76,
          budget: 74
        },
        suggestions: [
          "より具体的な数値目標を設定してください",
          "実施スケジュールを詳細化してください"
        ]
      };
    }
    
    res.json({
      success: true,
      data: {
        prediction,
        metadata: {
          processingTime: result.processingTime,
          timestamp: result.timestamp,
          mock: result.mock || false
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: { message: '採択率予測に失敗しました' }
    });
  }
});

// プロンプトテンプレート定義
const PROMPTS = {
  businessPlan: `あなたは補助金申請書作成の専門家です。以下の企業情報を基に、効果的な事業計画を作成してください。

企業情報:
- 会社名: {companyName}
- 業界: {industry}
- 従業員数: {employeeCount}
- 事業内容: {businessDescription}
- 申請する補助金: {subsidyType}

以下の観点で事業計画を作成してください:
1. 現状の課題
2. 解決策
3. 期待される効果
4. 実施スケジュール
5. 予算計画

採択されやすい具体的で説得力のある内容で、800-1200文字程度で作成してください。`,

  applicationContent: `補助金申請書の{section}部分を作成してください。

企業情報: {companyInfo}
事業計画: {businessPlan}
補助金タイプ: {subsidyType}

{section}として適切な内容を、採択されやすい観点で400-600文字で作成してください。`,

  approvalPrediction: `以下の申請書内容の採択可能性を分析してください。

申請内容:
{applicationContent}

補助金タイプ: {subsidyType}

以下の観点で100点満点で評価し、改善提案も含めてください:
1. 事業の妥当性 (25点)
2. 実現可能性 (25点) 
3. 効果の明確性 (25点)
4. 予算の妥当性 (25点)

評価結果をJSON形式で返してください:
{
  "totalScore": 点数,
  "breakdown": {
    "feasibility": 点数,
    "viability": 点数,
    "effectiveness": 点数,
    "budget": 点数
  },
  "suggestions": ["改善提案1", "改善提案2", "改善提案3"]
}`
};

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
        auth: ['POST /api/auth/login', 'POST /api/auth/register', 'GET /api/auth/me', 'POST /api/auth/forgot-password'],
        users: ['PUT /api/users/profile', 'GET /api/users/stats'],
        applications: ['GET /api/applications', 'POST /api/applications', 'GET /api/applications/:id', 'PUT /api/applications/:id'],
        ai: ['POST /api/ai/generate-business-plan', 'POST /api/ai/improve-application/:id', 'GET /api/ai/recommendations'],
        pdf: ['POST /api/pdf/generate/:id', 'GET /api/pdf/preview/:id'],
        files: ['POST /api/files/upload', 'GET /api/files/download/:filename', 'DELETE /api/files/:filename']
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
