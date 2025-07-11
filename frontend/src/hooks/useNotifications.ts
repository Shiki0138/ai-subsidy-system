/**
 * 通知フック
 * リアルタイム通知の管理
 */

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/utils/logger'
import { showError, showSuccess } from '@/utils/error-handler'

interface Notification {
  id: string
  title: string
  message: string
  type: 'success' | 'error' | 'warning' | 'info'
  data?: any
  read: boolean
  createdAt: string
  readAt?: string
}

interface UseNotificationsOptions {
  userId?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function useNotifications({
  userId = 'anonymous',
  autoRefresh = true,
  refreshInterval = 30000, // 30秒
}: UseNotificationsOptions = {}) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // 通知の取得
  const fetchNotifications = useCallback(async (unreadOnly = false) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        userId,
        ...(unreadOnly && { unreadOnly: 'true' }),
      })
      
      const response = await fetch(`/api/notifications?${params}`)
      
      if (!response.ok) {
        throw new Error('通知の取得に失敗しました')
      }
      
      const result = await response.json()
      const fetchedNotifications = result.data || []
      
      setNotifications(fetchedNotifications)
      setUnreadCount(fetchedNotifications.filter((n: Notification) => !n.read).length)
      
      logger.info('通知取得完了', { count: fetchedNotifications.length })
    } catch (error) {
      logger.error('通知取得エラー', error)
      // エラーは控えめに処理（ユーザーに通知しない）
    } finally {
      setLoading(false)
    }
  }, [userId])

  // 通知の作成
  const createNotification = useCallback(async (
    title: string,
    message: string,
    type: Notification['type'] = 'info',
    data?: any
  ) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          title,
          message,
          type,
          data,
        }),
      })
      
      if (!response.ok) {
        throw new Error('通知の作成に失敗しました')
      }
      
      const result = await response.json()
      const newNotification = result.data
      
      // ローカルの状態を更新
      setNotifications(prev => [newNotification, ...prev])
      if (!newNotification.read) {
        setUnreadCount(prev => prev + 1)
      }
      
      // ブラウザ通知の表示（権限がある場合）
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
        })
      }
      
      return newNotification
    } catch (error) {
      logger.error('通知作成エラー', error)
      showError('通知の作成に失敗しました')
    }
  }, [userId])

  // 通知を既読にする
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notificationId,
          read: true,
        }),
      })
      
      if (!response.ok) {
        throw new Error('通知の更新に失敗しました')
      }
      
      // ローカルの状態を更新
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read: true, readAt: new Date().toISOString() }
            : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
      
    } catch (error) {
      logger.error('通知更新エラー', error)
    }
  }, [userId])

  // 全ての通知を既読にする
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })
      
      if (!response.ok) {
        throw new Error('通知の一括更新に失敗しました')
      }
      
      // ローカルの状態を更新
      setNotifications(prev => 
        prev.map(n => ({ 
          ...n, 
          read: true, 
          readAt: n.readAt || new Date().toISOString() 
        }))
      )
      setUnreadCount(0)
      
      showSuccess('全ての通知を既読にしました')
    } catch (error) {
      logger.error('一括既読エラー', error)
      showError('通知の更新に失敗しました')
    }
  }, [userId])

  // ブラウザ通知の許可を要求
  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false
    }
    
    if (Notification.permission === 'granted') {
      return true
    }
    
    if (Notification.permission === 'denied') {
      return false
    }
    
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }, [])

  // 初期ロードと自動更新
  useEffect(() => {
    fetchNotifications()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchNotifications()
      }, refreshInterval)
      
      return () => clearInterval(interval)
    }
  }, [fetchNotifications, autoRefresh, refreshInterval])

  // 便利なヘルパー関数
  const addSuccessNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification(title, message, 'success', data)
  }, [createNotification])

  const addErrorNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification(title, message, 'error', data)
  }, [createNotification])

  const addWarningNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification(title, message, 'warning', data)
  }, [createNotification])

  const addInfoNotification = useCallback((title: string, message: string, data?: any) => {
    return createNotification(title, message, 'info', data)
  }, [createNotification])

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    requestNotificationPermission,
    // ヘルパー関数
    addSuccessNotification,
    addErrorNotification,
    addWarningNotification,
    addInfoNotification,
  }
}