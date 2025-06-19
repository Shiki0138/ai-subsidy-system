'use client'

import { useState } from 'react'
import Link from 'next/link'
import { XMarkIcon, Bars3Icon } from '@heroicons/react/24/outline'

export function MobileMenu() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* モバイルメニューボタン */}
      <button 
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 text-gray-600 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
        aria-label="メニューを開く"
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
      </button>

      {/* モバイルメニューオーバーレイ */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed top-0 right-0 w-64 h-full bg-white shadow-xl transform transition-transform duration-300">
            <div className="flex items-center justify-between p-4 border-b">
              <span className="font-semibold text-gray-900">メニュー</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-600 hover:text-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
                aria-label="メニューを閉じる"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-4">
              <Link 
                href="#features" 
                className="block text-gray-600 hover:text-brand-600 transition-colors font-medium py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="機能セクションへ移動"
              >
                機能
              </Link>
              <Link 
                href="#security" 
                className="block text-gray-600 hover:text-brand-600 transition-colors font-medium py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded px-2"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="セキュリティセクションへ移動"
              >
                セキュリティ
              </Link>
              <div className="border-t pt-4 space-y-3">
                <Link 
                  href="/auth/login" 
                  className="block w-full text-center text-gray-600 hover:text-brand-600 transition-colors font-medium py-3 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="ログインページへ移動"
                >
                  ログイン
                </Link>
                <Link 
                  href="/auth/register" 
                  className="block w-full text-center bg-brand-600 text-white py-3 rounded-md font-semibold hover:bg-brand-700 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="無料アカウント作成"
                >
                  無料で始める
                </Link>
              </div>
            </nav>
          </div>
        </div>
      )}
    </>
  )
}