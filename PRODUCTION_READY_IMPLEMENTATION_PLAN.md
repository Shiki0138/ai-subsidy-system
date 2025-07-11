# AI補助金申請システム - 本番実装計画書

## 🎯 目標
実際のユーザーが本番環境で補助金申請書を作成できるレベルまでシステムを完成させる

## 🏗️ アーキテクチャ構成

### 現在の構成
- **Backend**: Express.js + PostgreSQL + Redis
- **Frontend**: Next.js 14
- **AI**: OpenAI + Anthropic Claude
- **Storage**: ローカルファイルシステム

### 移行後の構成（Supabase + Vercel）
```
┌─────────────────────────────────────────────────────┐
│                    Vercel Edge                       │
│  ┌─────────────────┐    ┌────────────────────┐     │
│  │   Next.js 14    │    │  Vercel Functions  │     │
│  │  (Frontend)     │    │   (API Routes)     │     │
│  └────────┬────────┘    └──────────┬─────────┘     │
│           │                         │                │
└───────────┼─────────────────────────┼───────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────────────────────────────────────┐
│                    Supabase                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │  PostgreSQL  │  │   Storage    │  │ Realtime  │ │
│  │  (Database)  │  │   (Files)    │  │ (WebSocket)│ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐ │
│  │     Auth     │  │   Vector DB  │  │   Edge    │ │
│  │ (認証管理)   │  │  (AI埋込み)  │  │ Functions │ │
│  └──────────────┘  └──────────────┘  └───────────┘ │
└─────────────────────────────────────────────────────┘
            │                         │
            ▼                         ▼
┌─────────────────────┐    ┌─────────────────────────┐
│   External APIs     │    │       AI APIs           │
│ ・法人番号API       │    │ ・Gemini API (無料枠)   │
│ ・e-Gov API         │    │ ・OpenAI API            │
│ ・経済センサスAPI   │    │ ・Anthropic Claude      │
└─────────────────────┘    └─────────────────────────┘
```

## 📋 実装タスク

### Phase 1: 基盤移行（1-2週間）

#### 1.1 Supabase セットアップ
```typescript
// supabase/migrations/001_initial_schema.sql
-- ユーザーテーブル
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 申請書テーブル
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  subsidy_type TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own applications" 
ON applications FOR ALL 
USING (auth.uid() = user_id);
```

#### 1.2 Vercel Functions 移行
```typescript
// app/api/subsidies/create/route.ts
import { createClient } from '@supabase/supabase-js'
import { GoogleGenerativeAI } from '@google/generative-ai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function POST(request: Request) {
  const { userId, subsidyType, formData } = await request.json()
  
  // Gemini APIで申請書生成
  const model = genAI.getGenerativeModel({ model: "gemini-pro" })
  const result = await model.generateContent(
    `以下の情報から${subsidyType}の申請書を生成してください: ${JSON.stringify(formData)}`
  )
  
  // Supabaseに保存
  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: userId,
      subsidy_type: subsidyType,
      data: {
        ...formData,
        generated_content: result.response.text()
      }
    })
    .select()
    .single()
    
  return Response.json({ data, error })
}
```

### Phase 2: 外部API連携実装（1週間）

#### 2.1 無料API統合
```typescript
// app/api/external/company-info/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const corporateNumber = searchParams.get('corporateNumber')
  
  // 法人番号API（無料）
  const houjinResponse = await fetch(
    `https://api.houjin-bangou.nta.go.jp/4/num?id=${corporateNumber}&type=12`
  )
  
  // e-Gov API（無料）
  const eGovResponse = await fetch(
    `https://api2.e-gov.go.jp/external/api/search`,
    {
      headers: { 'X-API-KEY': process.env.EGOV_API_KEY }
    }
  )
  
  // 経済センサスAPI（無料）
  const estatResponse = await fetch(
    `https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData?appId=${process.env.ESTAT_APP_ID}`
  )
  
  return Response.json({
    houjin: await houjinResponse.json(),
    egov: await eGovResponse.json(),
    estat: await estatResponse.json()
  })
}
```

#### 2.2 実データ取得サービス
```typescript
// services/realDataService.ts
export class RealDataService {
  // 実際の補助金公募要領を取得
  async fetchSubsidyGuidelines(subsidyType: string) {
    const guidelines = await supabase
      .from('subsidy_guidelines')
      .select('*')
      .eq('type', subsidyType)
      .single()
      
    return guidelines.data
  }
  
  // 実際の申請書フォーマットを取得
  async fetchApplicationTemplate(subsidyType: string) {
    const { data } = await supabase.storage
      .from('templates')
      .download(`${subsidyType}_template.pdf`)
      
    return data
  }
  
