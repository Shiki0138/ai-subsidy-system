'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  HomeIcon,
  PlusCircleIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import {
  HomeIcon as HomeIconSolid,
  PlusCircleIcon as PlusCircleIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
  InformationCircleIcon as InformationCircleIconSolid,
  UserIcon as UserIconSolid
} from '@heroicons/react/24/solid'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  iconSolid: React.ComponentType<{ className?: string }>
  description: string
  priority: 'primary' | 'secondary' | 'tertiary'
  highlight?: boolean
  isDemo?: boolean
}

interface NavigationProps {
  currentPath: string
  isMobile?: boolean
  user?: {
    name: string
    companyName: string
  }
  onLogout?: () => void
}

const mainNavigation: NavigationItem[] = [
  {
    name: 'ダッシュボード',
    href: '/dashboard',
    icon: HomeIcon,
    iconSolid: HomeIconSolid,
    description: 'メイン画面・概要確認',
    priority: 'primary'
  },
  {
    name: '新規作成',
    href: '/dashboard/applications/new',
    icon: PlusCircleIcon,
    iconSolid: PlusCircleIconSolid,
    description: '申請書を新規作成',
    priority: 'primary',
    highlight: true
  },
  {
    name: '申請書管理',
    href: '/dashboard/applications',
    icon: DocumentTextIcon,
    iconSolid: DocumentTextIconSolid,
    description: '作成済み申請書の管理',
    priority: 'secondary',
    isDemo: true
  },
  {
    name: '補助金情報',
    href: '/dashboard/subsidy-programs',
    icon: InformationCircleIcon,
    iconSolid: InformationCircleIconSolid,
    description: '利用可能な補助金情報',
    priority: 'secondary',
    isDemo: true
  },
  {
    name: 'プロフィール',
    href: '/dashboard/profile',
    icon: UserIcon,
    iconSolid: UserIconSolid,
    description: 'アカウント・企業情報設定',
    priority: 'tertiary',
    isDemo: true
  }
]

export function MainNavigation({ currentPath, isMobile = false, user, onLogout }: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  // パスの正規化
  const normalizedPath = currentPath || pathname

  // モバイルメニューの開閉
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  // メニューアイテムがアクティブかどうかを判定
  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return normalizedPath === '/dashboard'
    }
    return normalizedPath.startsWith(href)
  }

  // デスクトップナビゲーション
  if (!isMobile) {
    return (
      <nav className="hidden md:flex items-center space-x-1">
        {mainNavigation.map((item) => {
          const Icon = isActive(item.href) ? item.iconSolid : item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center space-x-2 ${
                active
                  ? 'bg-brand-100 text-brand-700 shadow-sm'
                  : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
              } ${
                item.highlight 
                  ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white hover:from-brand-700 hover:to-purple-700 shadow-md' 
                  : ''
              }`}
              title={item.description}
            >
              <Icon className="h-4 w-4" />
              <span>{item.name}</span>
              {item.highlight && (
                <SparklesIcon className="h-3 w-3 opacity-80" />
              )}
              {item.isDemo && (
                <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">DEMO</span>
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  // モバイルナビゲーション
  return (
    <>
      {/* モバイルメニューボタン */}
      <div className="md:hidden">
        <button
          type="button"
          className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
          onClick={toggleMobileMenu}
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* モバイルメニューオーバーレイ */}
      {isMobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-25 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl md:hidden">
            <div className="flex flex-col h-full">
              {/* ヘッダー */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-2">
                  <SparklesIcon className="h-6 w-6 text-brand-600" />
                  <span className="font-semibold text-gray-900">メニュー</span>
                </div>
                <button
                  type="button"
                  className="p-2 rounded-md text-gray-400 hover:text-gray-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              {/* ユーザー情報 */}
              {user && (
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-600">{user.companyName}</div>
                </div>
              )}

              {/* ナビゲーションアイテム */}
              <nav className="flex-1 px-4 py-6 space-y-2">
                {mainNavigation.map((item) => {
                  const Icon = isActive(item.href) ? item.iconSolid : item.icon
                  const active = isActive(item.href)
                  
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        active
                          ? 'bg-brand-100 text-brand-700 shadow-sm'
                          : 'text-gray-600 hover:text-brand-600 hover:bg-brand-50'
                      } ${
                        item.highlight 
                          ? 'bg-gradient-to-r from-brand-600 to-purple-600 text-white shadow-md' 
                          : ''
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span>{item.name}</span>
                          {item.highlight && (
                            <SparklesIcon className="h-3 w-3 opacity-80" />
                          )}
                          {item.isDemo && (
                            <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">DEMO</span>
                          )}
                        </div>
                        <div className={`text-xs mt-1 ${
                          active || item.highlight ? 'opacity-80' : 'text-gray-500'
                        }`}>
                          {item.description}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </nav>

              {/* フッター */}
              <div className="p-4 border-t border-gray-200">
                {onLogout && (
                  <button
                    onClick={() => {
                      onLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full px-3 py-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors duration-200"
                  >
                    ログアウト
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}

// ボトムナビゲーション（スマートフォン用）
export function BottomNavigation({ currentPath }: { currentPath: string }) {
  const pathname = usePathname()
  const normalizedPath = currentPath || pathname

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return normalizedPath === '/dashboard'
    }
    return normalizedPath.startsWith(href)
  }

  // 主要なナビゲーションアイテムのみ表示
  const bottomNavItems = mainNavigation.filter(item => 
    item.priority === 'primary' || item.href === '/dashboard/profile'
  )

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-30">
      <nav className="flex justify-around">
        {bottomNavItems.map((item) => {
          const Icon = isActive(item.href) ? item.iconSolid : item.icon
          const active = isActive(item.href)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center py-2 px-3 transition-all duration-200 ${
                active
                  ? 'text-brand-600'
                  : 'text-gray-600'
              } ${
                item.highlight 
                  ? 'bg-gradient-to-t from-brand-600 to-purple-600 text-white rounded-t-lg' 
                  : ''
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">{item.name}</span>
              {item.highlight && (
                <div className="absolute -top-1 right-1">
                  <SparklesIcon className="h-3 w-3 text-yellow-300" />
                </div>
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}