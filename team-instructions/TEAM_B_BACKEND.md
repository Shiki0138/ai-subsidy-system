# ⚙️ チームB - バックエンド開発チーム指示書

## 🎯 チーム概要
**責任領域**: API開発、データベース設計、認証・認可、システム統合
**主要技術**: Node.js 20+, Express.js, Prisma ORM, PostgreSQL, Redis

## 📋 現在の状況と完成度

### ✅ 完成済み機能（85%）
- **認証システム** (`/backend/src/middleware/auth.js`) - JWT認証・セッション管理
- **データベース設計** (`/prisma/schema.prisma`) - 17テーブル完全設計
- **申請書API** (`/backend/src/routes/applications.js`) - CRUD操作完成
- **PDF生成API** (`/backend/pdf-service.js`) - Puppeteer使用
- **ユーザー管理API** (`/backend/src/routes/users.js`) - プロフィール管理
- **セキュリティ実装** (`/backend/src/middleware/security.js`) - 基本セキュリティ

### 🟡 部分実装機能（60%）
- **ファイルアップロード** - 基本機能のみ、詳細検証未実装
- **メール通知** - テンプレート作成済み、送信機能要改良
- **監査ログ** - データ構造定義済み、詳細ログ未実装
- **キャッシュシステム** - Redis設定済み、効果的活用未実装

### ❌ 未実装機能
- **WebSocketリアルタイム通信**
- **高度API制限・スロットリング**
- **詳細監視・メトリクス**
- **バックアップ・リストア自動化**

## 🚀 優先度別実装タスク

### 【高優先度】即座に実装すべき機能

#### 1. 強化されたファイルアップロード API
```javascript
// 📁 /backend/src/routes/upload.js
const multer = require('multer');
const { fileUploadService } = require('../services/enhancedFileUploadService');

router.post('/upload', authenticateToken, async (req, res) => {
  try {
    // ファイル検証
    // ウイルススキャン
    // メタデータ抽出
    // クラウドストレージ保存
    // データベース記録
  } catch (error) {
    // エラーハンドリング
  }
});

// 実装要件:
// - 複数ファイル対応
// - ファイルタイプ検証
// - サイズ制限
// - ウイルススキャン統合
// - プログレス追跡
```

#### 2. WebSocketリアルタイム通信
```javascript
// 📁 /backend/src/services/websocketService.js
const { Server } = require('socket.io');

class WebSocketService {
  constructor(server) {
    this.io = new Server(server, {
      cors: { origin: process.env.FRONTEND_URL }
    });
    this.setupEventHandlers();
  }
  
  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      // ユーザー認証
      // ルーム参加
      // メッセージハンドリング
    });
  }
}

// 実装要件:
// - リアルタイム通知
// - 申請書共同編集
// - システム状態更新
// - 接続管理
```

#### 3. API制限・スロットリング強化
```javascript
// 📁 /backend/src/middleware/advancedRateLimit.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');

const createRateLimiter = (options) => {
  return rateLimit({
    store: new RedisStore({
      client: redisClient,
      prefix: 'rl:'
    }),
    windowMs: options.windowMs,
    max: options.max,
    message: options.message,
    standardHeaders: true,
    legacyHeaders: false,
    // カスタム制限ロジック
    keyGenerator: (req) => {
      return `${req.ip}:${req.user?.id || 'anonymous'}`;
    }
  });
};

// 実装要件:
// - ユーザー別制限
// - API別制限
// - 動的制限調整
// - コスト制限
```

### 【中優先度】次フェーズで実装

#### 4. 詳細監視・メトリクスシステム
```javascript
// 📁 /backend/src/middleware/metrics.js
const promClient = require('prom-client');

// カスタムメトリクス定義
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

// 実装要件:
// - API応答時間監視
// - エラー率追跡
// - リソース使用量監視
// - ビジネスメトリクス
```

#### 5. バックアップ・リストア自動化
```javascript
// 📁 /backend/src/services/backupService.js
class BackupService {
  async createBackup() {
    // データベースバックアップ
    // ファイルストレージバックアップ
    // 設定ファイルバックアップ
    // クラウドストレージアップロード
  }
  
  async restoreFromBackup(backupId) {
    // バックアップ検証
    // データリストア
    // 整合性チェック
  }
}

// 実装要件:
// - 定期自動バックアップ
// - 増分バックアップ
// - 暗号化
// - リストア検証
```

### 【低優先度】将来的な実装

#### 6. マイクロサービス分離準備
```javascript
// 📁 /backend/src/services/serviceRegistry.js
// - サービス発見機能
// - ロードバランシング
// - ヘルスチェック
// - 分散トレーシング
```