  // 企業の実データを統合
  async aggregateCompanyData(corporateNumber: string) {
    const [houjin, financial, patents] = await Promise.all([
      this.fetchHoujinData(corporateNumber),
      this.fetchFinancialData(corporateNumber),
      this.fetchPatentData(corporateNumber)
    ])
    
    return { houjin, financial, patents }
  }
}
```

### Phase 3: Gemini API統合（3-4日）

#### 3.1 Gemini設定
```typescript
// lib/ai/gemini.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export const geminiModels = {
  // テキスト生成（無料枠: 60 requests/minute）
  text: genAI.getGenerativeModel({ model: "gemini-pro" }),
  
  // 画像解析（無料枠: 60 requests/minute）
  vision: genAI.getGenerativeModel({ model: "gemini-pro-vision" }),
  
  // 埋め込み生成
  embedding: genAI.getGenerativeModel({ model: "embedding-001" })
}

// 申請書生成関数
export async function generateApplication(
  subsidyType: string,
  companyData: any,
  requirements: any
) {
  const prompt = `
あなたは補助金申請書作成の専門家です。
以下の情報を基に、${subsidyType}の申請書を作成してください。

企業情報:
${JSON.stringify(companyData, null, 2)}

要件:
${JSON.stringify(requirements, null, 2)}

以下の形式で申請書を生成してください:
1. 事業概要
2. 実施計画
3. 期待効果
4. 収支計画
  `
  
  const result = await geminiModels.text.generateContent(prompt)
  return result.response.text()
}
```

### Phase 4: テストコード実装（1週間）

#### 4.1 E2Eテスト（Playwright）
```typescript
// tests/e2e/application-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('補助金申請フロー', () => {
  test('持続化補助金の申請書作成', async ({ page }) => {
    // ログイン
    await page.goto('/auth/login')
    await page.fill('[name="email"]', 'test@example.com')
    await page.fill('[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    
    // ダッシュボードへ遷移
    await expect(page).toHaveURL('/dashboard')
    
    // 新規申請開始
    await page.click('text=新規申請')
    await page.selectOption('[name="subsidyType"]', 'sustainability')
    
    // 企業情報入力
    await page.fill('[name="companyName"]', 'テスト株式会社')
    await page.fill('[name="corporateNumber"]', '1234567890123')
    
    // AI生成実行
    await page.click('text=AI申請書生成')
    await expect(page.locator('.generated-content')).toBeVisible()
    
    // PDF出力
    await page.click('text=PDFダウンロード')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('text=ダウンロード開始')
    ])
    
    expect(download.suggestedFilename()).toContain('持続化補助金_申請書')
  })
})
```

#### 4.2 API統合テスト
```typescript
// tests/integration/api.test.ts
import { createClient } from '@supabase/supabase-js'

describe('API Integration Tests', () => {
  let supabase: any
  
  beforeAll(() => {
    supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    )
  })
  
  test('申請書作成API', async () => {
    const response = await fetch('/api/applications/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: 'monozukuri',
        companyData: {
          name: 'テスト製造業',
          employees: 50
        }
      })
    })
    
    const data = await response.json()
    expect(data.id).toBeDefined()
    expect(data.status).toBe('draft')
  })
})
```

### Phase 5: 本番環境デプロイ（3-4日）

#### 5.1 Vercel設定
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase_url",
    "SUPABASE_ANON_KEY": "@supabase_anon_key",
    "GEMINI_API_KEY": "@gemini_api_key"
  },
  "functions": {
    "app/api/applications/create/route.ts": {
      "maxDuration": 60
    }
  }
}
```

#### 5.2 環境変数設定
```bash
# .env.production
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_KEY=xxxxx
GEMINI_API_KEY=xxxxx
EGOV_API_KEY=xxxxx
ESTAT_APP_ID=xxxxx
```

## 📊 コスト見積もり

### 月額コスト（1000ユーザー想定）
- **Vercel Pro**: $20/月
- **Supabase Pro**: $25/月
- **Gemini API**: 無料枠内（60 requests/minute）
- **その他API**: 全て無料
- **合計**: $45/月（約6,750円）

## 🚀 実装優先順位

1. **Week 1**: Supabase移行 + 基本機能
2. **Week 2**: 外部API連携 + 実データ対応
3. **Week 3**: Gemini統合 + テスト実装
4. **Week 4**: 本番デプロイ + 最終調整

## ✅ 完了基準

- [ ] 実際の補助金申請書PDFが生成できる
- [ ] 企業の実データを自動取得できる
- [ ] 5つの補助金すべてで申請書作成可能
- [ ] E2Eテストがすべてパス
- [ ] Vercel本番環境で稼働
- [ ] 実ユーザーがアクセス可能