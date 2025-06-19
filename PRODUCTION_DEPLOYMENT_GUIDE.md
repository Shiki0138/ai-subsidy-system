# 🚀 AI補助金システム - GitHub自動デプロイ設定ガイド

**作成日**: 2025年6月17日  
**目標**: GitHub Actions + 自動CI/CD + 本番環境デプロイ

---

## 🏗️ デプロイメント・アーキテクチャ

```mermaid
graph TD
    A[開発者 Push] --> B[GitHub Repository]
    B --> C[GitHub Actions]
    C --> D[自動テスト実行]
    D --> E{テスト成功?}
    E -->|Yes| F[Docker Build]
    E -->|No| G[デプロイ停止]
    F --> H[本番環境デプロイ]
    H --> I[ヘルスチェック]
    I --> J[Slack通知]
```

---

## 📁 GitHub Actions設定

### 基本ワークフロー構成
```yaml
# .github/workflows/production-deploy.yml
name: 🚀 Production Deployment

on:
  push:
    branches: [ main ]
    paths-ignore:
      - '**.md'
      - 'docs/**'
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # ==================== テスト ==================== #
  test:
    name: 🧪 Run Tests
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: ai_subsidy_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4

    - name: 🟢 Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'

    - name: 📦 Install dependencies
      run: |
        npm ci
        cd frontend && npm ci
        cd ../backend && npm ci

    - name: 🔧 Setup test environment
      run: |
        cp .env.example .env.test
        echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_subsidy_test" >> .env.test
        echo "REDIS_URL=redis://localhost:6379" >> .env.test
        echo "NODE_ENV=test" >> .env.test

    - name: 🗄️ Setup database
      run: |
        cd backend
        npm run db:migrate:test
        npm run db:seed:test

    - name: 🧪 Run backend tests
      run: |
        cd backend
        npm run test:coverage

    - name: 🎨 Run frontend tests
      run: |
        cd frontend
        npm run test:coverage

    - name: 📊 Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        files: ./backend/coverage/lcov.info,./frontend/coverage/lcov.info

  # ==================== ビルド ==================== #
  build:
    name: 🏗️ Build & Push Docker Images
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'
    
    outputs:
      image-digest: ${{ steps.build.outputs.digest }}
      
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4

    - name: 🐳 Set up Docker Buildx
      uses: docker/setup-buildx-action@v3

    - name: 🔐 Log in to Container Registry
      uses: docker/login-action@v3
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: 📝 Extract metadata
      id: meta
      uses: docker/metadata-action@v5
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: 🏗️ Build and push Docker image
      id: build
      uses: docker/build-push-action@v5
      with:
        context: .
        file: ./Dockerfile.production
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=gha
        cache-to: type=gha,mode=max
        build-args: |
          NODE_ENV=production
          BUILD_DATE=${{ fromJSON(steps.meta.outputs.json).labels['org.opencontainers.image.created'] }}
          VCS_REF=${{ github.sha }}

  # ==================== セキュリティスキャン ==================== #
  security:
    name: 🔒 Security Scan
    runs-on: ubuntu-latest
    needs: build
    
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4

    - name: 🔍 Run Trivy vulnerability scanner
      uses: aquasecurity/trivy-action@master
      with:
        image-ref: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest
        format: 'sarif'
        output: 'trivy-results.sarif'

    - name: 📤 Upload Trivy scan results
      uses: github/codeql-action/upload-sarif@v2
      with:
        sarif_file: 'trivy-results.sarif'

    - name: 🛡️ Run npm audit
      run: |
        npm audit --audit-level moderate
        cd frontend && npm audit --audit-level moderate
        cd ../backend && npm audit --audit-level moderate

  # ==================== 本番デプロイ ==================== #
  deploy:
    name: 🚀 Deploy to Production
    runs-on: ubuntu-latest
    needs: [test, build, security]
    if: github.ref == 'refs/heads/main'
    
    environment:
      name: production
      url: https://your-domain.com
      
    steps:
    - name: 📥 Checkout code
      uses: actions/checkout@v4

    - name: ⚙️ Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: ap-northeast-1

    - name: 🚀 Deploy to ECS
      run: |
        # ECSタスク定義更新
        aws ecs update-service \
          --cluster ai-subsidy-production \
          --service ai-subsidy-app \
          --force-new-deployment \
          --task-definition ai-subsidy-app:REVISION

    - name: ⏳ Wait for deployment
      run: |
        aws ecs wait services-stable \
          --cluster ai-subsidy-production \
          --services ai-subsidy-app

    - name: 🏥 Health check
      run: |
        curl -f https://your-domain.com/api/health || exit 1

    - name: 📢 Notify Slack on success
      if: success()
      uses: 8398a7/action-slack@v3
      with:
        status: success
        title: '✅ Production Deployment Successful'
        message: |
          🚀 AI補助金システムが正常にデプロイされました
          📦 Image: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
          🔗 URL: https://your-domain.com
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}

    - name: 📢 Notify Slack on failure  
      if: failure()
      uses: 8398a7/action-slack@v3
      with:
        status: failure
        title: '❌ Production Deployment Failed'
        message: |
          🚨 デプロイに失敗しました
          📋 ログを確認してください: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
        webhook_url: ${{ secrets.SLACK_WEBHOOK }}

  # ==================== ロールバック準備 ==================== #
  prepare-rollback:
    name: 🔄 Prepare Rollback
    runs-on: ubuntu-latest
    needs: deploy
    if: always() && needs.deploy.result == 'failure'
    
    steps:
    - name: 🔄 Automatic Rollback
      run: |
        aws ecs update-service \
          --cluster ai-subsidy-production \
          --service ai-subsidy-app \
          --task-definition ai-subsidy-app:PREVIOUS
```

