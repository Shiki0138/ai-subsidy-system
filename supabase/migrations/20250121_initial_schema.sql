-- AI補助金申請システム Supabase初期スキーマ
-- 作成日: 2025-01-21

-- ===========================
-- 拡張機能の有効化
-- ===========================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pgjwt";

-- ===========================
-- ユーザー管理
-- ===========================

-- ユーザープロファイルテーブル
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

-- ユーザーは自分のプロファイルのみアクセス可能
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
-- 補助金マスタデータ
-- ===========================

-- 補助金プログラムテーブル
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

-- 補助金プログラムの初期データ
INSERT INTO subsidy_programs (code, name, official_name, category, organization_name, max_amount, subsidy_rate) VALUES
  ('sustainability', '持続化補助金', '小規模事業者持続化補助金', '販路開拓', '日本商工会議所', 500000, 0.67),
  ('monozukuri', 'ものづくり補助金', 'ものづくり・商業・サービス生産性向上促進補助金', '設備投資', '中小企業庁', 10000000, 0.50),
  ('business-improvement', '業務改善助成金', '業務改善助成金', '賃金引上げ', '厚生労働省', 6000000, 0.90),
  ('reconstruction', '事業再構築補助金', '事業再構築補助金', '事業転換', '中小企業庁', 60000000, 0.67),
  ('it-subsidy', 'IT導入補助金', 'IT導入補助金', 'デジタル化', '中小企業庁', 4500000, 0.75);

-- ===========================
-- 申請書管理
-- ===========================

-- 申請書テーブル
CREATE TABLE IF NOT EXISTS applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subsidy_program_id UUID REFERENCES subsidy_programs(id),
  application_number TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'approved', 'rejected', 'completed')),
  
  -- 申請データ（JSON形式で柔軟に保存）
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

-- ユーザーは自分の申請書のみアクセス可能
CREATE POLICY "Users can view own applications" 
  ON applications FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications" 
  ON applications FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications" 
  ON applications FOR UPDATE 
  USING (auth.uid() = user_id AND status IN ('draft', 'submitted'));

CREATE POLICY "Users can delete own draft applications" 
  ON applications FOR DELETE 
  USING (auth.uid() = user_id AND status = 'draft');

-- ===========================
-- ドキュメント管理
-- ===========================

-- アップロードファイルテーブル
CREATE TABLE IF NOT EXISTS uploaded_files (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  purpose TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE uploaded_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own files" 
  ON uploaded_files FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can upload files" 
  ON uploaded_files FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own files" 
  ON uploaded_files FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================
-- AI利用ログ
-- ===========================

-- AI使用履歴テーブル
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  ai_provider TEXT NOT NULL,
  model_name TEXT NOT NULL,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  cost_estimate DECIMAL(10,4),
  request_type TEXT,
  request_data JSONB,
  response_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI logs" 
  ON ai_usage_logs FOR SELECT 
  USING (auth.uid() = user_id);

-- ===========================
-- 外部API連携ログ
-- ===========================

-- 外部API呼び出しログ
CREATE TABLE IF NOT EXISTS external_api_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
  api_name TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_params JSONB,
  response_status INTEGER,
  response_data JSONB,
  error_message TEXT,
  execution_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===========================
-- ストレージバケット設定
-- ===========================

-- 申請書PDFバケット
INSERT INTO storage.buckets (id, name, public) 
VALUES ('application-pdfs', 'application-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- アップロードファイルバケット
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploaded-documents', 'uploaded-documents', false)
ON CONFLICT (id) DO NOTHING;

-- テンプレートバケット
INSERT INTO storage.buckets (id, name, public) 
VALUES ('templates', 'templates', true)
ON CONFLICT (id) DO NOTHING;

-- ===========================
-- ヘルパー関数
-- ===========================

-- 申請番号生成関数
CREATE OR REPLACE FUNCTION generate_application_number()
RETURNS TEXT AS $$
DECLARE
  year_month TEXT;
  seq_num INTEGER;
  app_number TEXT;
BEGIN
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  SELECT COUNT(*) + 1 INTO seq_num
  FROM applications
  WHERE application_number LIKE year_month || '%';
  
  app_number := year_month || LPAD(seq_num::TEXT, 5, '0');
  
  RETURN app_number;
END;
$$ LANGUAGE plpgsql;

-- 更新日時自動更新トリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 各テーブルにトリガーを設定
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_subsidy_programs_updated_at
  BEFORE UPDATE ON subsidy_programs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ===========================
-- インデックス
-- ===========================

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_subsidy_program_id ON applications(subsidy_program_id);
CREATE INDEX idx_uploaded_files_application_id ON uploaded_files(application_id);
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_external_api_logs_created_at ON external_api_logs(created_at);

-- ===========================
-- 初期化完了
-- ===========================

-- マイグレーション完了を記録
INSERT INTO migrations_log (name, executed_at) 
VALUES ('20250121_initial_schema', NOW())
ON CONFLICT DO NOTHING;