'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  FileText, 
  Upload, 
  Database, 
  Settings, 
  Sparkles,
  FileSliders,
  FolderOpen,
  Brain
} from 'lucide-react';

export default function AdminPage() {
  const adminFunctions = [
    {
      title: '補助金データ管理',
      description: '募集要項、申請書、採択事例のアップロード・管理',
      icon: Database,
      href: '/admin/subsidy-data',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'PDFテンプレート管理',
      description: '申請書PDFテンプレートの登録・フィールド設定',
      icon: FileSliders,
      href: '/admin/pdf-templates',
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'AI分析設定',
      description: '採択パターン分析・プロンプト設定',
      icon: Brain,
      href: '/admin/ai-settings',
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'ドキュメント管理',
      description: 'アップロード済みドキュメントの確認・編集',
      icon: FolderOpen,
      href: '/admin/documents',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-gray-600" />
              <h1 className="text-2xl font-bold text-gray-900">管理画面</h1>
            </div>
            <Link href="/">
              <Button variant="outline">
                <Sparkles className="h-4 w-4 mr-2" />
                ホームに戻る
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminFunctions.map((func) => {
            const Icon = func.icon;
            return (
              <Link key={func.href} href={func.href}>
                <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-lg ${func.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{func.title}</h3>
                      <p className="text-gray-600">{func.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* クイックアクション */}
        <Card className="mt-8 p-6">
          <h2 className="text-xl font-bold mb-4">クイックアクション</h2>
          <div className="space-y-3">
            <Button className="w-full justify-start" variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              新しい募集要項をアップロード
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              採択事例を追加
            </Button>
            <Button className="w-full justify-start" variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              AI分析を実行
            </Button>
          </div>
        </Card>
      </main>
    </div>
  );
}