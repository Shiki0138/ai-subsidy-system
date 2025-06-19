# AI補助金申請書自動作成システム

世界最高レベルのAI技術を活用した補助金申請書自動生成プラットフォーム

## 🚀 クイックスタート

### 前提条件
- Node.js 20+
- Docker & Docker Compose
- Git

### セットアップ手順

```bash
# リポジトリクローン
git clone <repository-url>
cd ai-subsidy-system

# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env.local

# データベース起動
docker-compose up -d

# 開発サーバー起動
npm run dev
```

## 🏗️ プロジェクト構成

```
ai-subsidy-system/
├── frontend/           # Next.js アプリケーション
├── backend/           # API サーバー
├── ai-engine/         # AI処理エンジン
├── database/          # データベーススキーマ
├── docs/             # ドキュメント
└── docker/           # コンテナ設定
```

## 🔒 セキュリティ

- データは全て暗号化保存
- AI処理時はデータ匿名化
- 国内データセンター利用
- ゼロトラスト原則採用

## 📊 主要機能

- ワンクリック申請書生成
- 5つの主要補助金対応
- リアルタイム編集
- PDF自動出力
- 採択率向上支援