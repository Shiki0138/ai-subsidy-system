/**
 * 通知API
 * リアルタイム通知の管理
 */

import { NextRequest, NextResponse } from 'next/server'
import { ApiResponseBuilder } from '@/types/api'
import { logger } from '@/utils/logger'

// メモリベースの通知保存（本番環境ではDB使用）
const notifications = new Map<string, any[]>()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId') || 'anonymous'
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    
    const userNotifications = notifications.get(userId) || []
    
    const filteredNotifications = unreadOnly
      ? userNotifications.filter(n => !n.read)
      : userNotifications
    
    // 新しい順にソート
    const sortedNotifications = filteredNotifications.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    
    return NextResponse.json(
      ApiResponseBuilder.success(sortedNotifications)
    )
  } catch (error) {
    logger.error('通知取得エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '通知の取得に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous', title, message, type = 'info', data = {} } = body
    
    if (!title || !message) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'title と message は必須です'
        ),
        { status: 400 }
      )
    }
    
    const notification = {
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title,
      message,
      type,
      data,
      read: false,
      createdAt: new Date().toISOString(),
    }
    
    const userNotifications = notifications.get(userId) || []
    userNotifications.unshift(notification)
    
    // 最大100件まで保持
    if (userNotifications.length > 100) {
      userNotifications.splice(100)
    }
    
    notifications.set(userId, userNotifications)
    
    logger.info('通知作成', { userId, notificationId: notification.id, type })
    
    return NextResponse.json(
      ApiResponseBuilder.success(notification)
    )
  } catch (error) {
    logger.error('通知作成エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '通知の作成に失敗しました'
      ),
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous', notificationId, read = true } = body
    
    if (!notificationId) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'VALIDATION_ERROR',
          'notificationId は必須です'
        ),
        { status: 400 }
      )
    }
    
    const userNotifications = notifications.get(userId) || []
    const notification = userNotifications.find(n => n.id === notificationId)
    
    if (!notification) {
      return NextResponse.json(
        ApiResponseBuilder.error(
          'NOT_FOUND',
          '指定された通知が見つかりません'
        ),
        { status: 404 }
      )
    }
    
    notification.read = read
    notification.readAt = new Date().toISOString()
    
    notifications.set(userId, userNotifications)
    
    logger.info('通知更新', { userId, notificationId, read })
    
    return NextResponse.json(
      ApiResponseBuilder.success(notification)
    )
  } catch (error) {
    logger.error('通知更新エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '通知の更新に失敗しました'
      ),
      { status: 500 }
    )
  }
}

// 全ての通知を既読にする
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId = 'anonymous' } = body
    
    const userNotifications = notifications.get(userId) || []
    const updatedCount = userNotifications.filter(n => !n.read).length
    
    userNotifications.forEach(notification => {
      if (!notification.read) {
        notification.read = true
        notification.readAt = new Date().toISOString()
      }
    })
    
    notifications.set(userId, userNotifications)
    
    logger.info('全通知既読', { userId, updatedCount })
    
    return NextResponse.json(
      ApiResponseBuilder.success({ updatedCount })
    )
  } catch (error) {
    logger.error('全通知既読エラー', error)
    return NextResponse.json(
      ApiResponseBuilder.error(
        'INTERNAL_ERROR',
        '通知の一括更新に失敗しました'
      ),
      { status: 500 }
    )
  }
}