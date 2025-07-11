/**
 * 申請書テンプレートAPI
 * よく使う申請内容をテンプレート化
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseBuilder } from '@/types/api'
import { logger } from '@/utils/logger'

// メモリベースのテンプレート保存（本番環境ではDB使用）
const templates = new Map<string, any[]>()

// デフォルトテンプレート
const defaultTemplates = [
  {
    id: 'template_sustainability_basic',
    name: '基本的な販路開拓計画',
    type: 'sustainability',
    description: '小規模事業者向けの標準的な販路開拓テンプレート',
    isDefault: true,
    formData: {
      projectTitle: 'Webサイト構築による販路開拓事業',
      projectDescription: '自社Webサイトを構築し、オンライン販売チャネルを確立することで、新規顧客の獲得と売上向上を図る',
      expectedBudget: '500000',
      expectedPeriod: '6ヶ月',
      targetMarket: '全国の個人・法人顧客',
      competitiveAdvantage: '地域密着型サービスの強みを活かした差別化',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'template_it_basic',
    name: 'IT化による業務効率化',
    type: 'it-subsidy',
    description: 'ITツール導入による生産性向上テンプレート',
    isDefault: true,
    formData: {
      projectTitle: 'クラウド会計システム導入による業務効率化',
      projectDescription: 'クラウド型会計システムを導入し、経理業務の自動化と効率化を実現する',
      expectedBudget: '300000',
      expectedPeriod: '3ヶ月',
      targetSystem: '会計・経理システム',
      expectedEfficiency: '経理業務時間を50%削減',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'template_manufacturing_basic',
    name: '設備投資による生産性向上',
    type: 'manufacturing',
    description: 'ものづくり補助金向けの設備投資テンプレート',
    isDefault: true,
    formData: {
      projectTitle: '最新機械設備導入による生産効率向上事業',
      projectDescription: '高精度加工機械を導入し、製品品質の向上と生産時間の短縮を実現する',
      expectedBudget: '5000000',
      expectedPeriod: '12ヶ月',
      targetEquipment: 'CNC加工機',
      expectedProductivity: '生産効率30%向上',
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    const type = searchParams.get('type')
    const includeDefault = searchParams.get('includeDefault') !== 'false'
    
    // ユーザーのカスタムテンプレート
    const userTemplates = templates.get(userId) || []
    
    // デフォルトテンプレート
    const defaultToInclude = includeDefault ? defaultTemplates : []
    
    // 結合してフィルタリング
    const allTemplates = [...defaultToInclude, ...userTemplates]
    const filteredTemplates = type 
      ? allTemplates.filter(template => template.type === type)
      : allTemplates
    
    // 更新日時順にソート
    const sortedTemplates = filteredTemplates.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    
    return NextResponse.json(
      ApiResponseBuilder.success(sortedTemplates)
    )
  } catch (error) {
    logger.error('テンプレート取得エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        'テンプレートの取得に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId = 'anonymous', 
      name, 
      type, 
      description, 
      formData,
      tags = []
    } = body
    
    // バリデーション
    if (!name || !type || !formData) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'name, type, formData は必須です'
        ),
        { status: 400 }
      )
    }
    
    const now = new Date().toISOString()
    const templateId = `template_${userId}_${Date.now()}`
    
    const template = {
      id: templateId,
      name,
      type,
      description: description || '',
      formData,
      tags,
      isDefault: false,
      createdAt: now,
      updatedAt: now,
    }
    
    const userTemplates = templates.get(userId) || []
    userTemplates.unshift(template)
    templates.set(userId, userTemplates)
    
    logger.info('テンプレート作成', { templateId, userId, type, name })
    
    return NextResponse.json(
      ApiResponseBuilder.success(template)
    )
  } catch (error) {
    logger.error('テンプレート作成エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        'テンプレートの作成に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous', templateId, name, description, formData, tags } = body
    
    if (!templateId) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'templateId は必須です'
        ),
        { status: 400 }
      )
    }
    
    // デフォルトテンプレートは編集不可
    if (templateId.startsWith('template_') && templateId.includes('_basic')) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'FORBIDDEN',
          'デフォルトテンプレートは編集できません'
        ),
        { status: 403 }
      )
    }
    
    const userTemplates = templates.get(userId) || []
    const templateIndex = userTemplates.findIndex(t => t.id === templateId)
    
    if (templateIndex === -1) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'NOT_FOUND',
          '指定されたテンプレートが見つかりません'
        ),
        { status: 404 }
      )
    }
    
    const existingTemplate = userTemplates[templateIndex]
    const updatedTemplate = {
      ...existingTemplate,
      ...(name && { name }),
      ...(description !== undefined && { description }),
      ...(formData && { formData }),
      ...(tags && { tags }),
      updatedAt: new Date().toISOString(),
    }
    
    userTemplates[templateIndex] = updatedTemplate
    templates.set(userId, userTemplates)
    
    logger.info('テンプレート更新', { templateId, userId })
    
    return NextResponse.json(
      ApiResponseBuilder.success(updatedTemplate)
    )
  } catch (error) {
    logger.error('テンプレート更新エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        'テンプレートの更新に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    const templateId = searchParams.get('templateId')
    
    if (!templateId) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'templateId は必須です'
        ),
        { status: 400 }
      )
    }
    
    // デフォルトテンプレートは削除不可
    if (templateId.startsWith('template_') && templateId.includes('_basic')) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'FORBIDDEN',
          'デフォルトテンプレートは削除できません'
        ),
        { status: 403 }
      )
    }
    
    const userTemplates = templates.get(userId) || []
    const filteredTemplates = userTemplates.filter(t => t.id !== templateId)
    
    if (filteredTemplates.length === userTemplates.length) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'NOT_FOUND',
          '指定されたテンプレートが見つかりません'
        ),
        { status: 404 }
      )
    }
    
    templates.set(userId, filteredTemplates)
    
    logger.info('テンプレート削除', { templateId, userId })
    
    return NextResponse.json(
      ApiResponseBuilder.success({ deleted: true })
    )
  } catch (error) {
    logger.error('テンプレート削除エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        'テンプレートの削除に失敗しました'
      ),
      { status: 500 }
    )
  }
}