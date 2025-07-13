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

// 認証機能を一時的に無効化（将来の実装用）
export function useAuth() {
  const [isInitialized, setIsInitialized] = useState(true) // 常に初期化済みとする
  const router = useRouter()
  const queryClient = useQueryClient()
  
  // デモ用のユーザーデータ
  const demoUser: User = {
    id: 'demo-user-001',
    email: 'demo@example.com',
    name: 'デモユーザー',
    companyName: 'デモ企業',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

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

  // ユーザー情報取得（デモモード）
  const { data: user, isLoading: isUserLoading, error } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      // 認証機能が実装されるまでは常にデモユーザーを返す
      return demoUser
    },
    enabled: true,
    retry: false,
  })

  // ログイン（デモモード）
  const loginMutation = useMutation({
    mutationFn: async (data: LoginData): Promise<AuthResponse> => {
      // 認証機能が実装されるまでは常に成功を返す
      await new Promise(resolve => setTimeout(resolve, 1000)) // 遅延をシミュレート
      
      return {
        success: true,
        token: 'demo-token-' + Date.now(),
        user: demoUser,
      }
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.setQueryData(['user'], data.user)
      toast.success('デモモードでログインしました')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // 新規登録（デモモード）
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData): Promise<AuthResponse> => {
      // 認証機能が実装されるまでは常に成功を返す
      await new Promise(resolve => setTimeout(resolve, 1000)) // 遅延をシミュレート
      
      const newUser: User = {
        ...demoUser,
        email: data.email,
        name: data.name,
        companyName: data.companyName,
      }
      
      return {
        success: true,
        token: 'demo-token-' + Date.now(),
        user: newUser,
      }
    },
    onSuccess: (data) => {
      setToken(data.token)
      queryClient.setQueryData(['user'], data.user)
      toast.success('デモモードでアカウントを作成しました')
      router.push('/dashboard')
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  // ログアウト（デモモード）
  const logout = () => {
    removeToken()
    queryClient.setQueryData(['user'], null)
    queryClient.clear()
    toast.success('ログアウトしました（デモモード）')
    router.push('/')
  }

  // 初期化完了の判定
  useEffect(() => {
    if (!isUserLoading || !getToken()) {
      setIsInitialized(true)
    }
  }, [isUserLoading])

  // デモモードでは常に認証済みとする
  const isAuthenticated = true
  const isLoading = false

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