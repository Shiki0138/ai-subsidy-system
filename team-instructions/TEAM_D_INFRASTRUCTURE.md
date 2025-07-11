# 🏗 チームD - インフラ・DevOps チーム指示書

## 🎯 チーム概要
**責任領域**: クラウドインフラ、CI/CD、監視・運用、セキュリティ、スケーリング
**主要技術**: AWS/Azure, Docker, Kubernetes, Terraform, GitHub Actions

## 📋 現在の状況と完成度

### ✅ 完成済み機能（75%）
- **ローカル開発環境** (`/docker-compose.dev.yml`) - PostgreSQL, Redis, MinIO, Elasticsearch
- **基本Docker設定** (`/backend/Dockerfile`, `/frontend/Dockerfile`) - マルチステージビルド
- **開発用スクリプト** (`/start.sh`, `/stop.sh`, `/status.sh`) - 環境管理自動化
- **環境変数管理** (`.env.example`) - 設定テンプレート
- **基本監視** - ヘルスチェックエンドポイント
- **セキュリティ基盤** - HTTPS、基本認証

### 🟡 部分実装機能（50%）
- **CI/CD パイプライン** - GitHub Actions 基本設定のみ
- **本番環境構成** - 設計完了、デプロイ未実装
- **監視・アラート** - 基本ログのみ、詳細監視未実装
- **バックアップシステム** - 手動バックアップのみ

### ❌ 未実装機能
- **本格的なクラウドデプロイ**
- **Kubernetes オーケストレーション**
- **包括的監視・アラート**
- **自動スケーリング**
- **災害復旧システム**

## 🚀 優先度別実装タスク

### 【高優先度】即座に実装すべき機能

#### 1. 本番環境クラウドインフラ構築
```hcl
# 📁 /infrastructure/terraform/main.tf
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# VPC構成
resource "aws_vpc" "ai_subsidy_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "ai-subsidy-vpc"
    Environment = var.environment
    Project     = "ai-subsidy-system"
  }
}

# EKS クラスター
resource "aws_eks_cluster" "ai_subsidy_cluster" {
  name     = "ai-subsidy-${var.environment}"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs    = ["0.0.0.0/0"]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_encryption.arn
    }
    resources = ["secrets"]
  }
}

# RDS PostgreSQL
resource "aws_rds_instance" "ai_subsidy_db" {
  identifier     = "ai-subsidy-${var.environment}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"
  
  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_type         = "gp3"
  storage_encrypted    = true
  
  db_name  = "ai_subsidy_${var.environment}"
  username = var.db_username
  password = var.db_password
  
  backup_retention_period = 30
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = var.environment == "production"
  publicly_accessible   = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Name        = "ai-subsidy-db-${var.environment}"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "ai_subsidy_redis" {
  replication_group_id       = "ai-subsidy-${var.environment}"
  description                = "Redis cluster for AI Subsidy System"
  
  port                       = 6379
  parameter_group_name       = "default.redis7"
  node_type                  = "cache.t3.micro"
  num_cache_clusters         = var.environment == "production" ? 3 : 1
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  tags = {
    Name        = "ai-subsidy-redis-${var.environment}"
    Environment = var.environment
  }
}
```