## 🗄 データベース最適化

### パフォーマンス最適化
```sql
-- 📁 /prisma/migrations/performance_indexes.sql
-- 重要インデックス追加
CREATE INDEX CONCURRENTLY idx_applications_user_status 
ON applications(user_id, status);

CREATE INDEX CONCURRENTLY idx_ai_usage_logs_timestamp 
ON ai_usage_logs(created_at DESC);

-- パーティショニング（大量データ対応）
CREATE TABLE ai_usage_logs_y2024 PARTITION OF ai_usage_logs
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

### データベース監視
```javascript
// 📁 /backend/src/utils/dbMonitoring.js
const { PrismaClient } = require('@prisma/client');

class DatabaseMonitor {
  async getPerformanceMetrics() {
    // 接続プール状況
    // スロークエリ検出
    // ロック状況
    // ストレージ使用量
  }
  
  async optimizeQueries() {
    // クエリプラン分析
    // インデックス提案
    // パフォーマンス改善
  }
}
```

## 🔐 セキュリティ強化

### セキュリティチェックリスト
```javascript
// 📁 /backend/src/middleware/security.js

// ✅ 実装済み
// - JWT認証
// - CORS設定
// - Helmet セキュリティヘッダー
// - Rate Limiting
// - Input Validation

// 🔄 強化が必要
const securityEnhancements = {
  // 二要素認証
  twoFactorAuth: {
    totp: true,     // Google Authenticator
    sms: true,      // SMS認証
    email: true     // メール認証
  },
  
  // セッション管理
  sessionSecurity: {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24時間
  },
  
  // API暗号化
  encryption: {
    algorithm: 'aes-256-gcm',
    keyRotation: '30d'
  }
};
```

### 脆弱性対策
```javascript
// 📁 /backend/src/utils/securityAudit.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// セキュリティスキャン
const runSecurityAudit = async () => {
  // 依存関係脆弱性チェック
  // npm audit
  
  // SQLインジェクション検証
  // XSS攻撃対策確認
  // CSRF対策確認
  
  // 設定ファイルセキュリティ
  // 環境変数保護確認
};
```

## 🔧 API設計・開発ガイドライン

### RESTful API 設計原則
```javascript
// ✅ 推奨パターン
// GET    /api/v1/applications          // 一覧取得
// GET    /api/v1/applications/:id      // 詳細取得  
// POST   /api/v1/applications          // 新規作成
// PUT    /api/v1/applications/:id      // 全体更新
// PATCH  /api/v1/applications/:id      // 部分更新
// DELETE /api/v1/applications/:id      // 削除

// レスポンス形式統一
const standardResponse = {
  success: true,
  data: {},
  message: "操作が完了しました",
  errors: [],
  metadata: {
    timestamp: new Date().toISOString(),
    requestId: "req_123456789"
  }
};
```

### エラーハンドリング統一
```javascript
// 📁 /backend/src/middleware/errorHandler.js
class CustomError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.isOperational = true;
  }
}

// エラー分類
const ErrorTypes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTH_ERROR', 
  AUTHORIZATION_ERROR: 'AUTHZ_ERROR',
  NOT_FOUND_ERROR: 'NOT_FOUND',
  RATE_LIMIT_ERROR: 'RATE_LIMIT',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
};
```

### API ドキュメント自動生成
```javascript
// 📁 /backend/src/docs/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'AI補助金申請システム API',
      version: '1.0.0',
      description: 'AI補助金申請システムのREST API仕様書'
    }
  },
  apis: ['./src/routes/*.js']
};

// 自動生成されるAPI仕様書
// URL: http://localhost:3001/api-docs
```

## 🧪 テスト戦略

### テスト構成
```javascript
// Unit Tests (50%) - Jest
// 📁 /backend/src/__tests__/unit/

// Integration Tests (30%) - Supertest
// 📁 /backend/src/__tests__/integration/

// E2E Tests (20%) - Newman (Postman)
// 📁 /backend/src/__tests__/e2e/
```

### テスト実装例
```javascript
// 📁 /backend/src/__tests__/integration/applications.test.js
const request = require('supertest');
const app = require('../../app');

