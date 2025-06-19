import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { rateLimit } from 'express-rate-limit';
import { logger } from '../config/logger';
import { emailService } from '../services/emailService';

const router = express.Router();
const prisma = new PrismaClient();

// レート制限設定
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 最大5回の試行
  message: { 
    error: 'Too many authentication attempts. Please try again later.',
    retryAfter: 15 
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 3, // 最大3回のパスワードリセット要求
  message: { 
    error: 'Too many password reset requests. Please try again later.',
    retryAfter: 60 
  },
});

// バリデーションルール
const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Name is required and must be less than 100 characters'),
  body('companyName')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Company name is required and must be less than 200 characters'),
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const passwordResetRequestValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

const passwordResetValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
];

// ユーザー登録
router.post('/register', registerValidation, async (req, res) => {
  try {
    // バリデーション結果確認
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password, name, companyName } = req.body;

    // 既存ユーザーチェック
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User already exists'
      });
    }

    // パスワードハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // ユーザー作成
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
        role: 'USER',
        isActive: true,
        emailVerified: false, // 実際の運用では確認が必要
        createdAt: new Date(),
        updatedAt: new Date()
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'ai-subsidy-system',
        audience: 'ai-subsidy-users'
      }
    );

    // ログイン記録
    logger.info('👤 User registered successfully', {
      userId: user.id,
      email: user.email,
      companyName: user.companyName,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // ウェルカムメール送信（非同期）
    emailService.sendWelcomeEmail(user.email, user.name)
      .catch(error => {
        logger.warn('📧 Welcome email failed to send', {
          userId: user.id,
          email: user.email,
          error: error.message
        });
      });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token
      }
    });

  } catch (error) {
    logger.error('❌ Registration failed', {
      error: error.message,
      stack: error.stack,
      body: { ...req.body, password: '[REDACTED]' }
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ログイン
router.post('/login', authLimiter, loginValidation, async (req, res) => {
  try {
    // バリデーション結果確認
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email, password } = req.body;

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        password: true,
        name: true,
        companyName: true,
        role: true,
        isActive: true,
        lastLoginAt: true
      }
    });

    if (!user) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // タイミング攻撃対策
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Account is deactivated'
      });
    }

    // パスワード確認
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // タイミング攻撃対策
      
      logger.warn('🚨 Failed login attempt', {
        email,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // JWTトークン生成
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'ai-subsidy-system',
        audience: 'ai-subsidy-users'
      }
    );

    // 最終ログイン時刻更新
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    // ログイン記録
    logger.info('✅ User logged in successfully', {
      userId: user.id,
      email: user.email,
      lastLoginAt: user.lastLoginAt,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyName: user.companyName,
          role: user.role,
          isActive: user.isActive
        },
        token
      }
    });

  } catch (error) {
    logger.error('❌ Login failed', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// パスワードリセット要求
router.post('/password-reset-request', passwordResetLimiter, passwordResetRequestValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { email } = req.body;

    // ユーザー検索
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        isActive: true
      }
    });

    // セキュリティのため、ユーザーが存在しない場合も成功レスポンスを返す
    if (!user || !user.isActive) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return res.json({
        success: true,
        message: 'If the email exists, a password reset link has been sent'
      });
    }

    // リセットトークン生成
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1時間後

    // トークンをデータベースに保存
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        updatedAt: new Date()
      }
    });

    // リセットリンク生成
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${resetToken}`;
    const expiryTime = resetTokenExpiry.toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo'
    });

    // パスワードリセットメール送信
    const emailSent = await emailService.sendPasswordResetEmail(user.email, {
      userName: user.name,
      resetLink,
      expiryTime
    });

    if (!emailSent) {
      logger.error('❌ Password reset email failed', {
        userId: user.id,
        email: user.email
      });
    } else {
      logger.info('📧 Password reset email sent', {
        userId: user.id,
        email: user.email,
        expiryTime: resetTokenExpiry
      });
    }

    res.json({
      success: true,
      message: 'If the email exists, a password reset link has been sent'
    });

  } catch (error) {
    logger.error('❌ Password reset request failed', {
      error: error.message,
      stack: error.stack,
      email: req.body.email
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// パスワードリセット実行
router.post('/password-reset', passwordResetValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { token, password } = req.body;

    // トークンでユーザー検索
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // トークンが有効期限内
        },
        isActive: true
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired reset token'
      });
    }

    // 新しいパスワードハッシュ化
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // パスワード更新、トークンクリア
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        updatedAt: new Date()
      }
    });

    logger.info('🔐 Password reset successful', {
      userId: user.id,
      email: user.email,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    logger.error('❌ Password reset failed', {
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// トークン検証
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // ユーザー存在確認
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }

    res.json({
      success: true,
      data: { user }
    });

  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    logger.error('❌ Token verification failed', {
      error: error.message
    });

    res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }
});

export default router;