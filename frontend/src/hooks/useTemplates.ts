/**
 * テンプレートフック
 * 申請書テンプレートの管理
 */

import { useState, useEffect, useCallback } from 'react'
import { logger } from '@/utils/logger'
import { showError, showSuccess } from '@/utils/error-handler'

interface Template {
  id: string
  name: string
  type: string
  description: string
  formData: any
  tags?: string[]
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

interface UseTemplatesOptions {
  userId?: string
  type?: string
  includeDefault?: boolean
}

export function useTemplates({
  userId = 'anonymous',
  type,
  includeDefault = true,
}: UseTemplatesOptions = {}) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(false)

  // テンプレートの取得
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        userId,
        ...(type && { type }),
        includeDefault: includeDefault.toString(),
      })
      
      const response = await fetch(`/api/templates?${params}`)
      
      if (!response.ok) {
        throw new Error('テンプレートの取得に失敗しました')
      }
      
      const result = await response.json()
      setTemplates(result.data || [])
      
      logger.info('テンプレート取得完了', { count: result.data?.length || 0 })
    } catch (error) {
      logger.error('テンプレート取得エラー', error)
      showError('テンプレートの取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }, [userId, type, includeDefault])

  // テンプレートの作成
  const createTemplate = useCallback(async (
    name: string,
    templateType: string,
    formData: any,
    description?: string,
    tags?: string[]
  ) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          name,
          type: templateType,
          formData,
          description,
          tags,
        }),
      })
      
      if (!response.ok) {
        throw new Error('テンプレートの作成に失敗しました')
      }
      
      const result = await response.json()
      const newTemplate = result.data
      
      // ローカルの状態を更新
      setTemplates(prev => [newTemplate, ...prev])
      
      showSuccess('テンプレートを保存しました')
      return newTemplate
    } catch (error) {
      logger.error('テンプレート作成エラー', error)
      showError('テンプレートの保存に失敗しました')
    }
  }, [userId])

  // テンプレートの更新
  const updateTemplate = useCallback(async (
    templateId: string,
    updates: {
      name?: string
      description?: string
      formData?: any
      tags?: string[]
    }
  ) => {
    try {
      const response = await fetch('/api/templates', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          templateId,
          ...updates,
        }),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'テンプレートの更新に失敗しました')
      }
      
      const result = await response.json()
      const updatedTemplate = result.data
      
      // ローカルの状態を更新
      setTemplates(prev =>
        prev.map(t => t.id === templateId ? updatedTemplate : t)
      )
      
      showSuccess('テンプレートを更新しました')
      return updatedTemplate
    } catch (error) {
      logger.error('テンプレート更新エラー', error)
      showError(error instanceof Error ? error.message : 'テンプレートの更新に失敗しました')
    }
  }, [userId])

  // テンプレートの削除
  const deleteTemplate = useCallback(async (templateId: string) => {
    try {
      const params = new URLSearchParams({ userId, templateId })
      const response = await fetch(`/api/templates?${params}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'テンプレートの削除に失敗しました')
      }
      
      // ローカルの状態を更新
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      
      showSuccess('テンプレートを削除しました')
    } catch (error) {
      logger.error('テンプレート削除エラー', error)
      showError(error instanceof Error ? error.message : 'テンプレートの削除に失敗しました')
    }
  }, [userId])

  // テンプレートの適用
  const applyTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId)
    if (!template) {
      showError('指定されたテンプレートが見つかりません')
      return null
    }
    
    logger.info('テンプレート適用', { templateId, templateName: template.name })
    return template.formData
  }, [templates])

  // 初期ロード
  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  // 便利なフィルタリング関数
  const getTemplatesByType = useCallback((filterType: string) => {
    return templates.filter(t => t.type === filterType)
  }, [templates])

  const getDefaultTemplates = useCallback(() => {
    return templates.filter(t => t.isDefault)
  }, [templates])

  const getCustomTemplates = useCallback(() => {
    return templates.filter(t => !t.isDefault)
  }, [templates])

  const searchTemplates = useCallback((query: string) => {
    const lowerQuery = query.toLowerCase()
    return templates.filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }, [templates])

  return {
    templates,
    loading,
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    applyTemplate,
    // フィルタリング関数
    getTemplatesByType,
    getDefaultTemplates,
    getCustomTemplates,
    searchTemplates,
  }
}