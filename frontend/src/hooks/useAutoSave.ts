import { useEffect, useCallback, useRef } from 'react'
import { showSuccess, showError } from '@/utils/error-handler'

interface AutoSaveOptions {
  key: string
  data: any
  interval?: number // milliseconds
  enabled?: boolean
}

export function useAutoSave({ key, data, interval = 30000, enabled = true }: AutoSaveOptions) {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastSavedRef = useRef<string>('')

  // 手動保存
  const saveNow = useCallback(() => {
    try {
      const serialized = JSON.stringify(data)
      localStorage.setItem(`autosave_${key}`, serialized)
      localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString())
      lastSavedRef.current = serialized
      
      showSuccess('申請データを一時保存しました')
    } catch (error) {
      console.error('Auto-save error:', error)
      showError('一時保存に失敗しました')
    }
  }, [key, data])

  // 自動保存
  const scheduleAutoSave = useCallback(() => {
    if (!enabled) return

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const currentSerialized = JSON.stringify(data)
    
    // データが変更されている場合のみ保存
    if (currentSerialized !== lastSavedRef.current) {
      timeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(`autosave_${key}`, currentSerialized)
          localStorage.setItem(`autosave_${key}_timestamp`, Date.now().toString())
          lastSavedRef.current = currentSerialized
          
          // 自動保存の通知は控えめに
          console.log('Auto-saved:', key)
        } catch (error) {
          console.error('Auto-save error:', error)
        }
      }, interval)
    }
  }, [key, data, interval, enabled])

  // データ復元
  const loadSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(`autosave_${key}`)
      const timestamp = localStorage.getItem(`autosave_${key}_timestamp`)
      
      if (saved && timestamp) {
        const savedTime = new Date(parseInt(timestamp))
        const now = new Date()
        const hoursDiff = (now.getTime() - savedTime.getTime()) / (1000 * 60 * 60)
        
        // 24時間以内の保存データのみ復元提案
        if (hoursDiff < 24) {
          return {
            data: JSON.parse(saved),
            timestamp: savedTime,
            isRecent: hoursDiff < 1 // 1時間以内かどうか
          }
        }
      }
    } catch (error) {
      console.error('Load saved data error:', error)
    }
    return null
  }, [key])

  // データ削除
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(`autosave_${key}`)
    localStorage.removeItem(`autosave_${key}_timestamp`)
    lastSavedRef.current = ''
  }, [key])

  // データ変更時の自動保存スケジュール
  useEffect(() => {
    scheduleAutoSave()
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [scheduleAutoSave])

  // 最終保存時刻の取得
  const getLastSaveTime = useCallback(() => {
    const timestamp = localStorage.getItem(`autosave_${key}_timestamp`)
    return timestamp ? new Date(parseInt(timestamp)) : null
  }, [key])

  return {
    saveNow,
    loadSavedData,
    clearSavedData,
    getLastSaveTime
  }
}