# 🚀 AI補助金システム GPTs連携・本番対応 作業指示書

**作成日**: 2025年6月17日  
**対象**: チームABC  
**目標**: GPTs連携機能実装 + 半自動申請書作成 + 本番環境対応

---

## 📊 現状分析

### ✅ 完成している機能（95%完成度）
- 認証システム（JWT + セッション管理）
- 申請書作成フロー（5ステップウィザード）
- AI生成機能（OpenAI GPT-3.5 統合済み）
- PDF生成・プレビュー（Puppeteer + フォールバック）
- ファイルアップロード・管理
- レスポンシブUI（Next.js 14 + Tailwind）

### 🎯 新規実装が必要な機能
1. **GPTs連携機能** - 募集要項読み込みGPTsとの連携
2. **半自動申請書作成** - AIによる自動文章生成強化
3. **本番環境対応** - インフラ・セキュリティ強化

---

## 🏗️ 技術アーキテクチャ

### GPTs連携設計
```typescript
// 新しいサービス構造
/backend/src/services/
├── gpts-integration/
│   ├── GPTsConnector.ts      // GPTs API連携
│   ├── DocumentProcessor.ts   // 募集要項処理
│   └── ResponseParser.ts     // GPTs応答解析
├── enhanced-autofill/
│   ├── SmartFillEngine.ts    // 強化版自動入力
│   ├── ContextAnalyzer.ts    // 文脈分析
│   └── TemplateGenerator.ts  // 動的テンプレート生成
```

### フロントエンド連携
```typescript
/frontend/src/features/
├── gpts-integration/
│   ├── GPTsConnectionPanel.tsx
│   ├── DocumentUploader.tsx
│   └── AnalysisViewer.tsx
├── smart-application/
│   ├── SmartWizard.tsx
│   ├── AISuggestionPanel.tsx
│   └── ContentOptimizer.tsx
```

---

## 🔧 tmux作業環境セットアップ

### ターミナル環境構築
```bash
# 1. tmuxセッション開始（自動復旧対応）
tmux new-session -d -s ai-subsidy-dev

# 2. ウィンドウ分割
tmux split-window -h -t ai-subsidy-dev  # 水平分割
tmux split-window -v -t ai-subsidy-dev  # 垂直分割

# 3. 各ペインの役割設定
# Pane 0: バックエンド開発
# Pane 1: フロントエンド開発  
# Pane 2: システム監視・テスト

# 4. 自動保存設定
echo 'set -g history-limit 10000' >> ~/.tmux.conf
echo 'set -g automatic-rename on' >> ~/.tmux.conf
```

### 作業継続スクリプト
```bash
# /Users/MBP/ai-subsidy-system/start-dev-session.sh
#!/bin/bash
cd /Users/MBP/ai-subsidy-system

# tmuxセッション復旧または新規作成
if tmux has-session -t ai-subsidy-dev 2>/dev/null; then
    echo "既存セッションに接続中..."
    tmux attach-session -t ai-subsidy-dev
else
    echo "新規開発セッション開始..."
    tmux new-session -d -s ai-subsidy-dev
    
    # ペイン0: バックエンド
    tmux send-keys -t ai-subsidy-dev:0 'cd backend && npm run dev' C-m
    
    # ペイン1: フロントエンド  
    tmux split-window -h -t ai-subsidy-dev
    tmux send-keys -t ai-subsidy-dev:1 'cd frontend && npm run dev' C-m
    
    # ペイン2: 監視
    tmux split-window -v -t ai-subsidy-dev:1
    tmux send-keys -t ai-subsidy-dev:2 'watch -n 5 "npm run test:quick"' C-m
    
    tmux attach-session -t ai-subsidy-dev
fi
```

---

## 📋 チーム別作業指示

### 🔴 チームA: GPTs連携基盤実装（最優先）

#### Phase 1: GPTs API連携（3日）
```bash
# 作業開始
tmux send-keys -t ai-subsidy-dev:0 'cd backend/src/services' C-m
mkdir -p gpts-integration
```