---

## 🐳 Docker設定

### 本番用Dockerfile
```dockerfile
# Dockerfile.production
FROM node:20-alpine AS base

# 依存関係インストール
FROM base AS deps
WORKDIR /app
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/
RUN npm ci --only=production

# フロントエンドビルド
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/ .
RUN npm ci && npm run build

# バックエンドビルド  
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/ .
RUN npm ci && npm run build

# 本番イメージ
FROM base AS runner
WORKDIR /app

# セキュリティ: 非rootユーザー
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要ファイルコピー
COPY --from=deps /app/node_modules ./node_modules
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=backend-builder /app/backend/dist ./backend/dist

# 権限設定
RUN chown -R nextjs:nodejs /app
USER nextjs

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

CMD ["npm", "start"]
```

### Docker Compose（本番）
```yaml
# docker-compose.production.yml
version: '3.8'
services:
  app:
    image: ghcr.io/your-username/ai-subsidy-system:latest
    container_name: ai-subsidy-app
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - JWT_SECRET=${JWT_SECRET}
    volumes:
      - uploads:/app/uploads
      - logs:/app/logs
    restart: unless-stopped
    depends_on:
      - postgres
      - redis
    networks:
      - ai-subsidy-network

  postgres:
    image: postgres:15-alpine
    container_name: ai-subsidy-db
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    restart: unless-stopped
    networks:
      - ai-subsidy-network

  redis:
    image: redis:7-alpine
    container_name: ai-subsidy-cache
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: unless-stopped
    networks:
      - ai-subsidy-network

  nginx:
    image: nginx:alpine
    container_name: ai-subsidy-proxy
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
      - static_files:/var/www/static
    restart: unless-stopped
    depends_on:
      - app
    networks:
      - ai-subsidy-network

volumes:
  postgres_data:
  redis_data:
  uploads:
  logs:
  static_files:

networks:
  ai-subsidy-network:
    driver: bridge
```

---

## ⚙️ AWS ECS設定

### ECSタスク定義
```json
{
  "family": "ai-subsidy-app",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "ai-subsidy-app",
      "image": "ghcr.io/your-username/ai-subsidy-system:latest",
      "essential": true,
      "portMappings": [
        {
          "containerPort": 3000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:ai-subsidy/database-url"
        },
        {
          "name": "OPENAI_API_KEY", 
          "valueFrom": "arn:aws:secretsmanager:REGION:ACCOUNT:secret:ai-subsidy/openai-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-subsidy-app",
          "awslogs-region": "ap-northeast-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:3000/api/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Terraformインフラ定義
```hcl
# infrastructure/main.tf
provider "aws" {
  region = "ap-northeast-1"
}

