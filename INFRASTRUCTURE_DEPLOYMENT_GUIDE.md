# 🏗️ AI補助金システム インフラ構築ガイド

## 📋 概要

チームDのインフラ担当として、AI補助金申請システムの本番環境インフラを構築しました。
このガイドでは、Terraform、Kubernetes、CI/CD、監視システムの完全なセットアップ手順を説明します。

## 🎯 完成した成果物

### ✅ 高優先度タスク（完了）
1. **本番環境クラウドインフラ構築（Terraform設定）**
2. **Kubernetes マニフェスト作成（デプロイメント・サービス・HPA）**
3. **包括的CI/CDパイプライン構築（GitHub Actions）**

### ✅ 中優先度タスク（完了）
4. **開発環境セットアップスクリプト作成**
5. **監視・アラートシステム設定（Prometheus・Grafana）**

## 🚀 構築手順

### 1. Terraform による AWS インフラ構築

```bash
# Terraformディレクトリに移動
cd infrastructure/terraform

# 設定ファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# terraform.tfvars を編集（パスワード等を設定）
nano terraform.tfvars

# Terraform初期化
terraform init

# プランの確認
terraform plan

# インフラ構築実行
terraform apply
```

**構築されるリソース:**
- VPC（パブリック・プライベートサブネット）
- EKS クラスター
- RDS PostgreSQL
- ElastiCache Redis
- セキュリティグループ
- IAM ロール

### 2. Kubernetes デプロイ

```bash
# EKS クラスターに接続
aws eks update-kubeconfig --region ap-northeast-1 --name ai-subsidy-production

# Namespace作成
kubectl apply -f kubernetes/namespace.yaml

# シークレット設定（実際の値に置換が必要）
kubectl apply -f kubernetes/secrets.yaml

# ConfigMap設定
kubectl apply -f kubernetes/configmaps.yaml

# RBAC設定
kubectl apply -f kubernetes/rbac.yaml

# ストレージ設定
kubectl apply -f kubernetes/pvc.yaml

# アプリケーションデプロイ
kubectl apply -f kubernetes/deployments/

# Ingress設定
kubectl apply -f kubernetes/ingress.yaml
```

### 3. CI/CD パイプライン設定

GitHub Actionsワークフローが自動で以下を実行：

**CI（継続的インテグレーション）:**
- セキュリティスキャン（Trivy）
- フロントエンド：Lint、型チェック、テスト、ビルド
- バックエンド：Lint、型チェック、テスト、マイグレーション
- Dockerイメージビルド・プッシュ

**CD（継続的デプロイ）:**
- 開発環境自動デプロイ（developブランチ）
- 本番環境自動デプロイ（mainブランチ）
- スモークテスト実行

### 4. 開発環境セットアップ

```bash
# 開発環境自動セットアップ
./scripts/dev-setup.sh

# 個別操作
./scripts/logs.sh [service]        # ログ確認
./scripts/reset-db.sh              # DB リセット
./scripts/backup.sh                # バックアップ作成
```

### 5. 監視システム デプロイ

```bash
# 監視システム一括デプロイ
./scripts/deploy-monitoring.sh

# 個別確認
kubectl port-forward -n monitoring svc/prometheus 9090:9090  # Prometheus
kubectl port-forward -n monitoring svc/grafana 3000:3000    # Grafana
```

## 🔧 主要機能

### セキュリティ
- 全通信HTTPS化
- ネットワーク分離（VPC、セキュリティグループ）
- Pod間通信制御（NetworkPolicy）
- シークレット管理（Kubernetes Secrets）
- 脆弱性スキャン自動化

### スケーラビリティ
- Horizontal Pod Autoscaler（CPU/メモリベース）
- EKS ノードグループ自動スケーリング
- ロードバランサー（ALB）
- Redis クラスター

### 可用性
- マルチAZ構成
- ローリングアップデート
- ヘルスチェック
- 自動復旧

### 監視・運用
- Prometheus メトリクス収集
- Grafana ダッシュボード
- アラート設定（Critical/Warning）
- ログ集約

## 📊 監視項目

### アプリケーション監視
- サービス稼働状況
- レスポンス時間（95th percentile）
- エラー率
- リクエスト量

### インフラ監視
- CPU/メモリ使用率
- ディスク容量
- ネットワーク使用量
- Pod再起動回数

### AI サービス監視
- AI API レスポンス時間
- AI API エラー率
- トークン使用量

## 🚨 アラート設定

### Critical（緊急）
- アプリケーション停止
- 高エラー率（>10%）
- メモリ使用率高（>90%）
- DB接続失敗

### Warning（警告）
- 高レスポンス時間（>2秒）
- CPU使用率高（>85%）
- Pod頻繁再起動
- SSL証明書期限切れ間近

## 🔑 環境変数・シークレット

### 設定が必要なシークレット
```bash
# データベース
DATABASE_URL=postgresql://user:pass@rds-endpoint:5432/dbname

# Redis
REDIS_URL=rediss://:token@redis-endpoint:6379/0

# AI APIs
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# アプリケーション
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

## 📈 パフォーマンス最適化

### フロントエンド
- Next.js SSG/ISR
- CDN配信（CloudFront）
- 画像最適化
- バンドルサイズ最適化

### バックエンド
- データベース接続プール
- Redis キャッシュ
- API レスポンス圧縮
- 非同期処理

### インフラ
- Auto Scaling
- ロードバランサー
- マルチリージョン対応準備

## 🔧 運用コマンド

### 日次運用
```bash
# サービス状況確認
kubectl get pods -n ai-subsidy
kubectl get services -n ai-subsidy

# ログ確認
./scripts/logs.sh all

# メトリクス確認
# Grafana ダッシュボードで確認
```

### 緊急時対応
```bash
# ポッド再起動
kubectl rollout restart deployment/ai-subsidy-backend -n ai-subsidy

# スケール調整
kubectl scale deployment/ai-subsidy-backend --replicas=5 -n ai-subsidy

# ログ収集
kubectl logs -f deployment/ai-subsidy-backend -n ai-subsidy
```

## 📋 チェックリスト

### デプロイ前確認
- [ ] Terraform設定値確認
- [ ] シークレット設定
- [ ] ドメイン・SSL証明書設定
- [ ] バックアップ設定

### デプロイ後確認
- [ ] 全サービス起動確認
- [ ] ヘルスチェック正常
- [ ] 監視アラート動作確認
- [ ] パフォーマンステスト実行

## 🎯 今後の改善予定

### Phase 2（中期）
- マルチリージョン対応
- 詳細ログ分析（ELK Stack）
- コスト最適化自動化
- 災害復旧テスト自動化

### Phase 3（長期）
- サービスメッシュ導入（Istio）
- GitOps（ArgoCD）
- AI推論最適化
- エッジコンピューティング対応

---

**🏗️ チームD インフラ担当より**

AI補助金申請システムの堅牢で拡張性のあるインフラを構築しました。24/7運用可能なエンタープライズグレードの環境として、高可用性・セキュリティ・監視を重視した設計となっています。

**緊急連絡先**: チームD インフラ担当（Slack: @team-d-infra）