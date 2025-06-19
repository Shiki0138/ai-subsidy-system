/**
 * Advanced Rate Limit Configuration
 * Comprehensive rate limiting rules for different APIs and user tiers
 */

export const RATE_LIMIT_CONFIG = {
  // User tier limits (requests per window)
  USER_TIERS: {
    USER: 100,      // Regular users
    PREMIUM: 500,   // Premium users (future feature)
    ADMIN: 1000,    // Administrators
    SUPPORT: 750    // Support staff
  },

  // Window durations (in milliseconds)
  WINDOWS: {
    MINUTE: 60 * 1000,
    FIFTEEN_MINUTES: 15 * 60 * 1000,
    HOUR: 60 * 60 * 1000,
    DAY: 24 * 60 * 60 * 1000
  },

  // General API limits
  GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: 'リクエストが多すぎます。しばらく待ってから再度お試しください。',
    errorCode: 'GENERAL_RATE_LIMIT'
  },

  // Authentication limits (stricter for security)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: 'ログイン試行回数が多すぎます。15分後に再度お試しください。',
    errorCode: 'AUTH_RATE_LIMIT',
    skipSuccessfulRequests: true
  },

  // File upload limits
  UPLOAD: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: 'ファイルアップロードの制限に達しました。しばらく待ってから再度お試しください。',
    errorCode: 'UPLOAD_RATE_LIMIT'
  },

  // AI API limits (cost-based)
  AI_GENERATION: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxCost: 1000, // Total cost units per window
    message: 'AI生成の利用制限に達しました。しばらく待ってから再度お試しください。',
    errorCode: 'AI_COST_LIMIT',
    costFunction: (req: any) => {
      // Different AI operations have different costs
      const endpoint = req.path;
      if (endpoint.includes('/generate-full')) return 100;
      if (endpoint.includes('/generate-section')) return 50;
      if (endpoint.includes('/analyze')) return 30;
      if (endpoint.includes('/summarize')) return 20;
      return 10; // Default cost
    }
  },

  // WebSocket connection limits
  WEBSOCKET: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10,
    message: 'WebSocket接続試行が多すぎます。しばらく待ってから再度お試しください。',
    errorCode: 'WEBSOCKET_RATE_LIMIT'
  },

  // Specific endpoint limits
  ENDPOINTS: {
    // PDF generation
    '/api/applications/*/pdf': {
      windowMs: 10 * 60 * 1000, // 10 minutes
      max: 5,
      message: 'PDF生成の制限に達しました。10分後に再度お試しください。',
      errorCode: 'PDF_GENERATION_LIMIT'
    },

    // Email sending
    '/api/notifications/email': {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10,
      message: 'メール送信の制限に達しました。1時間後に再度お試しください。',
      errorCode: 'EMAIL_RATE_LIMIT'
    },

    // Password reset
    '/api/auth/reset-password': {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 3,
      message: 'パスワードリセット要求が多すぎます。15分後に再度お試しください。',
      errorCode: 'PASSWORD_RESET_LIMIT'
    },

    // Account creation
    '/api/auth/register': {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 3,
      message: 'アカウント作成の制限に達しました。1時間後に再度お試しください。',
      errorCode: 'REGISTRATION_LIMIT'
    },

    // Search operations
    '/api/*/search': {
      windowMs: 60 * 1000, // 1 minute
      max: 30,
      message: '検索リクエストが多すぎます。しばらく待ってから再度お試しください。',
      errorCode: 'SEARCH_RATE_LIMIT'
    }
  },

  // Suspicious activity thresholds
  SUSPICIOUS_ACTIVITY: {
    rapidRequestsThreshold: 60, // requests per minute
    errorRateThreshold: 50,     // percentage
    uniqueEndpointsThreshold: 20,
    userAgentChangesThreshold: 5,
    blockDuration: 3600,        // seconds (1 hour)
    enhancedLimitThreshold: 60  // suspicion score threshold for enhanced limits
  },

  // System load thresholds for dynamic limiting
  DYNAMIC_LIMITS: {
    cpuThreshold: 80,      // CPU usage percentage
    memoryThreshold: 85,   // Memory usage percentage
    reductionFactor: 0.5   // Reduce limits by 50% during high load
  },

  // Burst protection
  BURST_PROTECTION: {
    enabled: true,
    shortWindow: 60 * 1000,    // 1 minute
    shortWindowLimit: 20,       // Max requests in short window
    burstPenalty: 5 * 60 * 1000 // 5 minute penalty for burst violations
  },

  // Whitelist settings
  WHITELIST: {
    // IP addresses that bypass rate limiting
    trustedIPs: [
      '127.0.0.1',
      'localhost',
      // Add production monitoring IPs here
    ],
    
    // User IDs that have elevated limits
    trustedUsers: [
      // Add admin user IDs here
    ],

    // API keys with special privileges
    trustedApiKeys: [
      // Add monitoring service API keys here
    ]
  },

  // Error responses
  ERROR_RESPONSES: {
    RATE_LIMIT_EXCEEDED: {
      success: false,
      error: 'リクエスト制限に達しました',
      errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    COST_LIMIT_EXCEEDED: {
      success: false,
      error: 'コスト制限に達しました',
      errorCode: 'COST_LIMIT_EXCEEDED'
    },
    SUSPICIOUS_ACTIVITY: {
      success: false,
      error: '不審なアクティビティが検出されました',
      errorCode: 'SUSPICIOUS_ACTIVITY'
    },
    IP_BLOCKED: {
      success: false,
      error: 'IPアドレスがブロックされています',
      errorCode: 'IP_BLOCKED'
    }
  },

  // Feature flags
  FEATURES: {
    enableDynamicLimiting: true,
    enableSuspiciousActivityDetection: true,
    enableCostBasedLimiting: true,
    enableBurstProtection: true,
    enableDetailedLogging: true,
    enableUserTierLimits: true
  }
} as const;

export type RateLimitConfig = typeof RATE_LIMIT_CONFIG;

export default RATE_LIMIT_CONFIG;