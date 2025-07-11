'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks/useAuth'

// バリデーションスキーマ
const loginSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードを入力してください'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoginLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = (data: LoginFormData) => {
    login({
      email: data.email,
      password: data.password,
    })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
      <div>
        <label htmlFor="email" className="form-label">
          <span className="flex items-center">
            📧 メールアドレス
            <span className="text-red-500 ml-1" aria-label="必須項目">*</span>
          </span>
        </label>
        <div className="mt-2">
          <input
            {...register('email')}
            id="email"
            type="email"
            autoComplete="email"
            className={`form-input ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
            placeholder="例: tanaka@company.co.jp"
            aria-invalid={errors.email ? 'true' : 'false'}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email && (
            <p id="email-error" className="form-error" role="alert">
              <span className="inline-flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.email.message}
              </span>
            </p>
          )}
        </div>
      </div>

      <div>
        <label htmlFor="password" className="form-label">
          <span className="flex items-center">
            🔐 パスワード
            <span className="text-red-500 ml-1" aria-label="必須項目">*</span>
          </span>
        </label>
        <div className="mt-2 relative">
          <input
            {...register('password')}
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            className={`form-input pr-12 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
            placeholder="パスワードを入力してください"
            aria-invalid={errors.password ? 'true' : 'false'}
            aria-describedby={errors.password ? 'password-error' : 'password-help'}
          />
          <button
            type="button"
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none focus:text-brand-600"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'パスワードを非表示' : 'パスワードを表示'}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" aria-hidden="true" />
            ) : (
              <EyeIcon className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
          {errors.password && (
            <p id="password-error" className="form-error" role="alert">
              <span className="inline-flex items-center">
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.password.message}
              </span>
            </p>
          )}
          {!errors.password && (
            <p id="password-help" className="text-xs text-gray-500 mt-1">
              ログインに問題がある場合は、パスワードリセットをお試しください
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <input
            id="remember-me"
            name="remember-me"
            type="checkbox"
            className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded focus:ring-2"
            aria-describedby="remember-me-description"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 cursor-pointer">
            ログイン状態を保持する
          </label>
        </div>
        <div className="text-xs text-gray-500" id="remember-me-description">
          公共のPCでは推奨しません
        </div>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isLoginLoading}
          className="btn-primary w-full flex justify-center items-center h-12 text-base font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          aria-describedby="login-help"
        >
          {isLoginLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              ログイン中...
            </>
          ) : (
            <>
              <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              ログインして始める
            </>
          )}
        </button>
        <p id="login-help" className="text-xs text-gray-500 text-center mt-2">
          ログイン後、すぐにAI申請書作成を開始できます
        </p>
      </div>

      {/* セキュリティ情報 */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-start space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-green-800 mb-1">
              安全なログイン
            </p>
            <p className="text-xs text-green-700 leading-relaxed">
              すべての通信は256bit SSL暗号化で保護され、個人情報は厳重に管理されています。
            </p>
            <div className="mt-2 flex items-center space-x-4 text-xs text-green-600">
              <span>✓ ISO 27001準拠</span>
              <span>✓ 国内データセンター</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}