/**
 * 環境変数管理（フォールバック対応）
 * 本番環境でのエラーを防ぐため、すべての環境変数にデフォルト値を設定
 */

// 環境タイプ
export const ENV = process.env.NODE_ENV || 'development'
export const IS_PRODUCTION = ENV === 'production'
export const IS_DEVELOPMENT = ENV === 'development'

// Supabase設定（必須だがフォールバックあり）
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// AI API設定（オプション）
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || ''
export const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || ''

// 外部API設定
export const ESTAT_APP_ID = process.env.ESTAT_APP_ID || 'DEMO_MODE'

// アプリケーション設定
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AI補助金申請システム'

// 機能フラグ
export const FEATURES = {
  USE_SUPABASE: Boolean(SUPABASE_URL && SUPABASE_ANON_KEY),
  USE_GEMINI: Boolean(GEMINI_API_KEY),
  USE_OPENAI: Boolean(OPENAI_API_KEY),
  USE_ANTHROPIC: Boolean(ANTHROPIC_API_KEY),
  USE_EXTERNAL_API: Boolean(ESTAT_APP_ID !== 'DEMO_MODE'),
  ENABLE_DEV_MODE: IS_DEVELOPMENT,
  ENABLE_MOCK_DATA: !IS_PRODUCTION && !SUPABASE_URL,
}

// 設定の検証
export function validateEnvironment() {
  const warnings: string[] = []
  const errors: string[] = []

  // 警告レベル
  if (!FEATURES.USE_SUPABASE) {
    warnings.push('Supabase未設定: モックデータモードで動作します')
  }
  
  if (!FEATURES.USE_GEMINI && !FEATURES.USE_OPENAI && !FEATURES.USE_ANTHROPIC) {
    warnings.push('AI API未設定: AI機能は制限されます')
  }

  if (!FEATURES.USE_EXTERNAL_API) {
    warnings.push('外部API未設定: デモデータを使用します')
  }

  // 本番環境での必須チェック
  if (IS_PRODUCTION) {
    if (!FEATURES.USE_SUPABASE) {
      errors.push('本番環境ではSupabaseの設定が必須です')
    }
    if (!FEATURES.USE_GEMINI && !FEATURES.USE_OPENAI) {
      errors.push('本番環境ではAI APIの設定が必須です')
    }
  }

  return { warnings, errors, isValid: errors.length === 0 }
}

// デバッグ情報の出力（開発環境のみ）
if (IS_DEVELOPMENT) {
  console.log('🔧 環境設定:', {
    ENV,
    FEATURES,
    APP_URL,
  })
  
  const { warnings, errors } = validateEnvironment()
  warnings.forEach(w => console.warn('⚠️', w))
  errors.forEach(e => console.error('❌', e))
}