describe('Applications API', () => {
  describe('POST /api/applications', () => {
    it('should create new application successfully', async () => {
      const applicationData = {
        projectTitle: 'テストプロジェクト',
        requestedAmount: 1000000
      };
      
      const response = await request(app)
        .post('/api/applications')
        .set('Authorization', `Bearer ${validToken}`)
        .send(applicationData)
        .expect(201);
        
      expect(response.body.success).toBe(true);
      expect(response.body.data.projectTitle).toBe(applicationData.projectTitle);
    });
  });
});
```

## 📊 パフォーマンス最適化

### パフォーマンス目標
- **API応答時間**: < 200ms (95%ile)
- **スループット**: > 1000 req/sec
- **メモリ使用量**: < 1GB
- **CPU使用率**: < 70%

### 最適化戦略
```javascript
// 📁 /backend/src/utils/performance.js

// 1. クエリ最適化
const optimizedQuery = async (userId) => {
  return prisma.application.findMany({
    where: { userId },
    select: {
      id: true,
      projectTitle: true,
      status: true,
      // 必要なフィールドのみ選択
    },
    orderBy: { createdAt: 'desc' }
  });
};

// 2. Redis キャッシュ活用
const getCachedData = async (key) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const data = await fetchFromDatabase();
  await redis.setex(key, 300, JSON.stringify(data)); // 5分キャッシュ
  return data;
};

// 3. バッチ処理最適化
const processBatch = async (items) => {
  const batchSize = 100;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await Promise.all(batch.map(processItem));
  }
};
```

## 🔄 CI/CD パイプライン

### GitHub Actions 設定
```yaml
# 📁 /.github/workflows/backend.yml
name: Backend CI/CD
on:
  push:
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
        
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: |
          cd backend
          npm ci
          
      - name: Run database migrations
        run: |
          cd backend
          npx prisma migrate deploy
          
      - name: Run tests
        run: |
          cd backend
          npm run test
          npm run test:integration
          
      - name: Security audit
        run: |
          cd backend
          npm audit --audit-level moderate
```

## 🛡 運用・監視

### ヘルスチェック実装
```javascript
// 📁 /backend/src/routes/health.js
router.get('/health', async (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      ai_service: await checkAIServiceHealth(),
      storage: await checkStorageHealth()
    }
  };
  
  const isHealthy = Object.values(health.services)
    .every(service => service.status === 'OK');
    
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### ログ管理
```javascript
// 📁 /backend/src/utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'ai-subsidy-backend' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// ログレベル:
// - error: システムエラー、API障害
// - warn: 非致命的問題、パフォーマンス警告
// - info: 通常の動作ログ
// - debug: 詳細なデバッグ情報
```

## 🤝 チーム連携

### 他チームとの連携方法
```javascript
// チームA（フロントエンド）との連携
// TypeScript型定義共有: /shared/types/api-types.ts
// API仕様書自動生成: /docs/api-specification.json

// チームC（AI）との連携
// AI服务接口规范: /backend/src/services/aiService.interface.ts
// 错误处理统一: /shared/utils/ai-error-handling.ts

// チームD（インフラ）との連携
// 环境配置: /backend/.env.example
// Docker設定: /backend/Dockerfile
// ヘルスチェック: /backend/src/routes/health.js
```

### API バージョニング戦略
```javascript
// 📁 /backend/src/routes/index.js
app.use('/api/v1', v1Routes);
app.use('/api/v2', v2Routes);

// 後方互換性維持
// 段階的移行サポート
// バージョン非推奨通知
```

## 🚨 緊急時対応

### 障害対応手順
1. **アラート受信** → Slack #emergency-backend
2. **ログ確認** → CloudWatch/ElasticSearch  
3. **ヘルスチェック** → /api/health エンドポイント
4. **データベース確認** → 接続・パフォーマンス
5. **ロールバック判断** → 5分以内
6. **根本原因分析** → 障害報告書作成

### 災害復旧計画
```javascript
// 📁 /backend/scripts/disaster-recovery.js
const disasterRecovery = {
  // RTO (Recovery Time Objective): 30分
  // RPO (Recovery Point Objective): 5分
  
  async restoreFromBackup(backupTimestamp) {
    // データベースリストア
    // ファイルストレージリストア
    // 設定復元
    // サービス再起動
  }
};
```

## 📚 学習リソース

### 必須学習項目
- **Node.js Best Practices**: https://github.com/goldbergyoni/nodebestpractices
- **Express.js Guide**: https://expressjs.com/en/guide/
- **Prisma Documentation**: https://www.prisma.io/docs
- **PostgreSQL Performance**: https://www.postgresql.org/docs/

### 推奨書籍・コース
- **Node.js Design Patterns**
- **Building Microservices**
- **Database Internals**
- **Site Reliability Engineering**

---

**🎯 最終目標**: スケーラブルで安全な、エンタープライズグレードのバックエンドシステムを構築する

**📞 緊急連絡**: チームリーダー（Slack: @team-b-lead）