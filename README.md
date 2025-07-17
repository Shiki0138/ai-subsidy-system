# 🤖 AI補助金申請書自動作成システム

[![GitHub License](https://img.shields.io/github/license/Shiki0138/ai-subsidy-system)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)

AI技術を活用して日本の各種補助金申請書を自動生成する包括的なシステムです。

## ✨ 主な機能

### 🎯 対応補助金
- **🏭 小規模事業者持続化補助金** - 全7様式対応
- **⚙️ ものづくり補助金** - 革新的設備投資支援
- **💼 業務改善助成金** - 厚生労働省助成金（**新機能！**）
- **🔄 事業再構築補助金** - ポストコロナ対応
- **💻 IT導入補助金** - デジタル化支援

### 🚀 AI機能
- **自動申請書生成**: Claude 3.5 Sonnet & GPT-4による高品質な申請書作成
- **適格性チェック**: 申請要件の自動判定
- **補助金マッチング**: 企業プロフィールに基づく最適補助金推薦
- **リアルタイム計算**: 補助金額・補助率の即座計算
- **スコアリング**: 申請書の採択可能性評価

### 📋 業務改善助成金の特徴
- **4段階コース対応**: 30円・45円・60円・90円の賃金引上げコース
- **最大600万円**: 90%補助率（生産性要件達成時）
- **自動資格判定**: 中小企業要件・賃金差額チェック
- **包括的書類生成**: 
  - 交付申請書（様式第1号）
  - 事業実施計画書（様式第1号別紙2）
  - 賃金引上げ計画書
  - 見積書一覧
  - 生産性向上計画詳細

## 🚀 クイックスタート

### 前提条件
- Node.js 20+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker & Docker Compose

### 1. リポジトリクローン
```bash
git clone https://github.com/Shiki0138/ai-subsidy-system.git
cd ai-subsidy-system
```

### 2. 環境変数設定
```bash
# Backend
cp backend/.env.example backend/.env
# 必要なAPI キーを設定
# - ANTHROPIC_API_KEY
# - OPENAI_API_KEY  
# - DATABASE_URL
# - REDIS_URL

# Frontend
cp frontend/.env.example frontend/.env
```

### 3. データベース初期化
```bash
cd backend
npm install
npx prisma migrate dev
npx prisma generate
```

### 4. 補助金データシード
```bash
# 基本補助金データ
npm run db:seed

# 業務改善助成金データ
npx ts-node src/scripts/seedBusinessImprovementSubsidy.ts
```

### 5. アプリケーション起動
```bash
# Backend
cd backend && npm run dev

# Frontend  
cd frontend && npm run dev

# AI Engine
cd ai-engine && python -m uvicorn main:app --reload
```

## 🏗️ システム構成

```
📦 ai-subsidy-system
├── 🖥️ frontend/          # Next.js + React Frontend
├── ⚙️ backend/           # Express.js + TypeScript API
├── 🤖 ai-engine/         # Python AI Services
├── 🗄️ database/          # PostgreSQL + Prisma
├── ☁️ infrastructure/    # Terraform + Kubernetes
└── 📚 docs/             # Documentation
```

### 技術スタック

#### Frontend
- **Next.js 14** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Heroicons** - アイコン

#### Backend
- **Express.js** - Web フレームワーク
- **Prisma** - ORM
- **PostgreSQL** - データベース
- **Redis** - キャッシュ・セッション
- **Winston** - ログ管理

#### AI Engine
- **Python 3.11+** - メイン言語
- **Anthropic Claude 3.5** - 主要AI
- **OpenAI GPT-4** - 補助AI
- **LangChain** - AI統合

#### Infrastructure
- **Docker** - コンテナ化
- **Kubernetes** - オーケストレーション
- **Terraform** - インフラ管理
- **Prometheus** - モニタリング

## 📖 使用方法

### 業務改善助成金申請の流れ

1. **企業情報入力** - 基本的な会社情報
2. **賃金引上げ計画** - コース選択と目標賃金設定
3. **設備投資計画** - 生産性向上のための投資内容
4. **生産性向上計画** - 具体的な改善施策
5. **事業計画** - 目標と実施計画
6. **申請書生成** - AIによる自動生成

### API使用例

```typescript
// 申請資格チェック
const eligibility = await fetch('/api/business-improvement-subsidy/check-eligibility', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyInfo: {
      name: "株式会社例",
      industry: "製造業", 
      employeeCount: 50,
      currentMinimumWage: 1050,
      regionalMinimumWage: 1013
    }
  })
});

// 補助金額計算
const calculation = await fetch('/api/business-improvement-subsidy/calculate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    course: "60",
    totalCost: 5000000,
    hasProductivityRequirement: true
  })
});
```

## 🔒 セキュリティ

- **JWT認証** - セキュアなユーザー認証
- **レート制限** - API不正利用防止
- **CORS設定** - クロスオリジン制御
- **Helmet.js** - セキュリティヘッダー
- **入力検証** - Zod スキーマ検証
- **データ暗号化** - 機密情報保護

## 🧪 テスト

```bash
# Backend テスト
cd backend && npm test

# Frontend テスト  
cd frontend && npm test

# AI Engine テスト
cd ai-engine && python -m pytest

# 統合テスト
npm run test:integration
```

## 📊 モニタリング

- **Prometheus** - メトリクス収集
- **Grafana** - 可視化ダッシュボード
- **Winston** - 構造化ログ
- **Health Check** - サービス稼働監視

## 🚀 デプロイ

### Docker Compose (開発)
```bash
docker-compose up -d
```

### Kubernetes (本番)
```bash
kubectl apply -f kubernetes/
```

### Terraform (インフラ)
```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## 🤝 コントリビューション

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

## 📞 サポート

- 🐛 バグ報告: [Issues](https://github.com/Shiki0138/ai-subsidy-system/issues)
- 💡 機能リクエスト: [Discussions](https://github.com/Shiki0138/ai-subsidy-system/discussions)

## 🙏 謝辞

- 厚生労働省・経済産業省等の補助金制度情報
- Anthropic Claude & OpenAI の AI技術
- オープンソースコミュニティの皆様

---

**🎯 日本の中小企業のDX化と成長を、AI技術で支援します**// Trigger rebuild