#### 2. Kubernetes マニフェスト
```yaml
# 📁 /kubernetes/deployments/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-subsidy-backend
  namespace: ai-subsidy
  labels:
    app: ai-subsidy-backend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: ai-subsidy-backend
  template:
    metadata:
      labels:
        app: ai-subsidy-backend
        version: v1
    spec:
      containers:
      - name: backend
        image: ai-subsidy/backend:latest
        ports:
        - containerPort: 3001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: OPENAI_API_KEY
          valueFrom:
            secretKeyRef:
              name: ai-keys-secret
              key: openai-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 3001
          initialDelaySeconds: 5
          periodSeconds: 5
      imagePullSecrets:
      - name: registry-secret

---
apiVersion: v1
kind: Service
metadata:
  name: ai-subsidy-backend-service
  namespace: ai-subsidy
spec:
  selector:
    app: ai-subsidy-backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3001
  type: ClusterIP

---
# Horizontal Pod Autoscaler
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ai-subsidy-backend-hpa
  namespace: ai-subsidy
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ai-subsidy-backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

#### 3. 包括的CI/CDパイプライン
```yaml
# 📁 /.github/workflows/ci-cd-pipeline.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # セキュリティスキャン
  security-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
  # フロントエンドテスト・ビルド
  frontend-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./frontend
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './frontend/package-lock.json'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linting
        run: npm run lint
        
      - name: Run type checking
        run: npm run type-check
        
      - name: Run unit tests
        run: npm run test
        
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Build application
        run: npm run build
        
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: ./frontend/.next/
          
  # バックエンドテスト・ビルド
  backend-ci:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./backend
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: './backend/package-lock.json'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run database migrations
        run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          
      - name: Run unit tests
        run: npm run test
        
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
          
      - name: Run security audit
        run: npm audit --audit-level moderate
        
  # Dockerイメージビルド・プッシュ
  build-and-push:
    needs: [security-scan, frontend-ci, backend-ci]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    strategy:
      matrix:
        component: [frontend, backend]
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3
        
      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
          
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}/${{ matrix.component }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}
            
      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./${{ matrix.component }}
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          
  # 本番デプロイ
  deploy-production:
    needs: [build-and-push]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-northeast-1
          
      - name: Deploy to EKS
        run: |
          aws eks update-kubeconfig --region ap-northeast-1 --name ai-subsidy-production
          kubectl apply -f kubernetes/
          kubectl rollout restart deployment/ai-subsidy-frontend -n ai-subsidy
          kubectl rollout restart deployment/ai-subsidy-backend -n ai-subsidy
          kubectl rollout status deployment/ai-subsidy-frontend -n ai-subsidy
          kubectl rollout status deployment/ai-subsidy-backend -n ai-subsidy
```

### 【中優先度】次フェーズで実装

#### 4. 包括的監視・ログシステム
```yaml
# 📁 /kubernetes/monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "/etc/prometheus/rules/*.yml"
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
    
    scrape_configs:
      # Kubernetes API server
      - job_name: 'kubernetes-apiservers'
        kubernetes_sd_configs:
        - role: endpoints
        scheme: https
        tls_config:
          ca_file: /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        bearer_token_file: /var/run/secrets/kubernetes.io/serviceaccount/token
        relabel_configs:
        - source_labels: [__meta_kubernetes_namespace, __meta_kubernetes_service_name, __meta_kubernetes_endpoint_port_name]
          action: keep
          regex: default;kubernetes;https
      
      # AI Subsidy Application
      - job_name: 'ai-subsidy-backend'
        kubernetes_sd_configs:
        - role: endpoints
          namespaces:
            names:
            - ai-subsidy
        relabel_configs:
        - source_labels: [__meta_kubernetes_service_name]
          action: keep
          regex: ai-subsidy-backend-service
        - source_labels: [__meta_kubernetes_endpoint_port_name]
          action: keep
          regex: metrics
      
      # Node Exporter
      - job_name: 'node-exporter'
        kubernetes_sd_configs:
        - role: node
        relabel_configs:
        - action: labelmap
          regex: __meta_kubernetes_node_label_(.+)
        - target_label: __address__
          replacement: kubernetes.default.svc:443
        - source_labels: [__meta_kubernetes_node_name]
          regex: (.+)
          target_label: __metrics_path__
          replacement: /api/v1/nodes/${1}/proxy/metrics
```

#### 5. アラート設定
```yaml
# 📁 /kubernetes/monitoring/alert-rules.yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: ai-subsidy-alerts
  namespace: monitoring
