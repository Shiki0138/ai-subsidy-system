/**
 * 申請書下書き保存API
 * サーバーサイドで下書きを管理
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseBuilder } from '@/types/api'
import { logger } from '@/utils/logger'

// メモリベースの一時保存（本番環境ではDBやRedisを使用）
const drafts = new Map<string, any>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    const type = searchParams.get('type')
    
    const userDrafts = Array.from(drafts.entries())
      .filter(([key]) => key.startsWith(`${userId}_`))
      .map(([key, value]) => ({
        id: key,
        ...value,
      }))
      .filter(draft => !type || draft.type === type)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    
    return NextResponse.json(
      ApiResponseBuilder.success(userDrafts)
    )
  } catch (error) {
    logger.error('下書き取得エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '下書きの取得に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous', type, formData, title, autoSave = false } = body
    
    // バリデーション
    if (!type || !formData) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'type と formData は必須です'
        ),
        { status: 400 }
      )
    }
    
    const now = new Date().toISOString()
    const draftId = `${userId}_${type}_${Date.now()}`
    
    const draft = {
      type,
      title: title || `${type} 申請書（下書き）`,
      formData,
      autoSave,
      createdAt: now,
      updatedAt: now,
    }
    
    drafts.set(draftId, draft)
    
    logger.info('下書き保存', { draftId, userId, type, autoSave })
    
    return NextResponse.json(
      ApiResponseBuilder.success({
        id: draftId,
        ...draft,
      })
    )
  } catch (error) {
    logger.error('下書き保存エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '下書きの保存に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, formData, title } = body
    
    if (!id || !formData) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'id と formData は必須です'
        ),
        { status: 400 }
      )
    }
    
    const existingDraft = drafts.get(id)
    if (!existingDraft) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'NOT_FOUND',
          '指定された下書きが見つかりません'
        ),
        { status: 404 }
      )
    }
    
    const updatedDraft = {
      ...existingDraft,
      formData,
      title: title || existingDraft.title,
      updatedAt: new Date().toISOString(),
    }
    
    drafts.set(id, updatedDraft)
    
    logger.info('下書き更新', { id })
    
    return NextResponse.json(
      ApiResponseBuilder.success({
        id,
        ...updatedDraft,
      })
    )
  } catch (error) {
    logger.error('下書き更新エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '下書きの更新に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'id は必須です'
        ),
        { status: 400 }
      )
    }
    
    const deleted = drafts.delete(id)
    
    if (!deleted) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'NOT_FOUND',
          '指定された下書きが見つかりません'
        ),
        { status: 404 }
      )
    }
    
    logger.info('下書き削除', { id })
    
    return NextResponse.json(
      ApiResponseBuilder.success({ deleted: true })
    )
  } catch (error) {
    logger.error('下書き削除エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '下書きの削除に失敗しました'
      ),
      { status: 500 }
    )
  }
}