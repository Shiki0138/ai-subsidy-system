'use client'

import { useEffect, useState } from 'react'
import { Save, Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AutoSaveIndicatorProps {
  lastSaveTime: Date | null
  onSave: () => void
  isSaving?: boolean
}

export function AutoSaveIndicator({ lastSaveTime, onSave, isSaving = false }: AutoSaveIndicatorProps) {
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (lastSaveTime && !isSaving) {
      setShowSaved(true)
      const timer = setTimeout(() => setShowSaved(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [lastSaveTime, isSaving])

  const formatTime = (date: Date | null) => {
    if (!date) return '未保存'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'たった今'
    if (minutes < 60) return `${minutes}分前`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}時間前`
    return date.toLocaleDateString('ja-JP')
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
      {/* 保存ボタン */}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={onSave}
        disabled={isSaving}
        className="flex items-center gap-2 text-xs sm:text-sm"
      >
        {isSaving ? (
          <>
            <div className="animate-spin h-3 w-3 border-2 border-gray-500 border-t-transparent rounded-full" />
            <span className="hidden sm:inline">保存中...</span>
            <span className="sm:hidden">保存中</span>
          </>
        ) : (
          <>
            <Save className="h-3 w-3" />
            <span className="hidden sm:inline">一時保存</span>
            <span className="sm:hidden">保存</span>
          </>
        )}
      </Button>

      {/* 保存状態の表示 */}
      <div className="text-xs text-gray-500 flex items-center gap-1">
        {showSaved ? (
          <>
            <Check className="h-3 w-3 text-green-600" />
            <span className="text-green-600">保存しました</span>
          </>
        ) : lastSaveTime ? (
          <>
            <span className="hidden sm:inline">最終保存: {formatTime(lastSaveTime)}</span>
            <span className="sm:hidden">{formatTime(lastSaveTime)}</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-3 w-3" />
            <span>未保存</span>
          </>
        )}
      </div>
    </div>
  )
}