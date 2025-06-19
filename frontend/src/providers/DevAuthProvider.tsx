'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  email: string
  companyName: string
  role: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  quickLogin: (email?: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function DevAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // 開発環境での自動認証
    const initAuth = async () => {
      try {
        // 既存のトークンをチェック
        const token = localStorage.getItem('token')
        
        if (!token && process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
          // トークンがない場合は自動ログイン
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7001'}/api/dev-auth/auto-login`)
          
          if (response.ok) {
            const data = await response.json()
            localStorage.setItem('token', data.token)
            localStorage.setItem('refreshToken', data.refreshToken)
            setUser(data.user)
            console.log('🔓 開発環境: 自動ログイン完了')
          }
        } else if (token) {
          // トークンがある場合はユーザー情報を設定
          setUser({
            id: 'dev-user-001',
            email: 'dev@ai-subsidy.test',
            companyName: '開発テスト株式会社',
            role: 'user'
          })
        }
      } catch (error) {
        console.error('認証初期化エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // 開発環境では常に成功
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
        const mockUser = {
          id: 'dev-user-001',
          email: email || 'dev@ai-subsidy.test',
          companyName: email ? `${email.split('@')[0]}株式会社` : '開発テスト株式会社',
          role: 'user'
        }
        
        localStorage.setItem('token', 'dev-token-' + Date.now())
        setUser(mockUser)
        console.log('🔓 開発ログイン成功:', mockUser.email)
        return true
      }

      // 本番環境の場合は通常のログイン処理
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        localStorage.setItem('refreshToken', data.refreshToken)
        setUser(data.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('ログインエラー:', error)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    setUser(null)
    router.push('/')
  }

  const quickLogin = async (email?: string): Promise<boolean> => {
    try {
      if (process.env.NEXT_PUBLIC_DISABLE_AUTH === 'true') {
        return login(email || 'dev@ai-subsidy.test', 'dummy-password')
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dev-auth/quick-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email || 'dev@ai-subsidy.test' })
      })
      
      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('token', data.token)
        setUser(data.user)
        return true
      }
      
      return false
    } catch (error) {
      console.error('クイックログインエラー:', error)
      return false
    }
  }

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    quickLogin
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}