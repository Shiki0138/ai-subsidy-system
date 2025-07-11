/**
 * 安全なAPI呼び出しフック
 */

import { useState, useCallback } from 'react'
import { ApiResponse } from '@/types/api'
import { handleError, showError, showSuccess } from '@/utils/error-handler'

interface UseApiCallOptions {
  showErrorToast?: boolean
  showSuccessToast?: boolean
  successMessage?: string
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
}

export function useApiCall<T = any>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiCallOptions = {}
) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [data, setData] = useState<T | null>(null)

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await apiFunction(...args)
        
        if (response.success) {
          setData(response.data || null)
          
          if (options.showSuccessToast && options.successMessage) {
            showSuccess(options.successMessage)
          }
          
          options.onSuccess?.(response.data)
          return response.data || null
        } else {
          const error = new Error(response.error?.message || 'APIエラー')
          setError(error)
          
          if (options.showErrorToast !== false) {
            showError(response.error?.message || 'エラーが発生しました')
          }
          
          options.onError?.(error)
          return null
        }
      } catch (err) {
        const error = handleError(err, 'API Call')
        setError(error)
        
        if (options.showErrorToast !== false) {
          showError(error)
        }
        
        options.onError?.(error)
        return null
      } finally {
        setLoading(false)
      }
    },
    [apiFunction, options]
  )

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setData(null)
  }, [])

  return {
    execute,
    loading,
    error,
    data,
    reset
  }
}

// 複数のAPI呼び出しを並行実行
export function useParallelApiCalls() {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, Error>>({})

  const execute = useCallback(
    async (
      calls: Record<string, () => Promise<ApiResponse<any>>>
    ): Promise<Record<string, any>> => {
      setLoading(true)
      setErrors({})
      
      const results: Record<string, any> = {}
      const errors: Record<string, Error> = {}
      
      try {
        const entries = Object.entries(calls)
        const promises = entries.map(async ([key, fn]) => {
          try {
            const response = await fn()
            if (response.success) {
              results[key] = response.data
            } else {
              errors[key] = new Error(response.error?.message || 'APIエラー')
            }
          } catch (err) {
            errors[key] = handleError(err, `API Call: ${key}`)
          }
        })
        
        await Promise.all(promises)
        
        if (Object.keys(errors).length > 0) {
          setErrors(errors)
        }
        
        return results
      } finally {
        setLoading(false)
      }
    },
    []
  )

  return {
    execute,
    loading,
    errors,
    hasErrors: Object.keys(errors).length > 0
  }
}