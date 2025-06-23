'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  ClockIcon,
  FireIcon,
  SparklesIcon,
  CheckCircleIcon,
  XMarkIcon,
  ChartBarIcon,
  HeartIcon,
  UsersIcon
} from '@heroicons/react/24/outline';

interface UpsellOptimizationProps {
  userBehavior: {
    timeOnPage: number; // seconds
    scrollPercentage: number;
    hasViewedPricing: boolean;
    hasClickedUpgrade: boolean;
    exitIntentDetected: boolean;
  };
  applicationData: {
    qualityScore: number;
    estimatedSavings: number; // hours
    similarSuccessRate: number; // percentage
  };
  onUpgrade: () => void;
  onDismiss: () => void;
}

interface UpsellTrigger {
  type: 'time_based' | 'scroll_based' | 'exit_intent' | 'quality_highlight';
  message: string;
  urgency: 'low' | 'medium' | 'high';
  benefits: string[];
  ctaText: string;
  shouldShow: boolean;
}

export default function UpsellOptimization({
  userBehavior,
  applicationData,
  onUpgrade,
  onDismiss
}: UpsellOptimizationProps) {
  const [activeTrigger, setActiveTrigger] = useState<UpsellTrigger | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [showSocialProof, setShowSocialProof] = useState(false);

  // ユーザー行動に基づくトリガー判定
  useEffect(() => {
    if (isDismissed) return;

    const triggers: UpsellTrigger[] = [
      // 高品質スコア強調
      {
        type: 'quality_highlight',
        message: `${applicationData.qualityScore}点の高品質申請書が完成しています`,
        urgency: 'high',
        benefits: [
          '採択可能性が大幅に向上',
          `${applicationData.estimatedSavings}時間の作業を短縮`,
          `類似企業の${applicationData.similarSuccessRate}%が採択成功`
        ],
        ctaText: '今すぐ完全版を取得',
        shouldShow: applicationData.qualityScore >= 80 && !userBehavior.hasClickedUpgrade
      },

      // 時間ベーストリガー（30秒以上滞在）
      {
        type: 'time_based',
        message: 'このプレビューで品質を確認いただけましたか？',
        urgency: 'medium',
        benefits: [
          '完全版で詳細な事業計画を確認',
          '専門家による品質チェック済み',
          '24時間返金保証で安心'
        ],
        ctaText: '完全版を確認する',
        shouldShow: userBehavior.timeOnPage >= 30 && userBehavior.hasViewedPricing
      },

      // スクロールベーストリガー（70%以上スクロール）
      {
        type: 'scroll_based',
        message: '最後まで確認いただき、ありがとうございます',
        urgency: 'low',
        benefits: [
          '87%の高い採択実績',
          'ワンクリックで簡単取得',
          '今なら初回限定50%オフ'
        ],
        ctaText: '特別価格で取得する',
        shouldShow: userBehavior.scrollPercentage >= 70 && !userBehavior.hasClickedUpgrade
      },

      // 離脱意図検出
      {
        type: 'exit_intent',
        message: 'お待ちください！最後のご提案があります',
        urgency: 'high',
        benefits: [
          'この機会を逃すと通常価格になります',
          '今なら限定価格¥1,980（50%オフ）',
          '完全返金保証付きで安心'
        ],
        ctaText: '限定価格で今すぐ取得',
        shouldShow: userBehavior.exitIntentDetected
      }
    ];

    // 最も優先度の高いトリガーを選択
    const availableTriggers = triggers.filter(t => t.shouldShow);
    if (availableTriggers.length > 0) {
      const priorityOrder = ['exit_intent', 'quality_highlight', 'time_based', 'scroll_based'];
      const selectedTrigger = availableTriggers.find(t => 
        priorityOrder.includes(t.type)
      ) || availableTriggers[0];
      
      setActiveTrigger(selectedTrigger);
    }
  }, [userBehavior, applicationData, isDismissed]);

  // ソーシャルプルーフのランダム表示
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSocialProof(Math.random() > 0.5);
    }, 5000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    setActiveTrigger(null);
    onDismiss();
  };

  const getUrgencyStyles = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'high':
        return <FireIcon className="h-5 w-5 text-red-500" />;
      case 'medium':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <SparklesIcon className="h-5 w-5 text-blue-500" />;
    }
  };

  if (!activeTrigger || isDismissed) {
    return null;
  }

  return (
    <>
      {/* メインアップセルカード */}
      <div className={`
        fixed bottom-6 right-6 max-w-sm w-full
        border-2 rounded-2xl shadow-2xl p-6 z-50
        transform transition-all duration-500 ease-out
        ${getUrgencyStyles(activeTrigger.urgency)}
        animate-slide-up
      `}>
        {/* 閉じるボタン */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* ヘッダー */}
        <div className="flex items-center mb-4">
          {getUrgencyIcon(activeTrigger.urgency)}
          <h3 className="ml-2 font-semibold text-gray-900 text-sm">
            {activeTrigger.message}
          </h3>
        </div>

        {/* ベネフィット */}
        <div className="space-y-2 mb-4">
          {activeTrigger.benefits.map((benefit, index) => (
            <div key={index} className="flex items-start space-x-2">
              <CheckCircleIcon className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>

        {/* 価格表示（限定価格の場合） */}
        {activeTrigger.type === 'exit_intent' && (
          <div className="bg-white rounded-lg p-3 mb-4 border border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-green-600">¥1,980</p>
                <p className="text-xs line-through text-gray-500">¥3,980</p>
              </div>
              <Badge variant="error" size="sm">
                50%オフ
              </Badge>
            </div>
          </div>
        )}

        {/* CTA ボタン */}
        <Button
          onClick={onUpgrade}
          className={`
            w-full font-semibold py-3 text-sm
            ${activeTrigger.urgency === 'high' 
              ? 'bg-red-600 hover:bg-red-700' 
              : 'bg-blue-600 hover:bg-blue-700'
            }
            text-white transform hover:scale-105 transition-all duration-200
          `}
        >
          {activeTrigger.ctaText}
        </Button>

        {/* 保証表示 */}
        <p className="text-xs text-gray-500 text-center mt-2">
          24時間返金保証付き
        </p>
      </div>

      {/* ソーシャルプルーフ通知（たまに表示） */}
      {showSocialProof && (
        <div className="fixed bottom-6 left-6 max-w-xs bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-40 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <UsersIcon className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {Math.floor(Math.random() * 5) + 1}人が購入しました
              </p>
              <p className="text-xs text-gray-500">過去1時間以内</p>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSocialProof(false)}
            className="absolute top-1 right-1 text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* スタイル定義 */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}