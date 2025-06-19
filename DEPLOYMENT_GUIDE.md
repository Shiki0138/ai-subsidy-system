# 🚀 AI補助金申請システム - 本番環境デプロイガイド

## 📋 目次
1. [GitHub設定](#github設定)
2. [本番環境構成](#本番環境構成)
3. [デプロイ手順](#デプロイ手順)
4. [環境変数設定](#環境変数設定)
5. [セキュリティ設定](#セキュリティ設定)
6. [運用・監視](#運用監視)

## 🔧 GitHub設定

### 1. リポジトリの準備

```bash
# 新規リポジトリを作成
git init
git add .
git commit -m "Initial commit: AI補助金申請システム"

# GitHubでリポジトリを作成後
git remote add origin https://github.com/yourusername/ai-subsidy-system.git
git branch -M main
git push -u origin main
```

### 2. GitHub Secrets設定

リポジトリの Settings > Secrets and variables > Actions で以下を設定：

```yaml
# 本番サーバー情報
HOST: your-server-ip
USERNAME: deploy-user
SSH_KEY: -----BEGIN OPENSSH PRIVATE KEY-----...

# API Keys
OPENAI_API_KEY: sk-...
ANTHROPIC_API_KEY: sk-ant-...
CORPORATE_NUMBER_APP_ID: your-app-id

# データベース
DATABASE_URL: postgresql://user:pass@host:5432/dbname
REDIS_PASSWORD: your-redis-password

# その他
JWT_SECRET: your-jwt-secret-min-32-chars
ENCRYPTION_KEY: your-32-byte-encryption-key
```

## 🌐 本番環境構成

### オプション1: AWS構成（推奨）

```yaml
# terraform/main.tf
provider "aws" {
  region = "ap-northeast-1"
}

# VPC
resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_dns_hostnames = true
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ai-subsidy-cluster"
}

# RDS PostgreSQL
resource "aws_db_instance" "postgres" {
  identifier = "ai-subsidy-db"
  engine = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  allocated_storage = 100
  storage_encrypted = true
  
  db_name = "ai_subsidy"
  username = "postgres"
  password = var.db_password
  
  backup_retention_period = 7
  backup_window = "03:00-04:00"
  maintenance_window = "sun:04:00-sun:05:00"
}

# ElastiCache Redis
resource "aws_elasticache_cluster" "redis" {
  cluster_id = "ai-subsidy-redis"
  engine = "redis"
  node_type = "cache.t3.medium"
  num_cache_nodes = 1
  parameter_group_name = "default.redis7"
}

# S3 Bucket
resource "aws_s3_bucket" "uploads" {
  bucket = "ai-subsidy-uploads"
  
  versioning {
    enabled = true
  }
  
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name = "ai-subsidy-alb"
  internal = false
  load_balancer_type = "application"
  security_groups = [aws_security_group.alb.id]
  subnets = aws_subnet.public.*.id
}
```

### オプション2: VPSデプロイ（コスト優先）

```bash
# サーバー初期設定スクリプト
#!/bin/bash

# システムアップデート
apt update && apt upgrade -y

# 必要なパッケージをインストール
apt install -y git docker.io docker-compose nginx certbot python3-certbot-nginx

# Node.js 20をインストール
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# PostgreSQL 15をインストール
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
apt update
apt install -y postgresql-15

# Redisをインストール
apt install -y redis-server

# ファイアウォール設定
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# デプロイユーザー作成
adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
usermod -aG sudo deploy

# アプリケーションディレクトリ作成
mkdir -p /var/www/ai-subsidy-system
chown -R deploy:deploy /var/www/ai-subsidy-system
```

## 📦 デプロイ手順

### 1. Docker Composeファイル

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.production
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - JWT_SECRET=${JWT_SECRET}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    volumes:
      - ./backend/uploads:/app/uploads
      - ./backend/logs:/app/logs

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.production
      args:
        - NEXT_PUBLIC_API_URL=${API_URL}
    ports:
      - "3000:3000"
    restart: unless-stopped
    depends_on:
      - backend

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=ai_subsidy
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    command: >
      postgres
      -c max_connections=200
      -c shared_buffers=256MB
      -c effective_cache_size=1GB
      -c maintenance_work_mem=64MB

  redis:
    image: redis:7-alpine
    command: >
      redis-server
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 512mb
      --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  certbot:
    image: certbot/certbot
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - ./nginx/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait $${!}; done;'"

volumes:
  postgres_data:
  redis_data:
  certbot-etc:
  certbot-var:
```

### 2. Dockerfiles

```dockerfile
# backend/Dockerfile.production
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係をコピー
COPY package*.json ./
COPY prisma ./prisma/

# 依存関係をインストール
RUN npm ci --only=production

# Prismaクライアントを生成
RUN npx prisma generate

# ソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# 本番イメージ
FROM node:20-alpine

WORKDIR /app

# 必要なパッケージをインストール
RUN apk add --no-cache libc6-compat

# ビルドステージから必要なファイルをコピー
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package*.json ./

# アップロードとログディレクトリを作成
RUN mkdir -p uploads logs temp

# 非rootユーザーで実行
USER node

EXPOSE 3001

CMD ["node", "dist/index.js"]
```

```dockerfile
# frontend/Dockerfile.production
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係をコピー
COPY package*.json ./
RUN npm ci

# ソースコードをコピー
COPY . .

# 環境変数を設定
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# ビルド
RUN npm run build

# 本番イメージ
FROM node:20-alpine

WORKDIR /app

# 必要なファイルのみコピー
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./

# 非rootユーザーで実行
USER node

EXPOSE 3000

CMD ["npm", "start"]
```

### 3. CI/CDパイプライン

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          
      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci
        
      - name: Run backend tests
        working-directory: ./backend
        run: npm test
        
      - name: Run security audit
        working-directory: ./backend
        run: npm audit --audit-level=moderate

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      
    steps:
      - uses: actions/checkout@v4
      
      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Build and push backend image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile.production
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/backend:latest
          
      - name: Build and push frontend image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile.production
          push: true
          tags: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/frontend:latest
          build-args: |
            NEXT_PUBLIC_API_URL=${{ secrets.API_URL }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.HOST }}
          username: ${{ secrets.USERNAME }}
          key: ${{ secrets.SSH_KEY }}
          script: |
            cd /var/www/ai-subsidy-system
            
            # 最新のコードを取得
            git pull origin main
            
            # 環境変数を更新
            echo "${{ secrets.ENV_FILE }}" > .env
            
            # コンテナを更新
            docker-compose -f docker-compose.production.yml pull
            docker-compose -f docker-compose.production.yml up -d
            
            # データベースマイグレーション
            docker-compose -f docker-compose.production.yml exec -T backend npx prisma migrate deploy
            
            # 不要なイメージを削除
            docker system prune -af
            
            # ヘルスチェック
            sleep 30
            curl -f http://localhost/api/health || exit 1
```

## 🔐 環境変数設定

```bash
# .env.production
# サーバー設定
NODE_ENV=production
PORT=3001
API_URL=https://api.your-domain.com

# データベース
DATABASE_URL=postgresql://postgres:secure-password@postgres:5432/ai_subsidy
DB_USER=postgres
DB_PASSWORD=secure-password

# Redis
REDIS_URL=redis://:redis-password@redis:6379
REDIS_PASSWORD=redis-password

# JWT設定
JWT_SECRET=your-very-secure-jwt-secret-min-32-characters
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-min-32-characters
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# API Keys
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
CORPORATE_NUMBER_APP_ID=your-gbiz-info-app-id

# Email設定
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@your-domain.com

# Storage設定
USE_S3=true
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET_NAME=ai-subsidy-uploads
S3_REGION=ap-northeast-1

# セキュリティ
ENCRYPTION_KEY=your-32-byte-encryption-key-for-aes
SESSION_SECRET=your-session-secret-for-express
CORS_ORIGIN=https://your-domain.com

# モニタリング
SENTRY_DSN=https://...@sentry.io/...
ELASTICSEARCH_URL=http://elasticsearch:9200
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# その他
FRONTEND_URL=https://your-domain.com
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
```

## 🛡️ セキュリティ設定

### 1. SSL証明書設定

```bash
# Let's Encrypt証明書の取得
docker-compose -f docker-compose.production.yml run --rm certbot \
  certonly --webroot -w /var/www/certbot \
  -d your-domain.com \
  -d api.your-domain.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

### 2. Nginx設定

```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # セキュリティヘッダー
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:;" always;

    # Gzip圧縮
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml application/javascript application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # HTTPSリダイレクト
    server {
        listen 80;
        server_name your-domain.com api.your-domain.com;
        
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }
        
        location / {
            return 301 https://$server_name$request_uri;
        }
    }

    # メインサイト
    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        
        # SSL設定
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'TLS_AES_128_GCM_SHA256:TLS_AES_256_GCM_SHA384:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;
        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_stapling on;
        ssl_stapling_verify on;

        # フロントエンド
        location / {
            proxy_pass http://frontend:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }

    # API サーバー
    server {
        listen 443 ssl http2;
        server_name api.your-domain.com;

        ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
        
        # API エンドポイント
        location /api {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Host $host;
            
            # タイムアウト設定
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # ログイン制限
        location /api/auth/login {
            limit_req zone=login burst=5 nodelay;
            
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Host $host;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://backend:3001;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # ヘルスチェック
        location /health {
            proxy_pass http://backend:3001/api/health;
            access_log off;
        }
    }
}
```

### 3. データベースセキュリティ

```sql
-- PostgreSQL セキュリティ設定
-- 読み取り専用ユーザーの作成
CREATE USER readonly_user WITH PASSWORD 'secure_password';
GRANT CONNECT ON DATABASE ai_subsidy TO readonly_user;
GRANT USAGE ON SCHEMA public TO readonly_user;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly_user;

-- 接続制限
ALTER DATABASE ai_subsidy SET max_connections = 100;

-- SSL接続の強制
ALTER DATABASE ai_subsidy SET ssl = on;

-- ログ設定
ALTER DATABASE ai_subsidy SET log_statement = 'all';
ALTER DATABASE ai_subsidy SET log_connections = on;
ALTER DATABASE ai_subsidy SET log_disconnections = on;
```

## 📊 運用・監視

### 1. バックアップスクリプト

```bash
#!/bin/bash
# backup.sh

# 設定
BACKUP_DIR="/backup/ai-subsidy"
S3_BUCKET="s3://your-backup-bucket"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# ディレクトリ作成
mkdir -p $BACKUP_DIR/{db,files,configs}

# PostgreSQLバックアップ
echo "Starting database backup..."
docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml exec -T postgres \
  pg_dump -U postgres ai_subsidy | gzip > $BACKUP_DIR/db/ai_subsidy_$DATE.sql.gz

# アップロードファイルバックアップ
echo "Starting file backup..."
tar -czf $BACKUP_DIR/files/uploads_$DATE.tar.gz \
  /var/www/ai-subsidy-system/backend/uploads

# 設定ファイルバックアップ
echo "Starting config backup..."
tar -czf $BACKUP_DIR/configs/configs_$DATE.tar.gz \
  /var/www/ai-subsidy-system/.env \
  /var/www/ai-subsidy-system/nginx \
  /var/www/ai-subsidy-system/docker-compose.production.yml

# S3へアップロード
echo "Uploading to S3..."
aws s3 sync $BACKUP_DIR $S3_BUCKET/backups/

# 古いバックアップを削除
echo "Cleaning up old backups..."
find $BACKUP_DIR -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed!"
```

### 2. 監視設定

```yaml
# monitoring/docker-compose.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    depends_on:
      - prometheus
    ports:
      - "3030:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=${GRAFANA_USER}
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}

  node_exporter:
    image: prom/node-exporter:latest
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'

volumes:
  prometheus_data:
  grafana_data:
```

### 3. ヘルスチェックスクリプト

```bash
#!/bin/bash
# health-check.sh

# エンドポイント
API_URL="https://api.your-domain.com"
FRONTEND_URL="https://your-domain.com"

# Slack Webhook URL
SLACK_WEBHOOK="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# ヘルスチェック関数
check_health() {
    local url=$1
    local name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" $url/health)
    
    if [ $response -eq 200 ]; then
        echo "$name is healthy"
    else
        echo "$name is unhealthy (HTTP $response)"
        
        # Slackに通知
        curl -X POST -H 'Content-type: application/json' \
          --data "{\"text\":\"⚠️ $name is down! HTTP Status: $response\"}" \
          $SLACK_WEBHOOK
    fi
}

# チェック実行
check_health $API_URL "Backend API"
check_health $FRONTEND_URL "Frontend"

# データベース接続チェック
docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml \
  exec -T postgres pg_isready -U postgres || \
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"⚠️ PostgreSQL is not responding!"}' \
    $SLACK_WEBHOOK

# Redis接続チェック
docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml \
  exec -T redis redis-cli ping || \
  curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"⚠️ Redis is not responding!"}' \
    $SLACK_WEBHOOK
```

### 4. Cronジョブ設定

```bash
# crontab -e

# バックアップ（毎日深夜2時）
0 2 * * * /var/www/ai-subsidy-system/scripts/backup.sh >> /var/log/backup.log 2>&1

# ヘルスチェック（5分ごと）
*/5 * * * * /var/www/ai-subsidy-system/scripts/health-check.sh >> /var/log/health-check.log 2>&1

# SSL証明書更新（毎日深夜3時）
0 3 * * * docker-compose -f /var/www/ai-subsidy-system/docker-compose.production.yml run --rm certbot renew >> /var/log/certbot.log 2>&1

# ログローテーション（毎週日曜日）
0 0 * * 0 /usr/sbin/logrotate /etc/logrotate.d/ai-subsidy

# 一時ファイルクリーンアップ（毎日深夜1時）
0 1 * * * find /var/www/ai-subsidy-system/backend/temp -type f -mtime +1 -delete
```

## 🚨 トラブルシューティング

### よくある問題と解決方法

1. **メモリ不足エラー**
```bash
# Swapファイルを追加
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

2. **PostgreSQL接続エラー**
```bash
# 接続数を増やす
docker-compose exec postgres psql -U postgres -c "ALTER SYSTEM SET max_connections = 200;"
docker-compose restart postgres
```

3. **Redis メモリ制限**
```bash
# Redis設定を更新
docker-compose exec redis redis-cli CONFIG SET maxmemory 1gb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

4. **Nginxエラー**
```bash
# 設定をテスト
docker-compose exec nginx nginx -t

# リロード
docker-compose exec nginx nginx -s reload
```

## 📞 サポート

問題が発生した場合は、以下の順序で対応してください：

1. ログを確認: `docker-compose logs -f [service_name]`
2. GitHub Issues を確認
3. ドキュメントを再確認
4. コミュニティフォーラムで質問

---

最終更新: 2024年1月