# ECSクラスター
resource "aws_ecs_cluster" "ai_subsidy" {
  name = "ai-subsidy-production"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "ai_subsidy" {
  name               = "ai-subsidy-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true
}

# RDS PostgreSQL
resource "aws_db_instance" "ai_subsidy" {
  identifier     = "ai-subsidy-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true
  
  db_name  = "ai_subsidy_prod"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.ai_subsidy.name
  
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = false
  final_snapshot_identifier = "ai-subsidy-final-snapshot"
  
  tags = {
    Name = "AI補助金システム本番DB"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "ai_subsidy" {
  name       = "ai-subsidy-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "ai_subsidy" {
  replication_group_id       = "ai-subsidy-redis"
  description               = "Redis cluster for AI Subsidy System"
  
  node_type                 = "cache.t3.micro"
  port                      = 6379
  parameter_group_name      = "default.redis7"
  
  num_cache_clusters        = 2
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  subnet_group_name = aws_elasticache_subnet_group.ai_subsidy.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
}
```

---

## 🔧 GitHub Secrets設定

### 必要なシークレット
```bash
# GitHub Repository Settings > Secrets and variables > Actions

# AWS認証
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=ap-northeast-1

# データベース
DATABASE_URL=postgresql://user:pass@host:5432/ai_subsidy_prod
REDIS_URL=redis://...

# API Keys
OPENAI_API_KEY=sk-...
GPTS_API_KEY=...
ANTHROPIC_API_KEY=...

# JWT & セキュリティ
JWT_SECRET=...
ENCRYPTION_KEY=...

# 通知
SLACK_WEBHOOK=https://hooks.slack.com/...

# ドメイン
DOMAIN_NAME=your-domain.com
SSL_CERT_ARN=arn:aws:acm:...
```

---

## 📊 監視・アラート設定

### CloudWatch監視
```yaml
# monitoring/cloudwatch-alarms.yml
Resources:
  CPUAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: AI-Subsidy-High-CPU
      MetricName: CPUUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 80
      ComparisonOperator: GreaterThanThreshold
      AlarmActions:
        - !Ref SNSTopic

  MemoryAlarm:
    Type: AWS::CloudWatch::Alarm  
    Properties:
      AlarmName: AI-Subsidy-High-Memory
      MetricName: MemoryUtilization
      Namespace: AWS/ECS
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 85
      ComparisonOperator: GreaterThanThreshold

  ResponseTimeAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: AI-Subsidy-Slow-Response
      MetricName: TargetResponseTime
      Namespace: AWS/ApplicationELB
      Statistic: Average
      Period: 300
      EvaluationPeriods: 3
      Threshold: 5000
      ComparisonOperator: GreaterThanThreshold
```

---

## 🔄 自動スケーリング設定

### ECS Auto Scaling
```json
{
  "ServiceName": "ai-subsidy-app",
  "ScalableDimension": "ecs:service:DesiredCount",
  "MinCapacity": 2,
  "MaxCapacity": 10,
  "TargetTrackingScalingPolicies": [
    {
      "TargetValue": 70.0,
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
      },
      "ScaleOutCooldown": 300,
      "ScaleInCooldown": 300
    },
    {
      "TargetValue": 80.0,
      "PredefinedMetricSpecification": {
        "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
      }
    }
  ]
}
```

---

## 🔧 デプロイスクリプト

### ワンクリックデプロイ
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 AI補助金システム自動デプロイ開始..."

# 1. 環境確認
if [ "$NODE_ENV" != "production" ]; then
    echo "❌ 本番環境変数が設定されていません"
    exit 1
fi

# 2. GitHub Actions確認
echo "📋 最新のGitHub Actionsステータス確認中..."
gh run list --limit 1 --json status,conclusion

# 3. インフラ状態確認
echo "🏗️ AWS インフラ状態確認中..."
aws ecs describe-services \
    --cluster ai-subsidy-production \
    --services ai-subsidy-app \
    --query 'services[0].status'

# 4. データベースバックアップ
echo "💾 本番データベースバックアップ中..."
aws rds create-db-snapshot \
    --db-snapshot-identifier "pre-deploy-$(date +%Y%m%d-%H%M%S)" \
    --db-instance-identifier ai-subsidy-db

# 5. デプロイ実行
echo "🚀 デプロイ実行中..."
git push origin main

# 6. デプロイ監視
echo "⏳ デプロイ進捗監視中..."
gh run watch

# 7. ヘルスチェック
echo "🏥 本番環境ヘルスチェック..."
for i in {1..30}; do
    if curl -f https://your-domain.com/api/health; then
        echo "✅ デプロイ成功！"
        break
    fi
    echo "⏳ ヘルスチェック中... ($i/30)"
    sleep 10
done

echo "🎉 デプロイ完了！"
```

---

## 📋 デプロイチェックリスト

### 事前準備
- [ ] GitHub Secrets設定完了
- [ ] AWS権限設定完了  
- [ ] ドメイン・SSL証明書準備
- [ ] Slack通知設定完了

### デプロイ前確認
- [ ] 全テストパス
- [ ] セキュリティスキャンクリア
- [ ] データベースバックアップ
- [ ] 設定ファイル確認

### デプロイ後確認  
- [ ] アプリケーション正常動作
- [ ] データベース接続確認
- [ ] API機能確認
- [ ] 監視アラート設定

---

**🚀 これで、mainブランチへのプッシュで自動的に本番環境へデプロイされます！**

*GitHub Actions + AWS ECS + 自動監視で、世界レベルの運用体制が完成しました。*