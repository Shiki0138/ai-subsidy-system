'use client'

import Link from 'next/link'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

interface BreadcrumbItem {
  name: string
  href?: string
  current?: boolean
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  showHome?: boolean
}

export function Breadcrumb({ items, showHome = true }: BreadcrumbProps) {
  // ホームアイテムを含むアイテムリストを構築
  const allItems = showHome 
    ? [{ name: 'ホーム', href: '/dashboard' }, ...items]
    : items

  return (
    <nav className="flex" aria-label="パンくずリスト">
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1
          const isFirst = index === 0

          return (
            <li key={index} className="inline-flex items-center">
              {/* 区切り文字（最初のアイテム以外） */}
              {!isFirst && (
                <ChevronRightIcon className="flex-shrink-0 h-4 w-4 text-gray-400 mx-1" />
              )}
              
              <div className="flex items-center">
                {/* ホームアイコン（最初のアイテムでホーム表示の場合） */}
                {isFirst && showHome && (
                  <HomeIcon className="flex-shrink-0 h-4 w-4 mr-2 text-gray-400" />
                )}
                
                {/* リンクまたはテキスト */}
                {isLast || !item.href ? (
                  <span className={`text-sm font-medium ${
                    isLast 
                      ? 'text-gray-900' 
                      : 'text-gray-700'
                  }`}>
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="text-sm font-medium text-gray-600 hover:text-brand-600 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

// よく使われるブレッドクラムのパターンを自動生成
export function generateBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const pathSegments = pathname.split('/').filter(segment => segment !== '')
  
  const breadcrumbMap: Record<string, string> = {
    'dashboard': 'ダッシュボード',
    'applications': '申請書管理',
    'new': '新規作成',
    'profile': 'プロフィール',
    'subsidy-programs': '補助金情報',
    'settings': '設定'
  }

  const items: BreadcrumbItem[] = []
  let currentPath = ''

  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`
    const isLast = index === pathSegments.length - 1
    
    // 動的なID（数字やUUID）の場合は詳細ページとして扱う
    if (/^[0-9a-f-]+$/i.test(segment)) {
      items.push({
        name: '詳細',
        href: isLast ? undefined : currentPath,
        current: isLast
      })
    } else {
      const name = breadcrumbMap[segment] || segment
      items.push({
        name,
        href: isLast ? undefined : currentPath,
        current: isLast
      })
    }
  })

  return items
}

// 特定のページ用のカスタムブレッドクラム
export function ApplicationDetailsBreadcrumb({ 
  applicationTitle 
}: { 
  applicationTitle: string 
}) {
  const items: BreadcrumbItem[] = [
    { name: '申請書管理', href: '/dashboard/applications' },
    { name: applicationTitle, current: true }
  ]

  return <Breadcrumb items={items} />
}

export function NewApplicationBreadcrumb() {
  const items: BreadcrumbItem[] = [
    { name: '申請書管理', href: '/dashboard/applications' },
    { name: '新規作成', current: true }
  ]

  return <Breadcrumb items={items} />
}