spec:
  groups:
  - name: ai-subsidy.rules
    rules:
    # Application Health
    - alert: ApplicationDown
      expr: up{job="ai-subsidy-backend"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "AI Subsidy application is down"
        description: "The AI Subsidy backend application has been down for more than 5 minutes"
    
    # High Response Time
    - alert: HighResponseTime
      expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="ai-subsidy-backend"}[5m])) > 2
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High response time detected"
        description: "95th percentile response time is {{ $value }}s"
    
    # High Error Rate
    - alert: HighErrorRate
      expr: rate(http_requests_total{job="ai-subsidy-backend",status=~"5.."}[5m]) / rate(http_requests_total{job="ai-subsidy-backend"}[5m]) > 0.1
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High error rate detected"
        description: "Error rate is {{ $value | humanizePercentage }}"
    
    # Database Connection Issues
    - alert: DatabaseConnectionFailure
      expr: increase(database_connections_failed_total[5m]) > 5
      for: 2m
      labels:
        severity: critical
      annotations:
        summary: "Database connection failures"
        description: "{{ $value }} database connection failures in the last 5 minutes"
    
    # AI Service Issues
    - alert: AIServiceHighLatency
      expr: histogram_quantile(0.95, rate(ai_request_duration_seconds_bucket[5m])) > 10
      for: 5m
      labels:
        severity: warning
      annotations:
        summary: "AI service high latency"
        description: "AI service 95th percentile latency is {{ $value }}s"
    
    # Resource Usage
    - alert: HighCPUUsage
      expr: (100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)) > 85
      for: 10m
      labels:
        severity: warning
      annotations:
        summary: "High CPU usage"
        description: "CPU usage is {{ $value }}%"
    
    - alert: HighMemoryUsage
      expr: (1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100 > 90
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "High memory usage"
        description: "Memory usage is {{ $value }}%"
```

### 【低優先度】将来的な実装

#### 6. 災害復旧・事業継続計画
```bash
# 📁 /scripts/disaster-recovery.sh
#!/bin/bash

# 災害復旧スクリプト
# RTO: 30分, RPO: 5分

set -e

BACKUP_BUCKET="ai-subsidy-backups"
REGION="ap-northeast-1"
CLUSTER_NAME="ai-subsidy-production"

# データベース復旧
restore_database() {
    echo "🔄 Starting database restoration..."
    
    # 最新バックアップ取得
    LATEST_BACKUP=$(aws rds describe-db-snapshots \
        --db-instance-identifier ai-subsidy-production \
        --snapshot-type manual \
        --query 'DBSnapshots[0].DBSnapshotIdentifier' \
        --output text)
    
    # データベースインスタンス復元
    aws rds restore-db-instance-from-db-snapshot \
        --db-instance-identifier ai-subsidy-recovery \
        --db-snapshot-identifier $LATEST_BACKUP \
        --db-instance-class db.t3.medium
        
    echo "✅ Database restoration initiated"
}

# ファイルストレージ復旧
restore_file_storage() {
    echo "🔄 Restoring file storage..."
    
    # S3同期
    aws s3 sync s3://$BACKUP_BUCKET/files/ s3://ai-subsidy-files-recovery/
    
    echo "✅ File storage restored"
}

# Kubernetes復旧
restore_kubernetes() {
    echo "🔄 Restoring Kubernetes services..."
    
    # kubeconfig更新
    aws eks update-kubeconfig --region $REGION --name $CLUSTER_NAME
    
    # サービス復旧
    kubectl apply -f kubernetes/
    
    # ポッド再起動
    kubectl rollout restart deployment -n ai-subsidy
    
    echo "✅ Kubernetes services restored"
}

# 復旧実行
main() {
    echo "🚨 Starting disaster recovery process..."
    
    restore_database &
    restore_file_storage &
    restore_kubernetes &
    
    wait
    
    echo "✅ Disaster recovery completed"
    echo "🔍 Please verify all services are functioning correctly"
}

main "$@"
```

## 🔧 開発環境強化

### ローカル開発環境最適化
```bash
# 📁 /scripts/dev-setup.sh
#!/bin/bash

# 開発環境セットアップスクリプト
set -e

echo "🚀 Setting up AI Subsidy development environment..."

# 必要ツールのインストールチェック
check_requirements() {
    echo "📋 Checking requirements..."
    
    command -v docker >/dev/null 2>&1 || { echo "❌ Docker is required but not installed."; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo "❌ Docker Compose is required but not installed."; exit 1; }
    command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required but not installed."; exit 1; }
    command -v git >/dev/null 2>&1 || { echo "❌ Git is required but not installed."; exit 1; }
    
    echo "✅ All requirements satisfied"
}

# 環境変数設定
setup_environment() {
    echo "🔧 Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        echo "📝 Created .env file from template"
        echo "⚠️  Please update .env with your configuration"
    fi
}

# Docker環境構築
setup_docker() {
    echo "🐳 Setting up Docker environment..."
    
    # イメージビルド
    docker-compose -f docker-compose.dev.yml build
    
    # サービス起動
    docker-compose -f docker-compose.dev.yml up -d
    
    echo "✅ Docker environment ready"
}

# データベース初期化
setup_database() {
    echo "🗄️ Setting up database..."
    
    # マイグレーション実行
    cd backend
    npm install
    npx prisma migrate dev
    npx prisma db seed
    cd ..
    
    echo "✅ Database initialized"
}

# フロントエンド環境
setup_frontend() {
    echo "🎨 Setting up frontend..."
    
    cd frontend
    npm install
    npm run build
    cd ..
    
    echo "✅ Frontend ready"
}

# 開発ツール設定
setup_dev_tools() {
    echo "🛠️ Setting up development tools..."
    
    # Git hooks
    if [ ! -f .git/hooks/pre-commit ]; then
        echo "#!/bin/sh" > .git/hooks/pre-commit
        echo "npm run lint:check" >> .git/hooks/pre-commit
        chmod +x .git/hooks/pre-commit
    fi
    
    # VSCode設定
    mkdir -p .vscode
    cat > .vscode/settings.json << EOF
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "tailwindCSS.includeLanguages": {
    "typescript": "javascript",
    "typescriptreact": "javascript"
  }
}
EOF
    
    echo "✅ Development tools configured"
}

