'use client'

import { 
  UserIcon, 
  BuildingOfficeIcon, 
  EnvelopeIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/react/24/outline'

interface User {
  id: string
  email: string
  name: string
  companyName: string
  createdAt: string
  updatedAt: string
}

interface ProfileSummaryProps {
  user: User
}

export function ProfileSummary({ user }: ProfileSummaryProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <div className="space-y-8">
      {/* プロフィールヘッダー */}
      <div className="card p-8">
        <div className="flex items-center space-x-6">
          <div className="bg-brand-100 rounded-full p-4">
            <UserIcon className="h-12 w-12 text-brand-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
            <p className="text-lg text-gray-600">{user.companyName}</p>
          </div>
        </div>
      </div>

      {/* 基本情報 */}
      <div className="card p-8">
        <div className="flex items-center space-x-2 mb-6">
          <UserIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">基本情報</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">お名前</label>
              <p className="mt-1 text-sm text-gray-900">{user.name}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">メールアドレス</label>
              <div className="mt-1 flex items-center space-x-2">
                <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                <p className="text-sm text-gray-900">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">ユーザーID</label>
              <p className="mt-1 text-sm text-gray-600 font-mono">{user.id}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 企業情報 */}
      <div className="card p-8">
        <div className="flex items-center space-x-2 mb-6">
          <BuildingOfficeIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">企業情報</h3>
        </div>
        
        <div>
          <label className="text-sm font-medium text-gray-500">会社名・屋号</label>
          <p className="mt-1 text-sm text-gray-900">{user.companyName}</p>
        </div>
      </div>

      {/* アカウント情報 */}
      <div className="card p-8">
        <div className="flex items-center space-x-2 mb-6">
          <ClockIcon className="h-5 w-5 text-gray-500" />
          <h3 className="text-lg font-medium text-gray-900">アカウント情報</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium text-gray-500">アカウント作成日</label>
            <div className="mt-1 flex items-center space-x-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{formatDate(user.createdAt)}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-500">最終更新日</label>
            <div className="mt-1 flex items-center space-x-2">
              <ClockIcon className="h-4 w-4 text-gray-400" />
              <p className="text-sm text-gray-900">{formatDate(user.updatedAt)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* セキュリティ情報 */}
      <div className="card p-8 bg-gray-50">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div className="text-sm">
            <p className="font-medium text-gray-900 mb-1">アカウントセキュリティ</p>
            <p className="text-gray-600">
              アカウントは暗号化されて保護されています。
              定期的にパスワードを変更し、セキュリティを維持してください。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}