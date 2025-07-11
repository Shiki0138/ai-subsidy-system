/**
 * ヘルスチェックAPI
 * システムの稼働状況を確認
 */

import { NextResponse } from 'next/server'
import { ApiResponseBuilder } from '@/types/api'
import { validateEnvironment, FEATURES } from '@/config/environment'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const startTime = Date.now()
    const { warnings, errors, isValid } = validateEnvironment()
    
    // 各サービスの状態チェック
    const services = {
      app: true,
      database: false,
      ai: false,
      externalApi: false
    }
    
    // データベース接続チェック
    if (FEATURES.USE_SUPABASE) {
      try {
        const { error } = await supabase.from('subsidy_programs').select('count').limit(1)
        services.database = !error
      } catch {
        services.database = false
      }
    }
    
    // AI API利用可能チェック
    services.ai = FEATURES.USE_GEMINI || FEATURES.USE_OPENAI || FEATURES.USE_ANTHROPIC
    
    // 外部API利用可能チェック
    services.externalApi = FEATURES.USE_EXTERNAL_API
    
    const responseTime = Date.now() - startTime
    const allServicesOk = Object.values(services).every(status => status)
    
    return NextResponse.json(
      ApiResponseBuilder.success({
        status: allServicesOk ? 'healthy' : 'degraded',
        services,
        environment: {
          isValid,
          warnings,
          errors,
          features: FEATURES
        },
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      })
    )
  } catch (error) {
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        'ヘルスチェック中にエラーが発生しました',
        process.env.NODE_ENV === 'development' ? error : undefined
      ),
      { status: 500 }
    )
  }
}