# ヘルスチェック
health_check() {
    echo "🔍 Running health check..."
    
    # サービス起動待機
    sleep 10
    
    # バックエンドヘルスチェック
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        echo "✅ Backend service is healthy"
    else
        echo "❌ Backend service is not responding"
    fi
    
    # フロントエンドチェック
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        echo "✅ Frontend service is healthy"
    else
        echo "❌ Frontend service is not responding"
    fi
    
    # データベースチェック
    if docker-compose -f docker-compose.dev.yml exec postgres pg_isready > /dev/null 2>&1; then
        echo "✅ Database is ready"
    else
        echo "❌ Database is not ready"
    fi
}

# メイン実行
main() {
    check_requirements
    setup_environment
    setup_docker
    setup_database
    setup_frontend
    setup_dev_tools
    health_check
    
    echo ""
    echo "🎉 Development environment setup completed!"
    echo ""
    echo "📍 Available services:"
    echo "   Frontend:  http://localhost:3000"
    echo "   Backend:   http://localhost:3001"
    echo "   API Docs:  http://localhost:3001/api-docs"
    echo ""
    echo "🔧 Useful commands:"
    echo "   ./start.sh    - Start all services"
    echo "   ./stop.sh     - Stop all services"
    echo "   ./status.sh   - Check service status"
    echo "   ./logs.sh     - View service logs"
}

main "$@"
```

## 📊 監視・メトリクス

### パフォーマンス監視ダッシュボード
```json
{
  "dashboard": {
    "title": "AI Subsidy System Monitoring",
    "panels": [
      {
        "title": "Application Health",
        "type": "stat",
        "targets": [
          {
            "expr": "up{job=\"ai-subsidy-backend\"}",
            "legendFormat": "Backend Status"
          },
          {
            "expr": "up{job=\"ai-subsidy-frontend\"}",
            "legendFormat": "Frontend Status"
          }
        ]
      },
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"ai-subsidy-backend\"}[5m])",
            "legendFormat": "Requests/sec"
          }
        ]
      },
      {
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"ai-subsidy-backend\"}[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=\"ai-subsidy-backend\"}[5m]))",
            "legendFormat": "50th percentile"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"ai-subsidy-backend\",status=~\"5..\"}[5m]) / rate(http_requests_total{job=\"ai-subsidy-backend\"}[5m])",
            "legendFormat": "Error Rate"
          }
        ]
      },
      {
        "title": "AI Service Metrics",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(ai_requests_total[5m])",
            "legendFormat": "AI Requests/sec"
          },
          {
            "expr": "histogram_quantile(0.95, rate(ai_request_duration_seconds_bucket[5m]))",
            "legendFormat": "AI Response Time (95th)"
          }
        ]
      },
      {
        "title": "Database Performance",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(database_queries_total[5m])",
            "legendFormat": "Queries/sec"
          },
          {
            "expr": "database_connections_active",
            "legendFormat": "Active Connections"
          }
        ]
      },
      {
        "title": "Resource Usage",
        "type": "graph",
        "targets": [
          {
            "expr": "100 - (avg(irate(node_cpu_seconds_total{mode=\"idle\"}[5m])) * 100)",
            "legendFormat": "CPU Usage %"
          },
          {
            "expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100",
            "legendFormat": "Memory Usage %"
          }
        ]
      }
    ]
  }
}
```

## 🔐 セキュリティ・コンプライアンス

### セキュリティスキャン自動化
```yaml
# 📁 /.github/workflows/security-scan.yml
name: Security Scan

