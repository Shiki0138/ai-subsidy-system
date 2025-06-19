import { redirect } from 'next/navigation'

export default function HomePage() {
  // 開発環境では直接ダッシュボードへリダイレクト
  redirect('/dashboard')
}