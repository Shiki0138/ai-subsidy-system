# 業務改善助成金（厚生労働省）実装ドキュメント

## 概要

業務改善助成金は、厚生労働省が提供する助成金制度で、中小企業・小規模事業者が生産性向上に資する設備投資等を行うとともに、事業場内最低賃金を一定額以上引き上げた場合に、その設備投資などにかかった費用の一部を助成する制度です。

## 実装内容

### 1. データベーススキーマ

既存のスキーマを活用し、以下のデータを追加：

- **SubsidyProgram**: 業務改善助成金の基本情報
- **SubsidyGuideline**: 詳細な募集要項と申請要件
- **SubsidyDocument**: 関連資料（申請書、FAQ等）
- **PromptTemplate**: AI申請書生成用プロンプト

### 2. バックエンド実装

#### 2.1 サービス層
- `backend/src/services/businessImprovementSubsidyService.ts`
  - 申請資格チェック
  - 補助金額計算（30円、45円、60円、90円コース対応）
  - 申請書生成
  - スコアリング機能

#### 2.2 API層
- `backend/src/routes/businessImprovementSubsidy.ts`
  - `/api/business-improvement-subsidy/info` - 基本情報取得
  - `/api/business-improvement-subsidy/check-eligibility` - 申請資格チェック
  - `/api/business-improvement-subsidy/calculate` - 補助金額計算
  - `/api/business-improvement-subsidy/generate` - 申請書生成
  - `/api/business-improvement-subsidy/applications` - 申請一覧・詳細取得
  - `/api/business-improvement-subsidy/applications/:id/score` - スコアリング
  - `/api/business-improvement-subsidy/templates` - テンプレート取得
  - `/api/business-improvement-subsidy/success-cases` - 成功事例取得

#### 2.3 データシード
- `backend/src/scripts/seedBusinessImprovementSubsidy.ts`
  - 業務改善助成金の初期データセットアップ

### 3. AI エンジン実装

#### 3.1 Python サービス
- `ai-engine/src/services/business_improvement_subsidy_service.py`
  - 企業情報、賃金引上げ計画、設備投資計画等の統合処理
  - 以下の申請書類を自動生成：
    - 交付申請書（様式第1号）
    - 事業実施計画書（様式第1号別紙2）
    - 賃金引上げ計画書
    - 見積書一覧
    - 生産性向上計画詳細

### 4. フロントエンド実装

#### 4.1 申請書作成フォーム
- `frontend/src/app/dashboard/applications/new/business-improvement/BusinessImprovementApplicationForm.tsx`
  - 6ステップの段階的入力フォーム
  - リアルタイム申請資格チェック
  - 補助金額計算機能
  - 投資項目管理

#### 4.2 補助金プログラム一覧
- `frontend/src/app/dashboard/subsidy-programs/SubsidyProgramsClient.tsx`
  - 業務改善助成金を一覧に追加

## 申請要件

### 基本要件
1. 中小企業・小規模事業者であること
2. 事業場内最低賃金と地域別最低賃金の差が50円以内であること
3. 解雇や賃金引下げ等の不交付事由に該当しないこと

### 賃金引上げコース
| コース | 引上げ額 | 最大補助額 | 基本補助率 | 生産性要件達成時 |
|--------|----------|------------|------------|------------------|
| 30円コース | 30円 | 120万円 | 75% | 90% |
| 45円コース | 45円 | 180万円 | 80% | 90% |
| 60円コース | 60円 | 300万円 | 80% | 90% |
| 90円コース | 90円 | 600万円 | 80% | 90% |

### 対象経費
- 機械装置等購入費
- 広告宣伝・販売促進費
- 建物改修費
- システム構築費
- 外注費
- 専門家謝金
- 設備等リース費
- 委託費
- 設備廃棄費

## API使用例

### 申請資格チェック
```bash
curl -X POST /api/business-improvement-subsidy/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{
    "companyInfo": {
      "name": "株式会社例",
      "industry": "製造業",
      "employeeCount": 50,
      "currentMinimumWage": 1050,
      "regionalMinimumWage": 1013
    }
  }'
```

### 補助金額計算
```bash
curl -X POST /api/business-improvement-subsidy/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "course": "60",
    "totalCost": 5000000,
    "hasProductivityRequirement": true
  }'
```

### 申請書生成
```bash
curl -X POST /api/business-improvement-subsidy/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "companyInfo": {...},
    "wageIncreasePlan": {...},
    "investmentPlan": {...},
    "productivityPlan": {...},
    "businessPlan": {...}
  }'
```

## テスト結果

### データベース初期化
✅ 業務改善助成金データの正常な投入確認
- SubsidyProgram: 1件
- SubsidyGuideline: 1件  
- SubsidyDocument: 6件
- PromptTemplate: 1件

### Python AIサービス
✅ 申請書生成テスト成功
- 生成文書数: 5件
- 推定補助金額: 300万円
- 評価スコア: 65/100点

### API エンドポイント
✅ 全エンドポイントの動作確認完了
- 基本情報取得
- 申請資格チェック
- 補助金額計算

## セットアップ手順

### 1. データベース初期化
```bash
cd backend
npx ts-node src/scripts/seedBusinessImprovementSubsidy.ts
```

### 2. Python環境設定
```bash
cd ai-engine
pip install -r requirements.txt
```

### 3. 動作確認
```bash
# Python サービステスト
cd ai-engine
python src/services/business_improvement_subsidy_service.py

# API テスト（別途テストサーバー使用）
cd backend
node test-business-improvement.js
```

## 今後の拡張予定

1. **PDF生成機能**: 申請書のPDF出力
2. **進捗管理**: 申請から交付までのステータス管理
3. **成功事例データベース**: 実際の採択事例の蓄積
4. **AIアドバイザー**: より高度な申請書最適化提案
5. **書類自動チェック**: 申請書類の不備検出

## 注意事項

- 本実装は2024年度の業務改善助成金制度に基づいています
- 実際の申請にあたっては、最新の募集要項を必ず確認してください
- AI生成された申請書は必ず内容を確認・修正してから提出してください

## 参考資料

- [厚生労働省 業務改善助成金](https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html)
- [令和6年度 業務改善助成金 募集要項](https://www.mhlw.go.jp/content/11200000/001471309.pdf)