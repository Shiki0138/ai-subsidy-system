'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { EyeIcon, EyeSlashIcon, InformationCircleIcon } from '@heroicons/react/24/outline'
import { useAuth } from '@/hooks'

// バリデーションスキーマ
const registerSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string()
    .min(8, 'パスワードは8文字以上である必要があります')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
           'パスワードは英大文字、英小文字、数字、記号を含む必要があります'),
  name: z.string().min(1, '代表者名は必須です').max(50),
  companyName: z.string().min(1, '会社名は必須です').max(100),
  agreeToTerms: z.boolean().refine(val => val === true, {
    message: '利用規約とプライバシーポリシーに同意する必要があります'
  }),
})

type RegisterFormData = z.infer<typeof registerSchema>

// 業種選択肢
const businessTypes = [
  '製造業',
  '情報通信業',
  '建設業',
  '運輸業・郵便業',
  '卸売業・小売業',
  '金融業・保険業',
  '不動産業・物品賃貸業',
  '学術研究・専門・技術サービス業',
  '宿泊業・飲食サービス業',
  '生活関連サービス業・娯楽業',
  '教育・学習支援業',
  '医療・福祉',
  'サービス業（他に分類されないもの）',
  'その他',
]

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false)
  const { register: registerUser, isRegisterLoading } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreeToTerms: false,
    }
  })

  const password = watch('password')

  const onSubmit = (data: RegisterFormData) => {
    const { agreeToTerms, ...submitData } = data
    registerUser({
      email: submitData.email,
      password: submitData.password,
      name: submitData.name,
      companyName: submitData.companyName,
    })
  }

  // パスワード強度チェック
  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[@$!%*?&]/.test(password)) strength++
    return strength
  }

  const passwordStrength = password ? getPasswordStrength(password) : 0
  const strengthLabels = ['非常に弱い', '弱い', '普通', '強い', '非常に強い']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-green-600']

  return (
    <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="space-y-6">
          
          <div>
            <label htmlFor="email" className="form-label">
              メールアドレス *
            </label>
            <div className="mt-1">
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                className={`form-input ${errors.email ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="example@company.com"
              />
              {errors.email && (
                <p className="form-error">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              パスワード *
            </label>
            <div className="mt-1 relative">
              <input
                {...register('password')}
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                className={`form-input pr-10 ${errors.password ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
                placeholder="パスワードを入力"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                ) : (
                  <EyeIcon className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            
            {/* パスワード強度表示 */}
            {password && (
              <div className="mt-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`w-4 h-2 rounded ${
                          level <= passwordStrength
                            ? strengthColors[passwordStrength - 1]
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {strengthLabels[passwordStrength - 1] || ''}
                  </span>
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  英大文字、英小文字、数字、記号(@$!%*?&)を含む8文字以上
                </div>
              </div>
            )}
            
            {errors.password && (
              <p className="form-error">{errors.password.message}</p>
            )}
          </div>
        
        <div>
          <label htmlFor="name" className="form-label">
            代表者名 *
          </label>
          <div className="mt-1">
            <input
              {...register('name')}
              type="text"
              className={`form-input ${errors.name ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="companyName" className="form-label">
            会社名・屋号 *
          </label>
          <div className="mt-1">
            <input
              {...register('companyName')}
              type="text"
              className={`form-input ${errors.companyName ? 'border-error-500 focus:border-error-500 focus:ring-error-500' : ''}`}
              placeholder="株式会社○○"
            />
            {errors.companyName && (
              <p className="form-error">{errors.companyName.message}</p>
            )}
          </div>
        </div>

        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                {...register('agreeToTerms')}
                type="checkbox"
                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="agreeToTerms" className="text-gray-700">
                <span className="font-medium">利用規約</span>と
                <span className="font-medium">プライバシーポリシー</span>に同意します *
              </label>
              {errors.agreeToTerms && (
                <p className="form-error mt-1">{errors.agreeToTerms.message}</p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex">
              <InformationCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
              <div className="ml-3 text-sm text-blue-700">
                <p>
                  入力された企業情報は暗号化されて保護されます。
                  AI処理時は匿名化され、第三者に共有されることはありません。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={isRegisterLoading}
          className="btn-primary w-full flex justify-center items-center"
        >
          {isRegisterLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              アカウント作成中...
            </>
          ) : (
            'アカウント作成'
          )}
        </button>
      </div>
    </form>
  )
}