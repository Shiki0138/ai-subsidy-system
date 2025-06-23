# AI補助金申請システム 機能追加実装指示書

**作成日**: 2025-06-20  
**プロジェクト管理者**: システム統括責任者  
**実装期間**: 2025-06-21 〜 2025-07-10（3週間）

---

## 🎯 実装目標

AI補助金申請システムを、申請前から事業完了後まで一気通貫でサポートする総合プラットフォームに進化させます。

### 追加実装する主要機能
1. **申請書フォーム自動入力機能** - 生成した内容を実際のフォームに反映
2. **事業進捗管理システム** - 申請後のプロジェクト管理
3. **結果報告機能** - 成果報告書作成支援
4. **添付書類作成支援** - 必要書類の自動生成
5. **募集要項取り込み強化** - 新規補助金への柔軟な対応

---

## 📊 現状分析サマリー

### ✅ 実装済み機能
- 基本情報入力（2項目簡易入力）
- AI補助金マッチング（スコアリング）
- 申請書自動生成（GPT-4/Claude）
- PDF出力・保存
- 募集要項スクレイピング基盤
- 自動入力提案生成（API実装済み）

### ❌ 未実装機能
- フォーム自動入力UI
- 進捗管理システム
- 結果報告機能
- 添付書類作成機能
- 募集要項の高度な解析

---

## 🏢 チーム編成と責任範囲

### チームA: バックエンド・データベース拡張
**リーダー**: バックエンドアーキテクト  
**メンバー**: 3名  
**期間**: Week 1-2

### チームB: フロントエンド・UI/UX
**リーダー**: フロントエンドリード  
**メンバー**: 3名  
**期間**: Week 1-3

### チームC: AI・自動化エンジン
**リーダー**: AIエンジニア  
**メンバー**: 2名  
**期間**: Week 1-2

### チームD: 統合・品質保証
**リーダー**: QAマネージャー  
**メンバー**: 2名  
**期間**: Week 2-3

---

## 📝 チーム別詳細タスク

### 🔷 チームA: バックエンド・データベース拡張

#### Week 1: データベース設計・API基盤

**1. 進捗管理スキーマ設計**
```prisma
// 追加するモデル例
model ProjectProgress {
  id              String   @id @default(cuid())
  applicationId   String
  userId          String
  
  // 基本情報
  projectName     String
  startDate       DateTime
  endDate         DateTime
  currentPhase    ProjectPhase
  overallProgress Int      // 0-100%
  
  // ステータス
  status          ProgressStatus
  lastUpdated     DateTime @updatedAt
  nextMilestone   DateTime?
  
  // リレーション
  application     Application @relation(fields: [applicationId], references: [id])
  user            User @relation(fields: [userId], references: [id])
  milestones      Milestone[]
  reports         ProgressReport[]
  
  @@map("project_progress")
}

model Milestone {
  id              String   @id @default(cuid())
  projectId       String
  
  title           String
  description     String
  dueDate         DateTime
  completedDate   DateTime?
  status          MilestoneStatus
  
  // 成果物
  deliverables    Json
  evidenceFiles   Evidence[]
  
  project         ProjectProgress @relation(fields: [projectId], references: [id])
  
  @@map("milestones")
}

model ResultReport {
  id              String   @id @default(cuid())
  applicationId   String
  
  // 報告内容
  reportType      ReportType
  reportPeriod    String
  kpiAchievements Json
  narrative       String
  
  // 財務情報
  actualExpenses  Json
  budgetVariance  Json
  
  // ステータス
  status          ReportStatus
  submittedAt     DateTime?
  approvedAt      DateTime?
  
  // 添付資料
  attachments     ReportAttachment[]
  
  application     Application @relation(fields: [applicationId], references: [id])
  
  @@map("result_reports")
}

model DocumentTemplate {
  id              String   @id @default(cuid())
  
  documentType    String   // 見積書、事業計画書、etc
  templateName    String
  description     String
  
  // テンプレート内容
  structure       Json     // ドキュメント構造
  defaultContent  Json     // デフォルト値
  requiredFields  Json     // 必須項目
  
  // メタデータ
  version         String
  isActive        Boolean  @default(true)
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@map("document_templates")
}
```

