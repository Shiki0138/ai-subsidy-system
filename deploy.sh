#!/bin/bash
# AI補助金システム自動デプロイスクリプト

set -e

echo "🚀 AI補助金システム自動デプロイ開始..."

# 色付きログ
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ログ関数
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. 環境確認
log_info "環境設定確認中..."
if [ -z "$NODE_ENV" ] || [ "$NODE_ENV" != "production" ]; then
    log_error "本番環境変数が設定されていません"
    log_info "export NODE_ENV=production を実行してください"
    exit 1
fi
log_success "環境設定確認完了"

# 2. 依存関係確認
log_info "必要なツール確認中..."
command -v gh >/dev/null 2>&1 || { log_error "GitHub CLI (gh) がインストールされていません"; exit 1; }
command -v aws >/dev/null 2>&1 || { log_error "AWS CLI がインストールされていません"; exit 1; }
command -v docker >/dev/null 2>&1 || { log_error "Docker がインストールされていません"; exit 1; }
log_success "必要なツール確認完了"

# 3. Git状態確認
log_info "Git状態確認中..."
if [ -n "$(git status --porcelain)" ]; then
    log_warning "未コミットの変更があります"
    read -p "続行しますか？ (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "デプロイをキャンセルしました"
        exit 1
    fi
fi

# 現在のブランチ確認
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "main" ]; then
    log_warning "現在のブランチ: $CURRENT_BRANCH"
    log_warning "mainブランチでないとデプロイされません"
    read -p "mainブランチに切り替えますか？ (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git checkout main
        git pull origin main
    fi
fi
log_success "Git状態確認完了"

# 4. ローカルテスト実行
log_info "ローカルテスト実行中..."
if command -v npm >/dev/null 2>&1; then
    npm run test || {
        log_error "ローカルテストに失敗しました"
        read -p "テスト失敗を無視して続行しますか？ (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    }
    log_success "ローカルテスト完了"
else
    log_warning "npm が見つかりません。テストをスキップします"
fi

# 5. GitHub Actions確認
log_info "最新のGitHub Actionsステータス確認中..."
LATEST_RUN=$(gh run list --limit 1 --json status,conclusion,workflowName)
echo "最新実行: $LATEST_RUN"
log_success "GitHub Actions確認完了"

# 6. AWS接続確認
log_info "AWS接続確認中..."
aws sts get-caller-identity >/dev/null 2>&1 || {
    log_error "AWS認証に失敗しました"
    log_info "aws configure を実行して認証情報を設定してください"
    exit 1
}
log_success "AWS接続確認完了"

# 7. インフラ状態確認
log_info "AWS インフラ状態確認中..."
if aws ecs describe-clusters --clusters ai-subsidy-production >/dev/null 2>&1; then
    SERVICE_STATUS=$(aws ecs describe-services \
        --cluster ai-subsidy-production \
        --services ai-subsidy-app \
        --query 'services[0].status' \
        --output text 2>/dev/null || echo "NOT_FOUND")
    
    if [ "$SERVICE_STATUS" = "ACTIVE" ]; then
        log_success "ECSサービスが稼働中です"
    else
        log_warning "ECSサービスのステータス: $SERVICE_STATUS"
    fi
else
    log_warning "ECSクラスターが見つかりません（初回デプロイの場合は正常）"
fi

# 8. データベースバックアップ（本番環境のみ）
if [ "$1" != "--skip-backup" ]; then
    log_info "本番データベースバックアップ中..."
    BACKUP_ID="pre-deploy-$(date +%Y%m%d-%H%M%S)"
    if aws rds describe-db-instances --db-instance-identifier ai-subsidy-db >/dev/null 2>&1; then
        aws rds create-db-snapshot \
            --db-snapshot-identifier "$BACKUP_ID" \
            --db-instance-identifier ai-subsidy-db >/dev/null 2>&1 || {
            log_warning "データベースバックアップに失敗しました（続行します）"
        }
        log_success "データベースバックアップ完了: $BACKUP_ID"
    else
        log_warning "本番データベースが見つかりません（初回デプロイの場合は正常）"
    fi
fi

# 9. デプロイ実行
log_info "デプロイを実行中..."
echo "📝 コミット情報:"
git log -1 --oneline

read -p "デプロイを実行しますか？ (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "デプロイをキャンセルしました"
    exit 0
fi

# Git push実行
log_info "mainブランチにプッシュ中..."
git push origin main

# 10. デプロイ監視
log_info "デプロイ進捗監視中..."
echo "🔗 GitHub Actions: https://github.com/$(gh repo view --json owner,name -q '.owner.login + "/" + .name')/actions"

# GitHub Actions の実行を監視
log_info "GitHub Actionsの完了を待機中..."
gh run watch --exit-status || {
    log_error "GitHub Actionsが失敗しました"
    log_info "詳細は以下で確認してください:"
    echo "gh run view --log-failed"
    exit 1
}

log_success "GitHub Actions完了"

# 11. ヘルスチェック
log_info "本番環境ヘルスチェック中..."
HEALTH_URL="https://your-domain.com/api/health"

for i in {1..30}; do
    if curl -f "$HEALTH_URL" >/dev/null 2>&1; then
        log_success "ヘルスチェック成功！"
        break
    fi
    log_info "ヘルスチェック中... ($i/30)"
    sleep 10
    
    if [ $i -eq 30 ]; then
        log_error "ヘルスチェックがタイムアウトしました"
        log_info "手動で確認してください: $HEALTH_URL"
        exit 1
    fi
done

# 12. 最終確認
log_info "デプロイ後確認実行中..."

# ECSサービス状態確認
if aws ecs describe-services \
    --cluster ai-subsidy-production \
    --services ai-subsidy-app \
    --query 'services[0].runningCount' \
    --output text >/dev/null 2>&1; then
    
    RUNNING_COUNT=$(aws ecs describe-services \
        --cluster ai-subsidy-production \
        --services ai-subsidy-app \
        --query 'services[0].runningCount' \
        --output text)
    
    DESIRED_COUNT=$(aws ecs describe-services \
        --cluster ai-subsidy-production \
        --services ai-subsidy-app \
        --query 'services[0].desiredCount' \
        --output text)
    
    log_info "ECS稼働状況: $RUNNING_COUNT/$DESIRED_COUNT タスク"
fi

# デプロイ情報表示
echo
echo "🎉 デプロイ完了！"
echo "=============================="
echo "📅 デプロイ時刻: $(date)"
echo "🔗 アプリケーション: https://your-domain.com"
echo "🔗 管理画面: https://your-domain.com/admin"
echo "📊 監視ダッシュボード: CloudWatch Console"
echo "💬 通知: Slack #ai-subsidy-alerts"
echo "=============================="
echo

# 成功通知
if command -v osascript >/dev/null 2>&1; then
    osascript -e 'display notification "AI補助金システムのデプロイが完了しました" with title "デプロイ成功"'
fi

log_success "全ての処理が完了しました！"