**実装ファイル**:
```typescript
// backend/src/services/gpts-integration/GPTsConnector.ts
export class GPTsConnector {
  private gptEndpoint: string;
  private apiKey: string;

  async analyzeSubsidyDocument(documentUrl: string): Promise<{
    eligibilityCriteria: string[];
    applicationSections: Section[];
    deadlines: Date[];
    budgetRequirements: BudgetInfo;
    keyPoints: string[];
  }> {
    // GPTsに募集要項を送信し、構造化された分析を取得
    const response = await this.callGPTs({
      action: 'analyze_subsidy_document',
      document_url: documentUrl,
      analysis_type: 'comprehensive'
    });
    
    return this.parseGPTsResponse(response);
  }

  async generateApplicationContent(
    analysisResult: any,
    companyProfile: CompanyProfile
  ): Promise<GeneratedContent> {
    // GPTsに企業情報と分析結果を送信し、申請書コンテンツを生成
    return await this.callGPTs({
      action: 'generate_application',
      analysis: analysisResult,
      company: companyProfile,
      generation_mode: 'high_quality'
    });
  }
}
```

**tmux自動保存設定**:
```bash
# 作業中断時の自動保存
tmux send-keys -t ai-subsidy-dev:0 'git add . && git commit -m "WIP: GPTs connector implementation"' C-m
```

#### Phase 2: 文書処理エンジン（2日）
```typescript
// backend/src/services/gpts-integration/DocumentProcessor.ts
export class DocumentProcessor {
  async extractTextFromPDF(pdfBuffer: Buffer): Promise<string>
  async preprocessDocument(text: string): Promise<ProcessedDocument>
  async identifyDocumentStructure(text: string): Promise<DocumentStructure>
}
```

### 🟡 チームB: 強化版自動入力実装（並行作業）

#### Phase 1: スマート自動入力（3日）
```typescript
// backend/src/services/enhanced-autofill/SmartFillEngine.ts
export class SmartFillEngine extends AutoFillService {
  async generateContextAwareContent(
    section: ApplicationSection,
    gptAnalysis: GPTsAnalysis,
    companyProfile: CompanyProfile
  ): Promise<EnhancedSuggestion> {
    // GPTs分析結果を活用した高度な内容生成
    const contextualPrompt = this.buildContextualPrompt(
      section, gptAnalysis, companyProfile
    );
    
    const suggestions = await Promise.all([
      this.generateWithOpenAI(contextualPrompt),
      this.generateWithClaude(contextualPrompt),
      this.generateFromTemplate(section, companyProfile)
    ]);
    
    return this.selectBestSuggestion(suggestions);
  }
}
```

#### tmux自動テスト設定
```bash
# チームB用テストペイン
tmux send-keys -t ai-subsidy-dev:2 'cd backend && npm run test -- --watch enhanced-autofill' C-m
```

### 🟢 チームC: フロントエンド統合（最終週）

#### Phase 1: GPTs連携UI（2日）
```typescript
// frontend/src/features/gpts-integration/GPTsConnectionPanel.tsx
export function GPTsConnectionPanel() {
  const [documentUrl, setDocumentUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyzeDocument = async () => {
    setIsAnalyzing(true);
    try {
      const result = await gptConnectorApi.analyzeDocument(documentUrl);
      setAnalysisResult(result);
      
      // 自動的に申請書作成ウィザードに分析結果を渡す
      router.push(`/dashboard/applications/new?analysis=${encodeURIComponent(JSON.stringify(result))}`);
    } catch (error) {
      toast.error('分析に失敗しました');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">募集要項分析</h3>
      
      <div className="space-y-4">
        <Input
          value={documentUrl}
          onChange={(e) => setDocumentUrl(e.target.value)}
          placeholder="募集要項のURLを入力..."
        />
        
        <Button 
          onClick={handleAnalyzeDocument}
          disabled={!documentUrl || isAnalyzing}
          className="w-full"
        >
          {isAnalyzing ? <Spinner className="mr-2" /> : null}
          GPTsで分析開始
        </Button>
        
        {analysisResult && (
          <AnalysisViewer result={analysisResult} />
        )}
      </div>
    </Card>
  );
}
```