**2. API エンドポイント実装**
```typescript
// 進捗管理API
POST   /api/projects/:applicationId/progress
GET    /api/projects/:applicationId/progress
PUT    /api/projects/:applicationId/progress
DELETE /api/projects/:applicationId/progress

// マイルストーンAPI
POST   /api/projects/:projectId/milestones
GET    /api/projects/:projectId/milestones
PUT    /api/milestones/:id
DELETE /api/milestones/:id

// 結果報告API
POST   /api/applications/:id/reports
GET    /api/applications/:id/reports
PUT    /api/reports/:id
POST   /api/reports/:id/submit
POST   /api/reports/:id/approve

// 添付書類生成API
POST   /api/documents/generate
GET    /api/documents/templates
POST   /api/documents/templates
PUT    /api/documents/templates/:id
```

**3. 募集要項解析エンジン強化**
```typescript
// /backend/src/services/guidelineParserService.ts
export class GuidelineParserService {
  async parseNewGuideline(input: {
    url?: string;
    pdfFile?: Buffer;
    textContent?: string;
  }) {
    // 1. コンテンツ取得
    const content = await this.fetchContent(input);
    
    // 2. AI解析（Claude 3.5）
    const structured = await this.analyzeWithAI(content);
    
    // 3. スキーマ検証
    const validated = await this.validateSchema(structured);
    
    // 4. DB保存
    return await this.saveGuideline(validated);
  }
  
  async generateApplicationTemplate(guidelineId: string) {
    // 募集要項から申請書テンプレートを自動生成
  }
}
```

#### Week 2: 高度な機能実装

**4. 自動通知システム**
```typescript
// 進捗リマインダー、締切アラート、報告期限通知
export class NotificationService {
  async scheduleProgressReminders(projectId: string) {}
  async sendDeadlineAlerts() {}
  async notifyReportDue() {}
}
```

**5. データ分析・レポーティング**
```typescript
// 進捗分析、KPIダッシュボード用データ
export class AnalyticsService {
  async getProjectAnalytics(projectId: string) {}
  async generateProgressReport(projectId: string) {}
  async calculateKPITrends(applicationId: string) {}
}
```

### デリバラブル（チームA）
- [ ] 拡張DBスキーマ実装・マイグレーション
- [ ] 20+ 新規APIエンドポイント
- [ ] 募集要項パーサー強化版
- [ ] 通知・分析サービス
- [ ] APIドキュメント完成

---

### 🎨 チームB: フロントエンド・UI/UX

#### Week 1: 自動入力UI実装

**1. フォーム自動入力コンポーネント**
```typescript
// /frontend/src/components/forms/AutoFillForm.tsx 拡張
export const EnhancedAutoFillForm = () => {
  // 自動入力提案の表示
  // 提案内容の編集機能
  // ワンクリック反映
  // 差分表示・確認画面
  
  return (
    <div className="auto-fill-container">
      <AutoFillSuggestions />
      <SuggestionEditor />
      <DiffViewer />
      <ApplyButton />
    </div>
  );
};
```

**2. 進捗管理ダッシュボード**
```typescript
// /frontend/src/app/dashboard/progress/page.tsx
export default function ProgressDashboard() {
  return (
    <div className="progress-dashboard">
      <ProjectOverview />
      <MilestoneTimeline />
      <ProgressChart />
      <TaskList />
      <DocumentManager />
    </div>
  );
}
```

**3. 結果報告作成ウィザード**
```typescript
// /frontend/src/app/reports/create/page.tsx
export default function ReportWizard() {
  // ステップ形式の報告書作成
  // KPI入力支援
  // 証憑アップロード
  // プレビュー・提出
}
```

