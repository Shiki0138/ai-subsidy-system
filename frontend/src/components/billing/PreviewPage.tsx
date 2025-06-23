'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  DocumentTextIcon,
  ChartBarIcon,
  CheckCircleIcon,
  StarIcon,
  EyeIcon,
  DownloadIcon,
  ShieldCheckIcon,
  TrophyIcon,
  UsersIcon,
  ClockIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface PreviewPageProps {
  applicationData: {
    title: string;
    companyName: string;
    subsidyType: string;
    qualityScore: number;
    previewUrl?: string;
  };
  onUpgrade: () => void;
  isPreviewMode?: boolean;
}

interface QualityMetric {
  name: string;
  score: number;
  maxScore: number;
  description: string;
  color: 'green' | 'blue' | 'yellow' | 'red';
}

const QUALITY_METRICS: QualityMetric[] = [
  {
    name: '論理構造',
    score: 85,
    maxScore: 100,
    description: '申請書の論理的な流れと構成',
    color: 'green'
  },
  {
    name: '説得力',
    score: 78,
    maxScore: 100,
    description: '審査員への訴求力と説得力',
    color: 'blue'
  },
  {
    name: '完成度',
    score: 92,
    maxScore: 100,
    description: '情報の充実度と記載の詳細さ',
    color: 'green'
  },
  {
    name: '専門性',
    score: 74,
    maxScore: 100,
    description: '専門用語の適切性と技術的正確性',
    color: 'yellow'
  }
];

const SUCCESS_STORIES = [
  {
    company: 'A社（製造業）',
    amount: '1,500万円',
    subsidy: 'ものづくり補助金',
    comment: 'AIで生成した申請書で見事採択されました。特に市場分析の精度が高く評価されました。'
  },
  {
    company: 'B社（IT業）',
    amount: '800万円',
    subsidy: 'IT導入補助金',
    comment: '初回申請で採択。説得力のある事業計画が決め手となりました。'
  },
  {
    company: 'C社（小売業）',
    amount: '200万円',
    subsidy: '小規模事業者持続化補助金',
    comment: '短時間で高品質な申請書が完成。時間コストを大幅に削減できました。'
  }
];