---

## 🎯 本番環境対応チェックリスト

### セキュリティ強化
```bash
# 1. 環境変数セキュア化
echo "OPENAI_API_KEY=sk-..." >> .env.production
echo "GPTS_API_KEY=gpts-..." >> .env.production
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env.production

# 2. データベース暗号化
echo "DATABASE_ENCRYPTION_KEY=$(openssl rand -base64 32)" >> .env.production

# 3. HTTPS証明書設定
certbot --nginx -d your-domain.com
```

### インフラストラクチャ
```yaml
# docker-compose.prod.yml (新規作成)
version: '3.8'
services:
  app:
    build: .
    environment:
      - NODE_ENV=production
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    volumes:
      - /app/uploads:/app/uploads
    ports:
      - "3000:3000"
  
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: ai_subsidy_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
```

### 監視・ログ
```typescript
// backend/src/middleware/productionLogger.ts
export const productionLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});
```

---

## ⚡ 作業スケジュール（2週間完了）

### Week 1
**月-火**: チームA GPTs連携基盤  
**水-木**: チームB 強化自動入力  
**金**: チームC UI統合準備

### Week 2  
**月-火**: 統合テスト・バグ修正  
**水-木**: 本番環境構築・セキュリティ  
**金**: 最終テスト・リリース準備

---

## 🔄 定期保存・復旧手順

### 毎時間実行（tmux内で自動化）
```bash
# save-progress.sh
#!/bin/bash
cd /Users/MBP/ai-subsidy-system

# 作業中コードの保存
git add .
git commit -m "Auto-save: $(date '+%Y-%m-%d %H:%M:%S')"

# データベースバックアップ
npm run db:backup

# 設定ファイル保存
cp .env.local .env.backup.$(date +%Y%m%d_%H%M)

echo "進捗保存完了: $(date)"
```

### セッション復旧
```bash
# restore-session.sh
#!/bin/bash
if tmux has-session -t ai-subsidy-dev 2>/dev/null; then
    echo "セッション継続中..."
    tmux attach-session -t ai-subsidy-dev
else
    echo "セッション復旧中..."
    ./start-dev-session.sh
    
    # 最新の進捗復元
    git stash pop 2>/dev/null || true
    npm install
    
    echo "復旧完了"
fi
```

---

## 📊 成功指標・テスト項目

### 機能テスト
- [ ] GPTs API連携が正常動作
- [ ] 募集要項から正確な情報抽出
- [ ] AIが高品質な申請書コンテンツを生成
- [ ] ユーザーが5分以内で申請書完成
- [ ] PDF出力が正常動作

### パフォーマンステスト
- [ ] GPTs応答時間 < 30秒
- [ ] 申請書生成時間 < 60秒
- [ ] 同時ユーザー100人対応
- [ ] データ整合性確保

### セキュリティテスト
- [ ] API認証が正常動作
- [ ] データ暗号化確認
- [ ] XSS/CSRF対策確認
- [ ] 個人情報保護法準拠

---

## 🎉 完了条件

### 技術的完了
1. GPTs連携で募集要項を自動分析
2. AIが申請書の80%以上を自動生成
3. ユーザーが最小限の編集で申請書完成
4. 本番環境で安定動作

### ビジネス的完了
1. ユーザーが従来の1/5の時間で申請書作成
2. 生成内容の品質が人間レベル
3. エラー率 < 1%
4. 月額課金で収益化可能

---

**🚀 チーム一丸となって、世界最高レベルのAI補助金システムを完成させましょう！**

*tmuxセッションで作業を継続し、定期的に進捗を保存することで、確実に目標達成を目指します。*