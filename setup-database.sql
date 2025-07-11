-- AI補助金申請システム データベース初期化
-- SupabaseのSQL Editorで実行してください

-- ===========================
-- 拡張機能の有効化
-- ===========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================
-- ユーザープロファイルテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  company_name TEXT,
  representative_name TEXT,
  business_type TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  capital_stock BIGINT,
  annual_revenue BIGINT,
  corporate_number TEXT,
  postal_code TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can view own profile" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" 
  ON user_profiles FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
  ON user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- ===========================
-- 補助金プログラムテーブル
-- ===========================
CREATE TABLE IF NOT EXISTS subsidy_programs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  official_name TEXT,
  category TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  target_business TEXT,
  max_amount BIGINT,
  subsidy_rate DECIMAL(3,2),
  application_period_start DATE,
  application_period_end DATE,
  requirements JSONB,
  eligible_expenses JSONB,
  documents_required JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- 申請書テーブル
-- ===========================
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subsidy_program_id UUID REFERENCES subsidy_programs(id),
  application_number TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed')),
  
  -- 申請データ
  form_data JSONB NOT NULL DEFAULT '{}',
  
  -- AI生成コンテンツ
  ai_generated_content JSONB DEFAULT '{}',
  ai_generation_history JSONB DEFAULT '[]',
  
  -- 外部データ連携
  external_data JSONB DEFAULT '{}',
  external_data_fetched_at TIMESTAMPTZ,
  
  -- 評価・スコアリング
  eligibility_score INTEGER,
  completeness_score INTEGER,
  ai_review_result JSONB,
  
  -- メタデータ
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- ポリシー設定
CREATE POLICY "Users can view own applications" 
  ON applications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" 
  ON applications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" 
  ON applications FOR UPDATE 
  USING (auth.uid() = user_id AND status IN ('draft', 'submitted'));

-- ===========================
-- 補助金プログラムの初期データ
-- ===========================
INSERT INTO subsidy_programs (code, name, official_name, category, organization_name, max_amount, subsidy_rate, description) VALUES
  ('sustainability', '持続化補助金', '小規模事業者持続化補助金', '販路開拓', '日本商工会議所', 500000, 0.67, '小規模事業者の販路開拓等に取り組む費用を補助'),
  ('monozukuri', 'ものづくり補助金', 'ものづくり・商業・サービス生産性向上促進補助金', '設備投資', '中小企業庁', 10000000, 0.50, '中小企業・小規模事業者等の革新的サービス開発・生産プロセス改善を支援'),
  ('business-improvement', '業務改善助成金', '業務改善助成金', '賃金引上げ', '厚生労働省', 6000000, 0.90, '生産性向上のための設備投資等を行い賃金引上げを図る中小企業・小規模事業者を支援'),
  ('reconstruction', '事業再構築補助金', '事業再構築補助金', '事業転換', '中小企業庁', 60000000, 0.67, 'ポストコロナ・ウィズコロナ時代の経済社会の変化に対応するための事業再構築を支援'),
  ('it-subsidy', 'IT導入補助金', 'IT導入補助金', 'デジタル化', '中小企業庁', 4500000, 0.75, 'ITツール導入による業務効率化・売上アップを支援')
ON CONFLICT (code) DO NOTHING;

-- ===========================
-- インデックス作成
-- ===========================
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_subsidy_program_id ON applications(subsidy_program_id);

-- ===========================
-- 更新日時自動更新関数
-- ===========================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- トリガー設定
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================
-- ストレージバケット作成
-- ===========================
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('application-pdfs', 'application-pdfs', false),
  ('uploaded-documents', 'uploaded-documents', false),
  ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- 初期化完了
SELECT 'データベース初期化が完了しました！' as message;