#### Week 2-3: 高度なUI機能

**4. 添付書類作成インターフェース**
```typescript
// /frontend/src/components/documents/DocumentCreator.tsx
export const DocumentCreator = () => {
  // テンプレート選択
  // フィールド入力
  // AI支援入力
  // リアルタイムプレビュー
  // PDF/Word出力
};
```

**5. 募集要項インポートUI**
```typescript
// /frontend/src/components/guidelines/GuidelineImporter.tsx
export const GuidelineImporter = () => {
  // URL/PDFアップロード
  // 解析進捗表示
  // 解析結果の確認・編集
  // 補助金プログラムとして登録
};
```

**6. 統合ダッシュボード改善**
- 申請前・申請中・実施中・完了の全フェーズ対応
- タイムライン表示
- アラート・通知センター
- ドキュメントライブラリ

### デリバラブル（チームB）
- [ ] 自動入力UI完成
- [ ] 進捗管理画面一式
- [ ] 結果報告ウィザード
- [ ] 添付書類作成UI
- [ ] 募集要項インポーター
- [ ] レスポンシブ対応

---

### 🤖 チームC: AI・自動化エンジン

#### Week 1: AI機能強化

**1. 高度な書類生成エンジン**
```python
# /ai-engine/src/services/document_generator.py
class AdvancedDocumentGenerator:
    def generate_budget_sheet(self, project_data):
        """予算書の自動生成"""
        pass
    
    def generate_business_plan(self, company_data, project_data):
        """事業計画書の自動生成"""
        pass
    
    def generate_progress_report(self, progress_data, kpi_data):
        """進捗報告書の自動生成"""
        pass
    
    def generate_final_report(self, results_data):
        """最終報告書の自動生成"""
        pass
```

**2. 募集要項解析AI強化**
```python
# /ai-engine/src/services/guideline_analyzer.py
class EnhancedGuidelineAnalyzer:
    def extract_requirements(self, guideline_text):
        """要件の構造化抽出"""
        # 申請資格、対象事業、補助率、上限額
        # 必要書類、評価基準、スケジュール
        pass
    
    def generate_application_schema(self, requirements):
        """申請書スキーマの自動生成"""
        pass
    
    def map_to_existing_fields(self, new_schema):
        """既存フィールドへのマッピング"""
        pass
```

**3. 進捗予測・リスク分析**
```python
# /ai-engine/src/services/progress_analyzer.py
class ProgressAnalyzer:
    def predict_delays(self, progress_data):
        """遅延リスクの予測"""
        pass
    
    def suggest_actions(self, current_status):
        """改善アクションの提案"""
        pass
    
    def analyze_budget_variance(self, planned, actual):
        """予実差異分析"""
        pass
```

#### Week 2: 自動化・最適化

**4. ドキュメント自動補完**
```python
class DocumentAutoComplete:
    def complete_missing_sections(self, partial_doc):
        """未入力セクションの自動補完"""
        pass
    
    def enhance_descriptions(self, basic_input):
        """説明文の自動拡張・改善"""
        pass
    
    def ensure_consistency(self, multi_docs):
        """複数書類間の整合性確保"""
        pass
```

**5. スマート通知エンジン**
```python
class SmartNotificationEngine:
    def determine_notification_timing(self, user_behavior):
        """最適な通知タイミングの決定"""
        pass
    
    def personalize_messages(self, user_profile):
        """パーソナライズされたメッセージ生成"""
        pass
```

### デリバラブル（チームC）
- [ ] 4種類以上の書類自動生成機能
- [ ] 募集要項解析精度95%以上
- [ ] 進捗予測モデル
- [ ] ドキュメント補完機能
- [ ] AIモデル性能レポート

---

### 🔧 チームD: 統合・品質保証

#### Week 2: 統合テスト

