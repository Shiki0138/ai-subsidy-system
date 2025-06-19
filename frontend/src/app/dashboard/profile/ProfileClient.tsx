'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { ProfileEditForm } from '@/components/profile/ProfileEditForm'
import { ProfileSummary } from '@/components/profile/ProfileSummary'
import { 
  UserCircleIcon, 
  PencilIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline'
import { useRouter } from 'next/navigation'

export function ProfileClient() {
  const [isEditing, setIsEditing] = useState(false)
  const { user, isLoading } = useAuth()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">プロフィールを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">ユーザー情報が見つかりません</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container-fluid">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div className="flex items-center space-x-2">
                <UserCircleIcon className="h-6 w-6 text-brand-600" />
                <h1 className="text-lg font-semibold text-gray-900">
                  プロフィール管理
                </h1>
              </div>
            </div>
            <div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="btn-primary flex items-center space-x-2"
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>編集</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-8 max-w-4xl">
        {isEditing ? (
          <div className="card p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                プロフィール編集
              </h2>
              <button
                onClick={() => setIsEditing(false)}
                className="btn-outline"
              >
                キャンセル
              </button>
            </div>
            <ProfileEditForm 
              user={user} 
              onSuccess={() => setIsEditing(false)} 
            />
          </div>
        ) : (
          <ProfileSummary user={user} />
        )}
      </main>
    </div>
  )
}