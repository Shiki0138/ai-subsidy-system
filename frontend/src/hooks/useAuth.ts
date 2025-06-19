'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  name: string
  companyName: string
  createdAt: string
  updatedAt: string
}

interface LoginData {
  email: string
  password: string
}

interface RegisterData {
  email: string
  password: string
  name: string
  companyName: string
}

interface AuthResponse {
  success: boolean
  token: string
  user: User
}

export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  // トークンの管理
  const getToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('token')
  }

  const setToken = (token: string) => {
    localStorage.setItem('token', token)
  }

  const removeToken = () => {
    localStorage.removeItem('token')
  }

  // ユーザー情報取得
  const { data: user, isLoading: isUserLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const token = getToken()
      if (!token) return null

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          removeToken()
          return null
        }
        throw new Error('ユーザー情報の取得に失敗しました')
      }

      const result = await response.json()
      return result.user
    },
    enabled: !!getToken(),
    retry: false,
  })

  // ログイン
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'ログインに失敗しました')
      }

      return result
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.setQueryData(['user'], data.user)
      toast.success('ログインしました')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 新規登録
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'アカウント作成に失敗しました')
      }

      return result
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.setQueryData(['user'], data.user)
      toast.success('アカウントを作成しました')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // ログアウト
  const logout = () => {
    removeToken()
    queryClient.setQueryData(['user'], null)
    queryClient.clear()
    toast.success('ログアウトしました')
    router.push('/auth/login')
  }

  // 初期化完了の判定
  useEffect(() => {
    if (!isUserLoading || !getToken()) {
      setIsInitialized(true)
    }
  }, [isUserLoading])

  const isAuthenticated = !!user && !!getToken()
  const isLoading = !isInitialized || (getToken() && isUserLoading)

  return {
    user,
    isAuthenticated,
    isLoading,
    login: loginMutation.mutate,
    register: registerMutation.mutate,
    logout,
    isLoginLoading: loginMutation.isPending,
    isRegisterLoading: registerMutation.isPending,
  }
}