'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  BarChart3, 
  CheckCircle, 
  Lightbulb, 
  ArrowRight,
  Download,
  Sparkles,
  Rocket,
  ArrowLeft
} from 'lucide-react';
import ContentGenerationSystem from './ContentGenerationSystem';
import VisualDocumentGenerator from './VisualDocumentGenerator';

// 申請プロセスのステップ
const APPLICATION_STEPS = [
  {
    id: 'content',
    title: '申請文書作成',
    description: '各項目の文章をAI生成',
    icon: FileText
  },
  {
    id: 'visuals',
    title: 'ビジュアル資料作成',
    description: '図表・資料を自動生成',
    icon: BarChart3
  },
  {
    id: 'review',
    title: '最終確認',
    description: '申請書類の完成確認',
    icon: CheckCircle
  }
];

export default function CompleteApplicationWorkflow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState({
    content: 0,
    visuals: 0,
    review: 0
  });

  // 現在のステップの進捗を更新
  const updateStepProgress = (step: string, progress: number) => {
    setStepProgress(prev => ({
      ...prev,
      [step]: progress
    }));
  };

  // 全体の進捗を計算
  const overallProgress = Math.round(
    (stepProgress.content + stepProgress.visuals + stepProgress.review) / 3
  );

  // ステップナビゲーション
  const renderStepNavigation = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-6 w-6" />
          業務改善助成金申請フロー
        </CardTitle>
        <CardDescription>
          AI支援により申請書類を段階的に作成します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 進捗バー */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>全体進捗</span>
              <span>{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* ステップ表示 */}
          <div className="flex items-center justify-between">
            {APPLICATION_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === index;
              const isCompleted = stepProgress[step.id as keyof typeof stepProgress] === 100;
              
              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center text-center space-y-2 cursor-pointer transition-all ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}
                  onClick={() => setCurrentStep(index)}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                      isActive
                        ? 'border-blue-600 bg-blue-50'
                        : isCompleted
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <Icon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{step.title}</div>
                    <div className="text-xs">{step.description}</div>
                    {stepProgress[step.id as keyof typeof stepProgress] > 0 && (
                      <Badge className="text-xs">
                        {stepProgress[step.id as keyof typeof stepProgress]}%
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // 最終確認ステップ
  const renderReviewStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6" />
            申請書類完成チェック
          </CardTitle>
          <CardDescription>
            作成した資料を最終確認してから申請手続きを行ってください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="mb-6">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              <strong>おめでとうございます！</strong> 
              申請に必要な文書とビジュアル資料の準備が完了しました。
            </AlertDescription>
          </Alert>

          <div className="grid md:grid-cols-2 gap-6">
            {/* 作成済み文書リスト */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                作成済み申請文書
              </h4>
              <div className="space-y-2">
                {[
                  '事業の概要',
                  '現在の課題',
                  '設備・機器等の導入計画',
                  '生産性向上の具体的な内容',
                  '賃金引上げ計画',
                  '事業実施スケジュール',
                  '事業の持続性',
                  '効果の測定方法'
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="text-sm">{item}</span>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                ))}
              </div>
            </div>

            {/* 作成済みビジュアル資料リスト */}
            <div className="space-y-4">
              <h4 className="font-semibold flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                作成済みビジュアル資料
              </h4>
              <div className="space-y-2">
                {[
                  'Before/After比較図',
                  'ROI推移グラフ',
                  '業務フロー改善図',
                  '組織への影響図'
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="text-sm">{item}</span>
                    <CheckCircle className="h-4 w-4 text-blue-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 次のステップ */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <h4 className="font-semibold mb-4">申請手続きの流れ</h4>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-medium text-blue-900">1. 申請書ダウンロード</div>
                <p className="text-blue-700">
                  厚生労働省の公式サイトから業務改善助成金の申請書をダウンロード
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-purple-900">2. 文書貼り付け</div>
                <p className="text-purple-700">
                  作成した文章を申請書の各項目にコピー&ペースト
                </p>
              </div>
              <div className="space-y-2">
                <div className="font-medium text-green-900">3. 資料添付・提出</div>
                <p className="text-green-700">
                  ビジュアル資料を添付して労働局へ提出
                </p>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="flex gap-4 mt-6">
            <Button
              className="flex-1"
              onClick={() => {
                updateStepProgress('review', 100);
                // 申請書ダウンロードページへリダイレクト
                window.open('https://www.mhlw.go.jp/file/06-Seisakujouhou-11200000-Roudoukijunkyoku/180510_kinyuurei_1.pdf', '_blank');
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              申請書をダウンロード
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentStep(0)}
            >
              最初から見直す
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">業務改善助成金申請支援</h1>
              <p className="text-gray-600 mt-1">AI支援による効率的な申請書類作成</p>
            </div>
            <Badge className="bg-blue-100 text-blue-700">
              最大600万円・補助率90%
            </Badge>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {renderStepNavigation()}

        {/* ステップコンテンツ */}
        <div className="space-y-6">
          {currentStep === 0 && (
            <div>
              <ContentGenerationSystem />
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => {
                    updateStepProgress('content', 100);
                    setCurrentStep(1);
                  }}
                  size="lg"
                >
                  文書作成完了・次へ進む
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div>
              <VisualDocumentGenerator />
              <div className="mt-6 flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentStep(0)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  文書作成に戻る
                </Button>
                <Button
                  onClick={() => {
                    updateStepProgress('visuals', 100);
                    setCurrentStep(2);
                  }}
                  size="lg"
                >
                  ビジュアル作成完了・最終確認へ
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && renderReviewStep()}
        </div>
      </div>

      {/* サイドヘルプ */}
      <div className="fixed bottom-6 right-6">
        <Card className="w-80 shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">💡 現在のステップ</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-sm text-gray-600">
              {currentStep === 0 && "申請文書の各項目をAIで作成中です。生成された文章は編集可能です。"}
              {currentStep === 1 && "審査員に印象を与えるビジュアル資料を作成中です。"}
              {currentStep === 2 && "申請書類の準備が完了しました。実際の申請手続きに進んでください。"}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}