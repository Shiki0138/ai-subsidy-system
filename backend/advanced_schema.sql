-- Phase 1-3 統合実装: 高度な補助金システム

-- 補助金詳細マスターテーブル
CREATE TABLE IF NOT EXISTS subsidy_programs_extended (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  organization VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- 申請要件
  requirements JSONB NOT NULL DEFAULT '{}',
  evaluation_criteria JSONB NOT NULL DEFAULT '{}',
  required_documents JSONB NOT NULL DEFAULT '[]',
  
  -- フォーム設定
  form_template JSONB NOT NULL DEFAULT '{}',
  question_flow JSONB NOT NULL DEFAULT '[]',
  
  -- 採択基準
  scoring_criteria JSONB NOT NULL DEFAULT '{}',
  success_factors JSONB NOT NULL DEFAULT '[]',
  
  -- 締切・予算情報
  deadline_info JSONB,
  budget_range JSONB,
  
  -- システム管理
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 質問テンプレートテーブル
CREATE TABLE IF NOT EXISTS question_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidy_id UUID REFERENCES subsidy_programs_extended(id) ON DELETE CASCADE,
  category VARCHAR(100) NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- text, select, number, file, textarea, url
  
  -- 質問設定
  validation_rules JSONB DEFAULT '{}',
  followup_conditions JSONB DEFAULT '{}',
  ai_context TEXT, -- AI生成時の文脈
  
  -- 表示制御
  priority INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  display_condition JSONB DEFAULT '{}',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- 申請書セクションテンプレート
CREATE TABLE IF NOT EXISTS application_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subsidy_id UUID REFERENCES subsidy_programs_extended(id) ON DELETE CASCADE,
  section_name VARCHAR(255) NOT NULL,
  section_order INTEGER NOT NULL,
  
  -- コンテンツ設定
  content_template TEXT NOT NULL,
  ai_prompts JSONB NOT NULL DEFAULT '{}',
  required_data_fields JSONB NOT NULL DEFAULT '[]',
  
  -- 評価設定
  scoring_weight DECIMAL(3,2) DEFAULT 1.0,
  optimization_focus JSONB DEFAULT '[]',
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- ユーザー回答履歴
CREATE TABLE IF NOT EXISTS user_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  application_id UUID,
  question_id UUID REFERENCES question_templates(id),
  
  -- 回答データ
  answer_value TEXT,
  answer_data JSONB, -- 複雑な回答データ
  confidence_score DECIMAL(3,2),
  
  -- メタデータ
  answered_at TIMESTAMP DEFAULT NOW(),
  source VARCHAR(50) DEFAULT 'user', -- user, ai, web_analysis
  
  UNIQUE(user_id, application_id, question_id)
);

-- 企業分析結果
CREATE TABLE IF NOT EXISTS company_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  corporate_number VARCHAR(13),
  website_url TEXT,
  
  -- 分析結果
  business_profile JSONB NOT NULL DEFAULT '{}',
  strengths JSONB NOT NULL DEFAULT '[]',
  market_analysis JSONB DEFAULT '{}',
  technology_stack JSONB DEFAULT '[]',
  
  -- スコアリング
  innovation_score INTEGER,
  market_potential_score INTEGER,
  execution_capability_score INTEGER,
  
  -- システム管理
  last_analyzed_at TIMESTAMP DEFAULT NOW(),
  analysis_version VARCHAR(10) DEFAULT '1.0',
  
  UNIQUE(user_id, corporate_number)
);

-- 生成コンテンツ管理
CREATE TABLE IF NOT EXISTS generated_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL,
  section_id UUID REFERENCES application_templates(id),
  
  -- 生成コンテンツ
  content TEXT NOT NULL,
  optimization_score INTEGER DEFAULT 0,
  
  -- 生成メタデータ
  generation_prompt TEXT,
  ai_model VARCHAR(50),
  generation_time TIMESTAMP DEFAULT NOW(),
  
  -- 改善提案
  suggestions JSONB DEFAULT '[]',
  alternative_versions JSONB DEFAULT '[]'
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_subsidy_programs_type ON subsidy_programs_extended(type);
CREATE INDEX IF NOT EXISTS idx_question_templates_subsidy ON question_templates(subsidy_id);
CREATE INDEX IF NOT EXISTS idx_user_answers_user_app ON user_answers(user_id, application_id);
CREATE INDEX IF NOT EXISTS idx_company_analysis_user ON company_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_content_app ON generated_content(application_id);

-- 初期データ投入（ものづくり補助金）
INSERT INTO subsidy_programs_extended (
  name, type, organization, description, requirements, evaluation_criteria, question_flow
) VALUES (
  'ものづくり・商業・サービス生産性向上促進補助金',
  'monozukuri',
  '中小企業庁',
  '中小企業・小規模事業者等が今後複数年にわたり相次いで直面する制度変更等に対応するため、革新的サービス開発・試作品開発・生産プロセスの改善を行うための設備投資等を支援',
  '{"business_type": ["中小企業", "小規模事業者"], "innovation_focus": ["革新的サービス開発", "試作品開発", "生産プロセス改善"], "investment_type": ["設備投資", "システム開発"]}',
  '{"innovation": {"weight": 30, "description": "革新性・独自性"}, "technical_feasibility": {"weight": 25, "description": "技術的実現可能性"}, "market_potential": {"weight": 20, "description": "市場性・収益性"}, "execution_capability": {"weight": 15, "description": "実行体制・能力"}, "policy_alignment": {"weight": 10, "description": "政策的意義"}}',
  '[{"category": "company_basic", "priority": 1}, {"category": "business_model", "priority": 2}, {"category": "innovation_plan", "priority": 3}, {"category": "technical_details", "priority": 4}, {"category": "market_strategy", "priority": 5}, {"category": "financial_plan", "priority": 6}]'
) ON CONFLICT DO NOTHING;