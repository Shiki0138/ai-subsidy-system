'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'

const profileSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50),
  email: z.string().email('有効なメールアドレスを入力してください'),
  companyName: z.string().min(1, '会社名は必須です').max(100),
})

type ProfileFormData = z.infer<typeof profileSchema>

interface User {
  id: string
  email: string
  name: string
  companyName: string
  createdAt: string
  updatedAt: string
}

interface ProfileEditFormProps {
  user: User
  onSuccess: () => void
}

export function ProfileEditForm({ user, onSuccess }: ProfileEditFormProps) {
  const queryClient = useQueryClient()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      companyName: user.companyName,
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('認証が必要です')
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'プロフィールの更新に失敗しました')
      }

      return result.data
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(['user'], updatedUser)
      toast.success('プロフィールを更新しました')
      onSuccess()
    },
    onError: (error: Error) => {
      toast.error(error.message)
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* 基本情報セクション */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <UserIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="form-label">
              お名前 *
            </label>
            <input
              {...register('name')}
              type="text"
              className={`form-input ${errors.name ? 'border-error-500' : ''}`}
              placeholder="山田 太郎"
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="form-label">
              メールアドレス *
            </label>
            <input
              {...register('email')}
              type="email"
              className={`form-input ${errors.email ? 'border-error-500' : ''}`}
              placeholder="example@company.com"
            />
            {errors.email && (
              <p className="form-error">{errors.email.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* 企業情報セクション */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">企業情報</h3>
        </div>
        
        <div>
          <label htmlFor="companyName" className="form-label">
            会社名・屋号 *
          </label>
          <input
            {...register('companyName')}
            type="text"
            className={`form-input ${errors.companyName ? 'border-error-500' : ''}`}
            placeholder="株式会社○○"
          />
          {errors.companyName && (
            <p className="form-error">{errors.companyName.message}</p>
          )}
        </div>
      </div>

      {/* セキュリティ情報 */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-sm text-blue-700">
            <p className="font-medium mb-1">セキュリティについて</p>
            <p>
              メールアドレスの変更には再認証が必要です。
              変更後、新しいメールアドレスに確認メールが送信されます。
            </p>
          </div>
        </div>
      </div>

      {/* アクションボタン */}
      <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
        <button
          type="submit"
          disabled={updateProfileMutation.isPending}
          className="btn-primary flex items-center space-x-2"
        >
          {updateProfileMutation.isPending ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>更新中...</span>
            </>
          ) : (
            <span>更新</span>
          )}
        </button>
      </div>
    </form>
  )
}