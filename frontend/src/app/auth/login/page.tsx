import { Metadata } from 'next'
import Link from 'next/link'
import { SparklesIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import { LoginForm } from '../../../components/auth/LoginForm'

export const metadata: Metadata = {
  title: 'ログイン - AI補助金申請システム',
  description: 'AI補助金申請システムにログインして、申請書の作成・管理を開始しましょう。',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {/* ヘッダーナビゲーション */}
      <div className="absolute top-4 left-4">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
          aria-label="ホームページに戻る"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" aria-hidden="true" />
          ホームに戻る
        </Link>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Link href="/" className="flex items-center space-x-2 group">
            <SparklesIcon className="h-8 w-8 text-brand-600 group-hover:animate-pulse" aria-hidden="true" />
            <h1 className="text-2xl font-bold text-gray-900 group-hover:text-brand-600 transition-colors">
              AI補助金申請システム
            </h1>
          </Link>
        </div>
        
        <div className="text-center mt-6">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            おかえりなさい
          </h2>
          <p className="mt-2 text-gray-600">
            AIで効率的な申請書作成を続けましょう
          </p>
        </div>
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            アカウントをお持ちでない方は{' '}
            <Link 
              href="/auth/register" 
              className="font-medium text-brand-600 hover:text-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-1"
              aria-label="新規アカウント登録ページへ移動"
            >
              無料登録はこちら
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg border border-gray-100 sm:rounded-xl sm:px-10">
          <LoginForm />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-3 text-gray-500 font-medium">サポート</span>
              </div>
            </div>

            <div className="mt-6 flex flex-col space-y-3 text-center">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-brand-600 hover:text-brand-500 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
                aria-label="パスワードリセットページへ移動"
              >
                パスワードをお忘れですか？
              </Link>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-brand-600 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2 py-1"
                aria-label="テスト環境を試用"
              >
                📝 テスト環境で試してみる
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 text-center max-w-sm mx-auto">
        <p className="text-xs text-gray-500 leading-relaxed">
          ログインすることで、
          <Link 
            href="/privacy" 
            className="text-brand-600 hover:text-brand-500 underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            aria-label="プライバシーポリシーを確認"
          >
            プライバシーポリシー
          </Link>
          と
          <Link 
            href="/terms" 
            className="text-brand-600 hover:text-brand-500 underline focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            aria-label="利用規約を確認"
          >
            利用規約
          </Link>
          に同意したものとみなされます。
        </p>
        
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-700">
            🔒 すべての通信は256bit SSL暗号化で保護されています
          </p>
        </div>
      </div>
    </div>
  )
}