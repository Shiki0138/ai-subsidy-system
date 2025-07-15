'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import AutoApplicationForm from '@/components/business-improvement/AutoApplicationForm';
import QuickApplicationFlow from '@/components/subsidy/QuickApplicationFlow';
import SuccessPatternDisplay from '@/components/subsidy/SuccessPatternDisplay';
import { GuidelineBasedForm } from '@/components/subsidy/GuidelineBasedForm';
import { 
  Sparkles, 
  Zap, 
  FileText, 
  Lightbulb,
  TrendingUp,
  Award,
  Clock,
  Users
} from 'lucide-react';

export default function BusinessImprovementPage() {
  const [activeTab, setActiveTab] = useState('ai-auto');

  const features = [
    {
      icon: TrendingUp,
      title: '最大95%の採択率予測',
      description: 'AIが過去の採択データを分析し、最適化された申請書を生成'
    },
    {
      icon: Award,
      title: '最大600万円の助成',
      description: '賃金引上げと設備投資で最大75-80%の助成率'
    },
    {
      icon: Clock,
      title: '30分で申請書完成',
      description: '企業情報を入力するだけで、AIが全自動で申請書を作成'
    },
    {
      icon: Users,
      title: '全従業員の賃金向上',
      description: '生産性向上により継続的な賃金引上げを実現'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gray-900">
              業務改善助成金 申請システム
            </h1>
            <div className="text-sm text-gray-600">
              令和7年度 募集中
            </div>
          </div>
        </div>
      </header>

      <main className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* ヒーローセクション */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-4">
              <Sparkles className="h-4 w-4 mr-2" />
              AI powered 申請書作成システム
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              業務改善助成金で
              <span className="text-blue-600">生産性向上</span>と
              <span className="text-green-600">賃金引上げ</span>を実現
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AIが企業の課題を分析し、採択確率を最大化する申請書を自動生成。
              最短30分で業務改善助成金の申請書が完成します。
            </p>
          </div>

          {/* 特徴カード */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="text-center">
                <CardContent className="pt-6">
                  <feature.icon className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* メインコンテンツ */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 mb-8">
              <TabsTrigger value="ai-auto" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI自動作成
              </TabsTrigger>
              <TabsTrigger value="quick" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                クイック申請
              </TabsTrigger>
              <TabsTrigger value="guideline" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                募集要項ベース
              </TabsTrigger>
              <TabsTrigger value="patterns" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                成功パターン
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai-auto" className="mt-6">
              <div className="mb-6">
                <Alert className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
                  <Sparkles className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>🎯 最新AI技術で採択率95%を目指す！</strong><br />
                    企業情報を入力するだけで、AIが最適な申請戦略を分析し、採択確率を最大化する申請書を自動生成します。
                  </AlertDescription>
                </Alert>
              </div>
              <AutoApplicationForm />
            </TabsContent>

            <TabsContent value="quick" className="mt-6">
              <div className="mb-6">
                <Alert className="bg-yellow-50 border-yellow-200">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>⚡ 5ステップで素早く申請書作成</strong><br />
                    基本情報、設備選択、賃金計画、経費計算、申請書生成の5つのステップで効率的に申請書を作成できます。
                  </AlertDescription>
                </Alert>
              </div>
              <QuickApplicationFlow />
            </TabsContent>

            <TabsContent value="guideline" className="mt-6">
              <div className="mb-6">
                <Alert className="bg-green-50 border-green-200">
                  <FileText className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>📋 募集要項に完全準拠</strong><br />
                    最新の募集要項（DOCX/TXT）をアップロードすると、その要件に完全に準拠した申請書を自動生成します。
                  </AlertDescription>
                </Alert>
              </div>
              <GuidelineBasedForm subsidyType="business-improvement" />
            </TabsContent>

            <TabsContent value="patterns" className="mt-6">
              <div className="mb-6">
                <Alert className="bg-purple-50 border-purple-200">
                  <Lightbulb className="h-4 w-4 text-purple-600" />
                  <AlertDescription className="text-purple-800">
                    <strong>💡 採択成功パターンを学習</strong><br />
                    過去の採択事例を分析し、業界別の成功パターンと効果的なフレーズを活用して申請書の質を向上させます。
                  </AlertDescription>
                </Alert>
              </div>
              <SuccessPatternDisplay />
            </TabsContent>
          </Tabs>

          {/* 申請のポイント */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="text-center">業務改善助成金 申請のポイント</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-blue-600">1</span>
                  </div>
                  <h3 className="font-semibold mb-2">生産性向上の明確化</h3>
                  <p className="text-sm text-gray-600">
                    設備導入による具体的な効果（時間短縮、品質向上等）を数値で示すことが重要です。
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-green-600">2</span>
                  </div>
                  <h3 className="font-semibold mb-2">継続的な賃金引上げ</h3>
                  <p className="text-sm text-gray-600">
                    一時的でなく、生産性向上による収益改善で継続的な賃金向上を示す必要があります。
                  </p>
                </div>
                <div className="text-center">
                  <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-purple-600">3</span>
                  </div>
                  <h3 className="font-semibold mb-2">地域経済への貢献</h3>
                  <p className="text-sm text-gray-600">
                    人材確保・定着、技術力向上等により地域経済の活性化に貢献することをアピールします。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 注意事項 */}
          <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="font-semibold text-yellow-900 mb-3">📌 ご利用にあたって</h3>
            <ul className="space-y-2 text-sm text-yellow-800">
              <li>• 生成された内容は必ず確認・修正してください</li>
              <li>• 募集要項は最新のものをご使用ください</li>
              <li>• 企業情報は正確に入力してください</li>
              <li>• 申請前に要項との整合性を再確認してください</li>
              <li>• 設備投資は事業完了期限（令和7年1月31日）までに完了する必要があります</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}