**1. E2Eテストシナリオ**
```typescript
// 完全なユーザージャーニーテスト
describe('補助金申請完全フロー', () => {
  it('新規募集要項の取り込みから報告書提出まで', async () => {
    // 1. 募集要項インポート
    // 2. 企業情報入力
    // 3. マッチング確認
    // 4. 申請書自動生成
    // 5. フォーム自動入力
    // 6. 添付書類作成
    // 7. 申請提出
    // 8. 進捗管理
    // 9. 結果報告
  });
});
```

**2. パフォーマンステスト**
- 大量データでの応答速度
- 同時アクセステスト
- AI処理のレスポンスタイム
- PDF生成速度

**3. セキュリティ監査**
- 新規エンドポイントの脆弱性診断
- データアクセス権限の検証
- 個人情報保護の確認

#### Week 3: 本番準備

**4. 統合ドキュメント作成**
- ユーザーマニュアル（新機能対応）
- 管理者ガイド
- API統合ガイド
- トラブルシューティングガイド

**5. デプロイメント準備**
- CI/CDパイプライン更新
- データベースマイグレーション計画
- ロールバック手順
- 監視・アラート設定

### デリバラブル（チームD）
- [ ] 包括的テストレポート
- [ ] パフォーマンス改善提案
- [ ] セキュリティ監査報告
- [ ] 完全なドキュメント一式
- [ ] デプロイメント準備完了

---

## 📅 実装スケジュール

### Week 1 (6/21-6/27)
- **チームA**: DBスキーマ設計、基本API実装
- **チームB**: 自動入力UI、進捗管理画面設計
- **チームC**: AI書類生成、募集要項解析強化
- **チームD**: テスト環境構築、テスト計画策定

### Week 2 (6/28-7/4)
- **チームA**: 高度な機能API、通知システム
- **チームB**: 報告書作成UI、添付書類UI
- **チームC**: 進捗予測、自動補完機能
- **チームD**: 統合テスト実施、性能測定

### Week 3 (7/5-7/10)
- **チームA**: API最終調整、ドキュメント
- **チームB**: UI統合、最終調整
- **チームC**: AIモデル最適化
- **チームD**: 最終テスト、本番準備

---

## 🎯 成功基準

### 機能要件
- ✅ 全ての指定機能が動作すること
- ✅ 既存機能との完全な統合
- ✅ エラー率1%未満

### 性能要件
- ✅ API応答時間: 95%が3秒以内
- ✅ 書類生成: 30秒以内
- ✅ 同時接続: 1000ユーザー対応

### 品質要件
- ✅ テストカバレッジ: 80%以上
- ✅ コードレビュー: 100%実施
- ✅ ドキュメント: 完全性100%

---

## 📞 コミュニケーション

### 定例会議
- **全体朝会**: 毎日 9:00-9:15
- **チーム別スクラム**: 毎日 9:30-10:00
- **進捗共有会**: 毎週水曜 15:00-16:00
- **レビュー会**: 毎週金曜 16:00-17:00

### コミュニケーションツール
- **Slack**: #subsidy-system-enhancement
- **GitHub**: issue/PR管理
- **Figma**: デザイン共有
- **Confluence**: ドキュメント管理

### エスカレーション
1. チームリーダー → プロジェクトマネージャー
2. 技術的課題 → テックリード
3. 仕様確認 → プロダクトオーナー

---

## 🚨 リスク管理

### 技術的リスク
- **AI精度不足**: 代替モデルの準備
- **パフォーマンス問題**: 段階的最適化
- **統合の複雑性**: モジュール別テスト

### スケジュールリスク
- **遅延対策**: バッファ時間の確保
- **優先順位**: コア機能を優先
- **並行作業**: 依存関係の最小化

---

**作成者**: プロジェクト統括責任者  
**承認者**: システムオーナー  
**配布先**: 全チームメンバー

各チームリーダーは、この指示書を確認後、詳細なタスク分解を行い、チームメンバーに展開してください。質問や懸念事項は、速やかにプロジェクトマネージャーまでエスカレーションしてください。