# デプロイガイド

## 🚀 デプロイ前チェックリスト

### ✅ 完了済み項目
- [x] 不要ファイルの削除
- [x] インポートパスの大文字小文字統一
- [x] Vercel設定ファイル作成
- [x] 環境変数設定例作成
- [x] Supabase設定ファイル確認

### 📋 デプロイ手順

## 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com)にログイン
2. 新しいプロジェクトを作成
3. 以下の情報を取得：
   - Project URL
   - Anon Key
   - Service Role Key（バックエンド用）

## 2. 環境変数の設定

### フロントエンド（Vercel）
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_GEMINI_API_KEY=your-gemini-key
NEXT_PUBLIC_CORPORATE_NUMBER_API_KEY=your-corporate-key
```

### バックエンド（Vercel）
```bash
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
GEMINI_API_KEY=your-gemini-key
CORPORATE_NUMBER_API_KEY=your-corporate-key
```

## 3. フロントエンドデプロイ（Vercel）

1. [Vercel](https://vercel.com)にログイン
2. GitHubリポジトリをインポート
3. プロジェクト設定：
   - Framework: Next.js
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `.next`
4. 環境変数を設定
5. デプロイ実行

## 4. バックエンドデプロイ（Vercel）

1. 新しいVercelプロジェクトを作成
2. 同じGitHubリポジトリをインポート
3. プロジェクト設定：
   - Framework: Other
   - Root Directory: `backend`
   - Build Command: `npm run build`
4. 環境変数を設定
5. デプロイ実行

## 5. データベースセットアップ

### Supabaseでテーブル作成
```sql
-- ユーザープロファイル
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (id)
);

-- 申請書
CREATE TABLE applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  subsidy_type TEXT NOT NULL,
  company_name TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  form_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 補助金プログラム
CREATE TABLE subsidy_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  max_amount DECIMAL,
  subsidy_rate TEXT,
  description TEXT,
  requirements TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS (Row Level Security) 設定
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subsidy_programs ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own applications" ON applications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications" ON applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" ON applications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active subsidy programs" ON subsidy_programs
  FOR SELECT USING (is_active = true);
```

## 6. APIキーの取得

### Google Gemini API
1. [Google AI Studio](https://makersuite.google.com/app/apikey)でAPIキーを取得
2. 環境変数に設定

### 法人番号API
1. [国税庁法人番号システム](https://www.houjin-bangou.nta.go.jp/)でアプリケーションIDを取得
2. 環境変数に設定

## 7. デプロイ確認

### チェック項目
- [ ] フロントエンドが正常に表示される
- [ ] バックエンドAPIが応答する
- [ ] データベース接続が正常
- [ ] 認証機能が動作する
- [ ] 申請フォームが正常に動作する
- [ ] AI機能が正常に動作する
- [ ] ファイルアップロードが正常に動作する

## 8. 監視・メンテナンス

### 推奨設定
- Vercelの自動デプロイ設定
- Supabaseの監視設定
- エラーログの確認
- パフォーマンスモニタリング

## 🆘 トラブルシューティング

### よくある問題

1. **ビルドエラー**
   - 環境変数が正しく設定されているか確認
   - 依存関係のバージョン確認

2. **認証エラー**
   - SupabaseのURL・キーが正しいか確認
   - RLSポリシーが正しく設定されているか確認

3. **API接続エラー**
   - APIキーが正しく設定されているか確認
   - CORSの設定確認

4. **データベース接続エラー**
   - DATABASE_URLが正しいか確認
   - Supabaseのアクセス権限確認

## 📞 サポート

デプロイに関する問題が発生した場合：
1. エラーログを確認
2. 環境変数を再確認
3. 各サービスのステータスページを確認
4. 必要に応じて各サービスのサポートに連絡