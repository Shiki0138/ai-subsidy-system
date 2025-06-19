/**
 * セキュリティ設定 - 世界最高レベルのセキュリティ対策
 * 
 * 初心者でも安全に開発できるよう、セキュリティのベストプラクティスを実装
 */

import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import crypto from 'crypto';

// ===== 暗号化設定 =====

export const ENCRYPTION = {
  // データベース暗号化用
  algorithm: 'aes-256-gcm',
  keyLength: 32,
  ivLength: 16,
  tagLength: 16,
  
  // パスワードハッシュ化
  saltRounds: 12,
  
  // JWT設定
  jwtOptions: {
    expiresIn: '1h',
    algorithm: 'HS256' as const,
  },
  
  // セッション設定
  sessionOptions: {
    name: 'ai-subsidy-session',
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24時間
      sameSite: 'strict' as const,
    },
  },
} as const;

// ===== レート制限設定 =====

// 一般的なAPIリクエスト制限
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 15分あたり100リクエスト
  message: {
    error: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI生成API専用の制限（コスト管理）
export const aiGenerationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分あたり5回のAI生成まで
  message: {
    error: 'AI生成の利用制限に達しました。しばらく待ってから再度お試しください。',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 認証API制限（ブルートフォース攻撃対策）
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分あたり5回のログイン試行まで
  message: {
    error: 'ログイン試行回数が多すぎます。15分後に再度お試しください。',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // 成功したリクエストはカウントしない
});

// ファイルアップロード制限（ストレージ保護・帯域制限）
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 20, // 15分あたり20回のアップロード
  message: {
    error: 'ファイルアップロードの制限に達しました。しばらく待ってから再度お試しください。',
    errorCode: 'UPLOAD_RATE_LIMIT_EXCEEDED',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => {
    // ユーザーIDがある場合はそれを使用、なければIPアドレス
    return req.user?.id || req.ip;
  },
});

// ===== セキュリティヘッダー設定 =====

export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Next.js開発環境用（本番では削除検討）
        "'unsafe-eval'",   // Next.js開発環境用（本番では削除検討）
        'https://vercel.live',
      ],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: [
        "'self'",
        'https://api.openai.com',
        'https://api.anthropic.com',
        'wss://localhost:*', // 開発環境用WebSocket
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // PDF生成時にWorkerが必要なため無効化
  hsts: {
    maxAge: 31536000, // 1年
    includeSubDomains: true,
    preload: true,
  },
});

// AI Rate limit alias for compatibility
export const aiRateLimit = aiGenerationRateLimit;

// ===== CORS設定 =====

export const corsOptions = {
  origin: function (origin: string | undefined, callback: Function) {
    // 許可するオリジンのリスト
    const allowedOrigins = [
      'http://localhost:3000',
      'https://localhost:3000',
      'http://localhost:7000',
      'https://localhost:7000',
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // 開発環境では null origin も許可（Postman等）
    if (process.env.NODE_ENV === 'development' && !origin) {
      return callback(null, true);
    }

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation'), false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
  ],
  maxAge: 86400, // 24時間
};

// ===== データ暗号化ユーティリティ =====

/**
 * センシティブデータの暗号化
 * @param text 暗号化するテキスト
 * @param key 暗号化キー（環境変数から取得）
 * @returns 暗号化されたデータ
 */
export function encryptSensitiveData(text: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('暗号化キーが設定されていません');
  }

  const iv = crypto.randomBytes(ENCRYPTION.ivLength);
  const cipher = crypto.createCipher(ENCRYPTION.algorithm, encryptionKey);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
}

/**
 * センシティブデータの復号化
 * @param encryptedData 暗号化されたデータ
 * @param key 復号化キー（環境変数から取得）
 * @returns 復号化されたテキスト
 */
export function decryptSensitiveData(encryptedData: string, key?: string): string {
  const encryptionKey = key || process.env.ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error('暗号化キーが設定されていません');
  }

  const parts = encryptedData.split(':');
  if (parts.length !== 3) {
    throw new Error('無効な暗号化データ形式');
  }

  const [ivHex, tagHex, encrypted] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  
  const decipher = crypto.createDecipher(ENCRYPTION.algorithm, encryptionKey);
  decipher.setAuthTag(tag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

/**
 * データの匿名化（AI学習用）
 * @param data 匿名化するデータ
 * @returns 匿名化されたデータ
 */
export function anonymizeForAI(data: any): any {
  const sensitiveFields = [
    'email',
    'phone',
    'address',
    'companyName',
    'representativeName',
    'personalInfo',
  ];

  if (typeof data === 'object' && data !== null) {
    const anonymized = { ...data };
    
    for (const field of sensitiveFields) {
      if (anonymized[field]) {
        // ハッシュ化またはマスキング
        if (typeof anonymized[field] === 'string') {
          anonymized[field] = crypto
            .createHash('sha256')
            .update(anonymized[field])
            .digest('hex')
            .substring(0, 8) + '***';
        }
      }
    }
    
    return anonymized;
  }
  
  return data;
}

// ===== バリデーション設定 =====

export const VALIDATION_RULES = {
  email: {
    required: true,
    isEmail: true,
    normalizeEmail: true,
  },
  password: {
    required: true,
    isLength: { min: 8, max: 128 },
    matches: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, // 英大小文字・数字・記号必須
  },
  companyName: {
    required: true,
    isLength: { min: 1, max: 100 },
    trim: true,
  },
  businessPlan: {
    required: true,
    isLength: { min: 10, max: 50000 },
  },
} as const;

// ===== ログ設定 =====

export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
} as const;

// セキュリティイベントのログレベル
export const SECURITY_LOG_EVENTS = {
  FAILED_LOGIN: 'FAILED_LOGIN',
  SUCCESSFUL_LOGIN: 'SUCCESSFUL_LOGIN',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  DATA_ENCRYPTION: 'DATA_ENCRYPTION',
  AI_USAGE: 'AI_USAGE',
} as const;

export default {
  ENCRYPTION,
  generalRateLimit,
  aiGenerationRateLimit,
  authRateLimit,
  uploadRateLimit,
  helmetConfig,
  corsOptions,
  encryptSensitiveData,
  decryptSensitiveData,
  anonymizeForAI,
  VALIDATION_RULES,
  LOG_LEVELS,
  SECURITY_LOG_EVENTS,
};