on:
  schedule:
    - cron: '0 2 * * *'  # 毎日午前2時に実行
  workflow_dispatch:

jobs:
  vulnerability-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'
          
      - name: Upload to GitHub Security Tab
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: 'trivy-results.sarif'
          
  dependency-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run OWASP Dependency Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: 'ai-subsidy-system'
          path: '.'
          format: 'ALL'
          
  secret-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
          
      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: main
          head: HEAD
```

### コンプライアンス設定
```yaml
# 📁 /kubernetes/policies/network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ai-subsidy-network-policy
  namespace: ai-subsidy
spec:
  podSelector:
    matchLabels:
      app: ai-subsidy-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ai-subsidy
    - podSelector:
        matchLabels:
          app: ai-subsidy-frontend
    ports:
    - protocol: TCP
      port: 3001
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: kube-system
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 6379  # Redis
    - protocol: TCP
      port: 443   # HTTPS
    - protocol: TCP
      port: 53    # DNS
    - protocol: UDP
      port: 53    # DNS
```

## 🤝 チーム連携・運用

### 他チームとの連携インターフェース
```bash
# 📁 /scripts/team-coordination.sh

# チームA（フロントエンド）との連携
deploy_frontend() {
    echo "🎨 Deploying frontend updates..."
    
    # 環境変数注入
    kubectl create configmap frontend-config \
        --from-env-file=frontend/.env.production \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # デプロイ実行
    kubectl set image deployment/ai-subsidy-frontend \
        frontend=ghcr.io/ai-subsidy/frontend:$1 -n ai-subsidy
    
    # ロールアウト監視
    kubectl rollout status deployment/ai-subsidy-frontend -n ai-subsidy
}

# チームB（バックエンド）との連携
deploy_backend() {
    echo "⚙️ Deploying backend updates..."
    
    # シークレット更新
    kubectl create secret generic backend-secrets \
        --from-env-file=backend/.env.production \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # データベースマイグレーション実行
    kubectl run migration-job-$(date +%s) \
        --image=ghcr.io/ai-subsidy/backend:$1 \
        --restart=Never \
        --rm -i --tty \
        --env-from=secretRef:backend-secrets \
        -- npx prisma migrate deploy
    
    # デプロイ実行
    kubectl set image deployment/ai-subsidy-backend \
        backend=ghcr.io/ai-subsidy/backend:$1 -n ai-subsidy
}

# チームC（AI）との連携
deploy_ai_services() {
    echo "🤖 Deploying AI service updates..."
    
    # AI設定更新
    kubectl create configmap ai-config \
        --from-file=ai-engine/config/ \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # AIワーカー更新
    kubectl set image deployment/ai-worker \
        ai-worker=ghcr.io/ai-subsidy/ai-engine:$1 -n ai-subsidy
}
```

### 障害対応プロセス
```bash
# 📁 /scripts/incident-response.sh
#!/bin/bash

# インシデント対応スクリプト
set -e

INCIDENT_LEVEL=$1  # critical, major, minor
COMPONENT=$2       # frontend, backend, database, ai

# アラート通知
notify_team() {
    local level=$1
    local component=$2
    local message=$3
    
    # Slack通知
    curl -X POST $SLACK_WEBHOOK_URL \
        -H 'Content-type: application/json' \
        --data "{
            \"text\": \"🚨 $level incident detected in $component: $message\",
            \"channel\": \"#incidents\",
            \"username\": \"AlertBot\"
        }"
    
    # PagerDuty通知（Critical のみ）
    if [ "$level" = "critical" ]; then
        curl -X POST https://events.pagerduty.com/v2/enqueue \
            -H 'Content-Type: application/json' \
            -d "{
                \"routing_key\": \"$PAGERDUTY_ROUTING_KEY\",
                \"event_action\": \"trigger\",
                \"payload\": {
                    \"summary\": \"Critical incident in $component\",
                    \"severity\": \"critical\",
                    \"source\": \"ai-subsidy-system\"
                }
            }"
    fi
}

