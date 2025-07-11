'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  name: string
  companyName: string
  createdAt: string
  updatedAt: string
}

// 開発用のモックユーザー
const MOCK_USER: User = {
  id: 'dev-user-001',
  email: 'dev@ai-subsidy.test',
  name: '開発太郎',
  companyName: '開発テスト株式会社',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 開発環境では常にログイン状態にする
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
      setUser(MOCK_USER)
      setIsLoading(false)
      console.log('🔓 開発モード: 自動ログイン完了')
    } else {
      // 本番環境の場合は既存のトークンをチェック
      const token = localStorage.getItem('token')
      if (token) {
        setUser(MOCK_USER) // 本番でも一時的にモックを使用
      }
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('🔓 開発モード: ログイン処理（常に成功）')
    setUser({
      ...MOCK_USER,
      email: email || MOCK_USER.email,
      companyName: email ? `${email.split('@')[0]}株式会社` : MOCK_USER.companyName
    })
    return true
  }

  const register = async (data: any) => {
    console.log('🔓 開発モード: 登録処理（常に成功）')
    setUser({
      ...MOCK_USER,
      ...data
    })
    return true
  }

  const logout = () => {
    console.log('🔓 開発モード: ログアウト')
    if (process.env.NEXT_PUBLIC_DISABLE_AUTH !== 'true') {
      localStorage.removeItem('token')
      router.push('/')
    }
    // 開発モードではログアウトしても自動的に再ログイン
    setTimeout(() => {
      setUser(MOCK_USER)
    }, 100)
  }

  return {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    isLoginLoading: false,
    isRegisterLoading: false,
  }
}