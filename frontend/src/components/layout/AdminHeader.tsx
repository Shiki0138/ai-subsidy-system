'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  FileSliders, 
  Home, 
  ArrowLeft,
  Shield,
  Users,
  Database
} from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();

  const adminMenuItems = [
    {
      href: '/admin/pdf-templates',
      label: 'PDF申請書管理',
      icon: FileSliders,
      description: '申請書テンプレートの設定'
    },
    {
      href: '/admin/users',
      label: 'ユーザー管理',
      icon: Users,
      description: 'ユーザー権限設定'
    },
    {
      href: '/admin/system',
      label: 'システム設定',
      icon: Database,
      description: '基本設定・環境設定'
    }
  ];

  const isAdminPage = pathname.startsWith('/admin');

  return (
    <header className="border-b bg-white/95 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">
                AI補助金申請システム
              </h1>
            </Link>
            
            {isAdminPage && (
              <Badge variant="secondary" className="bg-orange-100 text-orange-700">
                <Shield className="h-3 w-3 mr-1" />
                管理者モード
              </Badge>
            )}
          </div>

          <div className="flex items-center space-x-4">
            {/* 管理者メニュー */}
            {isAdminPage && (
              <nav className="hidden md:flex items-center space-x-2">
                {adminMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link key={item.href} href={item.href}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        size="sm"
                        className={`flex items-center space-x-2 ${
                          isActive ? 'bg-blue-600 text-white' : ''
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="hidden lg:inline">{item.label}</span>
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            )}

            {/* ホームに戻る */}
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">ホーム</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 管理者ページの説明 */}
        {isAdminPage && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="font-semibold text-blue-900">管理者機能</h2>
            </div>
            <p className="text-sm text-blue-700">
              PDF申請書テンプレートの管理や、システム設定を行うことができます。
              設定は一度行うと全ての申請で使用されます。
            </p>
          </div>
        )}
      </div>
    </header>
  );
}

// 管理者ページ専用のレイアウト
export function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}