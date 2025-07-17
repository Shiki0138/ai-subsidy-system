'use client';

import React, { useState } from 'react';
import { GuidelineBasedForm } from '@/components/subsidy/GuidelineBasedForm';
import QuickApplicationFlow from '@/components/subsidy/QuickApplicationFlow';
import SuccessPatternDisplay from '@/components/subsidy/SuccessPatternDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, AlertCircle, Zap, Lightbulb, FileSearch } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function GyomuKaizenPage() {
  const [activeTab, setActiveTab] = useState('quick');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              業務改善助成金 申請システム
            </h1>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">AIを活用した効率的な申請書作成</h2>
            <p className="text-gray-600">
              成功パターン分析とAI審査機能で採択率を向上させます
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                クイック申請
              </TabsTrigger>
              <TabsTrigger value="guideline" className="flex items-center gap-2">
                <FileSearch className="h-4 w-4" />
                募集要項から作成
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                成功パターン
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quick" className="mt-6">
              <QuickApplicationFlow />
            </TabsContent>

            <TabsContent value="guideline" className="mt-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <h2 className="text-lg font-semibold text-blue-900 mb-3">
                  🎯 募集要項に基づいた申請書作成
                </h2>
                <p className="text-blue-800 mb-4">
                  このシステムは、募集要項を読み込んで、その要件に完全に準拠した申請書を自動生成します。
                </p>
                
                <div className="grid md:grid-cols-3 gap-4 mt-4">
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">📄 ステップ1</h3>
                    <p className="text-sm text-gray-600">
                      募集要項（DOCX/TXT）をアップロード
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">📝 ステップ2</h3>
                    <p className="text-sm text-gray-600">
                      申請書テンプレート（DOCX）をアップロード
                    </p>
                  </div>
                  <div className="bg-white rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">✨ ステップ3</h3>
                    <p className="text-sm text-gray-600">
                      AIが要項に基づいて内容を自動生成
                    </p>
                  </div>
                </div>
              </div>

              <GuidelineBasedForm subsidyType="gyomu-kaizen" />
              
              <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="font-semibold text-yellow-900 mb-3">📌 ご利用にあたって</h3>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• 生成された内容は必ず確認・修正してください</li>
                  <li>• 募集要項は最新のものをご使用ください</li>
                  <li>• 企業情報は正確に入力してください</li>
                  <li>• 申請前に要項との整合性を再確認してください</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="mt-6">
              <SuccessPatternDisplay />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}