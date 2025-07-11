# 🤖 AI補助金申請書自動作成システム

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)

世界最高レベルのAI技術を活用した革新的な補助金申請書自動生成プラットフォーム

## 🚀 特徴

- **🎯 ワンクリック申請書生成**: AI（GPT-4 + Claude）による高精度な申請書自動作成
- **🏢 企業情報自動抽出**: Webサイトや法人番号から企業情報を自動取得
- **💬 リアルタイム共同編集**: WebSocketによる複数人での同時編集対応
- **📊 採択率向上支援**: 過去の採択事例分析による最適化提案
- **🔒 エンタープライズセキュリティ**: JWT認証、暗号化、レート制限実装
- **📱 完全レスポンシブ対応**: モバイル・タブレット・デスクトップ対応

## 🛠️ 技術スタック

### フロントエンド
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全な開発
- **Tailwind CSS** - ユーティリティファーストCSS
- **React Query** - データフェッチング管理

### バックエンド
- **Node.js 20+** - JavaScript ランタイム
- **Express.js** - Web フレームワーク
- **Prisma ORM** - データベースORM
- **Socket.io** - リアルタイム通信

### AI/ML
- **OpenAI GPT-4** - 文章生成
- **Anthropic Claude 3.5** - 高度な文章理解
- **Puppeteer** - Webスクレイピング

### インフラ
- **PostgreSQL 15** - メインデータベース
- **Redis 7** - キャッシュ・セッション管理
- **Docker** - コンテナ化
- **GitHub Actions** - CI/CD

## 📋 前提条件

- Node.js 20以上
- Docker & Docker Compose
- PostgreSQL 15
- Redis 7
- Git

## 🔧 セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/ai-subsidy-system.git
cd ai-subsidy-system
```

### 2. 環境変数の設定

```bash
cp .env.example .env
# .envファイルを編集して必要な情報を設定
```

### 3. 依存関係のインストール

```bash
# バックエンド
cd backend
npm install

# フロントエンド
cd ../frontend
npm install
```

### 4. データベースのセットアップ

```bash
# Dockerでデータベースを起動
docker-compose up -d postgres redis

# マイグレーション実行
cd backend
npx prisma migrate dev
```

### 5. 開発サーバーの起動

```bash
# ルートディレクトリから
npm run dev

# または個別に起動
# バックエンド (ポート7001)
cd backend && npm run dev

# フロントエンド (ポート7000)
cd frontend && npm run dev
```

## 🚢 本番環境デプロイ

詳細は[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)を参照してください。

### Docker Composeを使用

```bash
docker-compose -f docker-compose.production.yml up -d
```

### GitHub Actionsによる自動デプロイ

mainブランチへのプッシュで自動的にデプロイが実行されます。

必要なGitHub Secrets:
- `HOST` - デプロイ先サーバーIP
- `USERNAME` - SSHユーザー名
- `SSH_KEY` - SSH秘密鍵
- `OPENAI_API_KEY` - OpenAI APIキー
- `ANTHROPIC_API_KEY` - Anthropic APIキー
- その他環境変数

## 📚 ドキュメント

- [システム概要](./SYSTEM_OVERVIEW.md)
- [開発ガイド](./DEVELOPMENT_RULES.md)
- [APIドキュメント](./docs/API.md)
- [デプロイガイド](./DEPLOYMENT_GUIDE.md)
- [トラブルシューティング](./docs/TROUBLESHOOTING.md)

## 🔐 セキュリティ

- すべてのデータは暗号化して保存
- API通信はHTTPS必須
- レート制限によるDDoS対策
- 定期的なセキュリティ監査実施

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを作成して変更内容について議論してください。

1. プロジェクトをフォーク
2. フィーチャーブランチを作成 (`git checkout -b feature/AmazingFeature`)
3. 変更をコミット (`git commit -m 'Add some AmazingFeature'`)
4. ブランチにプッシュ (`git push origin feature/AmazingFeature`)
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています。詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## 🙏 謝辞

- OpenAI - GPT-4 API提供
- Anthropic - Claude API提供
- 国税庁 - 法人番号システムAPI提供
- すべてのコントリビューター

## 📞 サポート

- **Issues**: [GitHub Issues](https://github.com/yourusername/ai-subsidy-system/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/ai-subsidy-system/discussions)
- **Email**: support@ai-subsidy-system.com

---

⭐️ このプロジェクトが役立ったら、スターをお願いします！