# 自動復旧試行
auto_recovery() {
    local component=$1
    
    case $component in
        "frontend")
            kubectl rollout restart deployment/ai-subsidy-frontend -n ai-subsidy
            ;;
        "backend")
            kubectl rollout restart deployment/ai-subsidy-backend -n ai-subsidy
            ;;
        "database")
            # データベース接続プールリセット
            kubectl exec -it deployment/ai-subsidy-backend -n ai-subsidy -- \
                node -e "require('./scripts/reset-db-pool.js')"
            ;;
        "ai")
            kubectl rollout restart deployment/ai-worker -n ai-subsidy
            ;;
    esac
}

# 診断情報収集
collect_diagnostics() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local output_dir="diagnostics_$timestamp"
    
    mkdir -p $output_dir
    
    # Kubernetes情報
    kubectl get pods -n ai-subsidy > $output_dir/pods.txt
    kubectl describe pods -n ai-subsidy > $output_dir/pod_details.txt
    kubectl logs -n ai-subsidy --all-containers=true > $output_dir/logs.txt
    
    # メトリクス情報
    curl -s "http://prometheus:9090/api/v1/query?query=up" > $output_dir/service_status.json
    
    # アップロード
    tar -czf diagnostics_$timestamp.tar.gz $output_dir
    aws s3 cp diagnostics_$timestamp.tar.gz s3://ai-subsidy-diagnostics/
    
    echo "Diagnostics collected: s3://ai-subsidy-diagnostics/diagnostics_$timestamp.tar.gz"
}

# メイン処理
main() {
    echo "🚨 Incident Response: $INCIDENT_LEVEL level incident in $COMPONENT"
    
    # 通知送信
    notify_team $INCIDENT_LEVEL $COMPONENT "Automated incident response initiated"
    
    # 診断情報収集
    collect_diagnostics
    
    # 自動復旧試行（Minor/Major のみ）
    if [ "$INCIDENT_LEVEL" != "critical" ]; then
        echo "🔄 Attempting automatic recovery..."
        auto_recovery $COMPONENT
        
        # 復旧確認
        sleep 60
        if kubectl get pods -n ai-subsidy | grep -q "Running"; then
            notify_team "info" $COMPONENT "Automatic recovery successful"
        else
            notify_team "warning" $COMPONENT "Automatic recovery failed - manual intervention required"
        fi
    else
        echo "⚠️ Critical incident - manual intervention required"
    fi
}

main "$@"
```

## 📚 学習・ドキュメント

### 必須学習リソース
- **Kubernetes Documentation**: https://kubernetes.io/docs/
- **AWS EKS Best Practices**: https://aws.github.io/aws-eks-best-practices/
- **Terraform Documentation**: https://www.terraform.io/docs
- **Prometheus Monitoring**: https://prometheus.io/docs/
- **Docker Best Practices**: https://docs.docker.com/develop/dev-best-practices/

### 運用ドキュメント
```markdown
# 📁 /docs/operations/README.md

# 運用ガイド

## 日次運用チェックリスト
- [ ] システム状態確認（kubectl get pods）
- [ ] メトリクス確認（Grafana ダッシュボード）
- [ ] ログ確認（CloudWatch/ELK）
- [ ] バックアップ状態確認
- [ ] セキュリティアラート確認

## 週次運用チェックリスト
- [ ] パフォーマンス分析レポート作成
- [ ] コスト分析レポート作成
- [ ] セキュリティスキャン実行
- [ ] 依存関係更新確認
- [ ] 災害復旧テスト実行

## 月次運用チェックリスト
- [ ] キャパシティプランニング見直し
- [ ] インフラコスト最適化
- [ ] セキュリティポリシー見直し
- [ ] 監視・アラート設定見直し
- [ ] 災害復旧計画更新
```

---

**🎯 最終目標**: 24/7稼働可能な、スケーラブルで安全なエンタープライズグレードインフラを構築・運用する

**📞 緊急連絡**: チームリーダー（Slack: @team-d-infra、オンコール: +81-XXX-XXXX-XXXX）