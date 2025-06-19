import { Metadata } from 'next'
import { Suspense } from 'react'
import { ProfileClient } from './ProfileClient'

export const metadata: Metadata = {
  title: 'プロフィール管理 - AI補助金申請システム',
  description: 'ユーザープロフィールと企業情報を管理します。',
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ProfileClient />
    </Suspense>
  )
}