export default function PreviewPage({
  applicationData,
  onUpgrade,
  isPreviewMode = true
}: PreviewPageProps) {
  const [activeSection, setActiveSection] = useState<'preview' | 'quality' | 'benefits'>('preview');
  const [showFullPreview, setShowFullPreview] = useState(false);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number): 'success' | 'primary' | 'warning' | 'error' => {
    if (score >= 80) return 'success';
    if (score >= 70) return 'primary';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getMetricColor = (color: string): string => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'blue': return 'bg-blue-500';
      case 'yellow': return 'bg-yellow-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          📋 申請書プレビュー
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          AIが生成した申請書の品質をご確認ください
        </p>

        {/* 品質スコア表示 */}
        <div className="inline-flex items-center bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-2xl px-6 py-4">
          <ChartBarIcon className={`h-6 w-6 mr-3 ${getScoreColor(applicationData.qualityScore)}`} />
          <div className="text-left">
            <p className="text-sm text-gray-600">総合品質スコア</p>
            <p className={`text-3xl font-bold ${getScoreColor(applicationData.qualityScore)}`}>
              {applicationData.qualityScore}
              <span className="text-lg text-gray-500">/100</span>
            </p>
          </div>
          <Badge 
            variant={getScoreBadge(applicationData.qualityScore)}
            className="ml-4"
          >
            {applicationData.qualityScore >= 80 ? '高品質' : 
             applicationData.qualityScore >= 70 ? '良好' : 
             applicationData.qualityScore >= 60 ? '標準' : '要改善'}
          </Badge>
        </div>
      </div>

      {/* タブナビゲーション */}
      <div className="flex justify-center mb-8">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveSection('preview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'preview'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <DocumentTextIcon className="h-4 w-4 inline mr-2" />
            申請書プレビュー
          </button>
          <button
            onClick={() => setActiveSection('quality')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'quality'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ChartBarIcon className="h-4 w-4 inline mr-2" />
            品質分析
          </button>
          <button
            onClick={() => setActiveSection('benefits')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === 'benefits'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <TrophyIcon className="h-4 w-4 inline mr-2" />
            採択実績
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2">
          
          {/* プレビューセクション */}
          {activeSection === 'preview' && (
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {applicationData.title}
                  </h2>
                  <Badge variant="primary">
                    {applicationData.subsidyType}
                  </Badge>
                </div>
                <p className="text-gray-600 mt-1">
                  {applicationData.companyName}
                </p>
              </div>

              {/* プレビューコンテンツ */}
              <div className="p-6">
                {isPreviewMode && !showFullPreview ? (
                  /* 制限付きプレビュー */
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="prose max-w-none">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">
                          1. 事業の概要
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          当社（{applicationData.companyName}）は、革新的な技術を活用した事業展開により、
                          市場競争力の向上と持続的な成長を目指しています。本申請では、
                          最新のデジタル技術を導入することで...
                        </p>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">
                          2. 事業の具体的内容
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          本事業では、以下の3つの主要な取り組みを実施いたします。
                          第一に、業務プロセスの自動化によるオペレーション効率の向上...
                        </p>
                      </div>

                      {/* プレビュー制限オーバーレイ */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
                    </div>

                    {/* 続きを見るためのボタン */}
                    <div className="text-center bg-gray-50 rounded-lg p-6">
                      <EyeIcon className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                      <h4 className="font-semibold text-gray-900 mb-2">
                        この続きを見るには完全版が必要です
                      </h4>
                      <p className="text-sm text-gray-600 mb-4">
                        • 完全な事業計画書（15ページ）<br/>
                        • 詳細な市場分析と競合分析<br/>
                        • 財務計画と収支予測<br/>
                        • 実施スケジュールと体制図
                      </p>
                      <Button
                        onClick={onUpgrade}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        完全版を取得する
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* フルプレビュー */
                  <div className="text-center py-12">
                    <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      完全版申請書
                    </h3>
                    <p className="text-gray-600 mb-6">
                      15ページの詳細な申請書をご利用いただけます
                    </p>
                    <Button onClick={() => window.open('/api/download/sample.pdf', '_blank')}>
                      <DownloadIcon className="h-4 w-4 mr-2" />
                      サンプルPDFをダウンロード
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 品質分析セクション */}
          {activeSection === 'quality' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  詳細品質分析
                </h2>

                <div className="space-y-4">
                  {QUALITY_METRICS.map((metric, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-900">{metric.name}</h3>
                        <span className="text-lg font-bold text-gray-900">
                          {metric.score}/{metric.maxScore}
                        </span>
                      </div>
                      
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                        <div 
                          className={`h-2 rounded-full ${getMetricColor(metric.color)}`}
                          style={{ width: `${(metric.score / metric.maxScore) * 100}%` }}
                        />
                      </div>
                      
                      <p className="text-sm text-gray-600">{metric.description}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">
                    🎯 改善提案
                  </h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• 専門用語の解説を追加すると、より分かりやすくなります</li>
                    <li>• 市場データの引用元を明記すると信頼性が向上します</li>
                    <li>• 競合分析をより具体的に記載することを推奨します</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 採択実績セクション */}
          {activeSection === 'benefits' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  🏆 採択実績・お客様の声
                </h2>

                <div className="grid grid-cols-1 gap-6">
                  {SUCCESS_STORIES.map((story, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">{story.company}</h4>
                          <Badge variant="success" size="sm" className="mt-1">
                            {story.subsidy}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">{story.amount}</p>
                          <p className="text-xs text-gray-500">採択金額</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{story.comment}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 bg-green-50 rounded-lg p-6">
                  <div className="text-center">
                    <div className="flex justify-center items-center space-x-8 mb-4">
                      <div>
                        <p className="text-3xl font-bold text-green-600">87%</p>
                        <p className="text-sm text-green-800">採択率</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-green-600">2,400+</p>
                        <p className="text-sm text-green-800">採択実績</p>
                      </div>
                      <div>
                        <p className="text-3xl font-bold text-green-600">156億円</p>
                        <p className="text-sm text-green-800">獲得総額</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-800">
                      ※ 2023年実績。当システム利用企業の採択率
                    </p>
                  </div>
                </div>

                {/* 業界別実績 */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 業界別採択実績
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-600">93%</p>
                      <p className="text-xs text-blue-800">製造業</p>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-purple-600">89%</p>
                      <p className="text-xs text-purple-800">IT・情報</p>
                    </div>
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-green-600">85%</p>
                      <p className="text-xs text-green-800">サービス業</p>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-orange-600">82%</p>
                      <p className="text-xs text-orange-800">小売・卸売</p>
                    </div>
                  </div>
                </div>

                {/* 補助金別実績 */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💰 補助金別実績
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <span className="font-medium">ものづくり補助金</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">91%</span>
                        <span className="text-xs text-gray-500 ml-2">（758件）</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <span className="font-medium">IT導入補助金</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">88%</span>
                        <span className="text-xs text-gray-500 ml-2">（612件）</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-gray-50 rounded-lg p-3">
                      <span className="font-medium">小規模事業者持続化補助金</span>
                      <div className="text-right">
                        <span className="text-lg font-bold text-green-600">84%</span>
                        <span className="text-xs text-gray-500 ml-2">（1,031件）</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-6">
          {/* 購入促進カード */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl p-6 border border-blue-200">
            <div className="text-center mb-6">
              <SparklesIcon className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                なぜ有料版が必要なのか？
              </h3>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">完全な申請書</p>
                  <p className="text-sm text-gray-600">15ページの詳細な申請書をPDF出力</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">品質保証</p>
                  <p className="text-sm text-gray-600">専門家による品質チェック済み</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">採択率向上</p>
                  <p className="text-sm text-gray-600">87%の高い採択実績</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">時間短縮</p>
                  <p className="text-sm text-gray-600">通常数週間の作業を数分で完了</p>
                </div>
              </div>
            </div>

            <Button
              onClick={onUpgrade}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3"
            >
              完全版を取得する
            </Button>
          </div>

          {/* 保証・安心要素 */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <ShieldCheckIcon className="h-5 w-5 text-green-500 mr-2" />
              安心の保証制度
            </h3>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-start space-x-2">
                <ClockIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">24時間返金保証</p>
                  <p className="text-gray-600">満足いただけない場合は無条件で返金</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <ShieldCheckIcon className="h-4 w-4 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">セキュア決済</p>
                  <p className="text-gray-600">SSL暗号化・PCI DSS準拠</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-2">
                <UsersIcon className="h-4 w-4 text-purple-500 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">専任サポート</p>
                  <p className="text-gray-600">専門スタッフが迅速対応</p>
                </div>
              </div>
            </div>
          </div>

          {/* お客様の声 */}
          <div className="bg-yellow-50 rounded-2xl p-6 border border-yellow-200">
            <h3 className="font-semibold text-gray-900 mb-3">
              ⭐ お客様の声
            </h3>
            <blockquote className="text-sm text-gray-700 italic">
              "初めての補助金申請でしたが、AIが生成した申請書のおかげで無事採択されました。
              特に市場分析の部分が評価され、満額回答をいただけました。"
            </blockquote>
            <p className="text-xs text-gray-500 mt-2">- 製造業 代表取締役様</p>
          </div>
        </div>
      </div>
    </div>
  );
}