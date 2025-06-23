'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CheckIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon
} from '@heroicons/react/24/outline';

interface PricingOption {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  unit: string;
  isPopular?: boolean;
  isFirstTime?: boolean;
  savings?: string;
  description: string;
  features: string[];
  limitations?: string[];
  buttonText: string;
  badge?: {
    text: string;
    color: 'blue' | 'green' | 'yellow' | 'red';
  };
}

interface PricingCardProps {
  options: PricingOption[];
  onSelectPlan: (option: PricingOption) => void;
  isLoading?: boolean;
  userType?: 'new' | 'returning';
}

const PRICING_OPTIONS: PricingOption[] = [
  {
    id: 'first_time',
    name: '初回限定プラン',
    price: 1980,
    originalPrice: 3980,
    unit: '回',
    isFirstTime: true,
    savings: '50%オフ',
    description: 'はじめての方向けのお試し価格。品質をまずご確認ください。',
    features: [
      'AI申請書生成（1回）',
      '品質スコア分析',
      'PDF出力',
      '24時間キャンセル保証',
      'メールサポート'
    ],
    buttonText: 'お試しで始める',
    badge: {
      text: '初回限定',
      color: 'green'
    }
  },
  {
    id: 'regular',
    name: '通常プラン',
    price: 3980,
    unit: '回',
    description: '高品質な申請書を1回作成。満足いただけない場合は返金いたします。',
    features: [
      'AI申請書生成（1回）',
      '品質スコア分析',
      'PDF出力',
      '外部データ連携',
      '24時間キャンセル保証',
      'メールサポート',
      '履歴データ保存'
    ],
    buttonText: '今すぐ作成する'
  },
  {
    id: 'bulk_3',
    name: '3回パック',
    price: 9800,
    originalPrice: 11940,
    unit: '3回分',
    isPopular: true,
    savings: '2,140円お得',
    description: '複数の申請書作成予定の方におすすめ。1回あたり3,267円。',
    features: [
      'AI申請書生成（3回）',
      '品質スコア分析',
      'PDF出力',
      '外部データ連携',
      '24時間キャンセル保証',
      '優先メールサポート',
      '履歴データ保存',
      '6ヶ月間有効'
    ],
    buttonText: 'まとめて購入',
    badge: {
      text: '人気',
      color: 'blue'
    }
  }
];

export default function PricingCard({ 
  options = PRICING_OPTIONS, 
  onSelectPlan, 
  isLoading = false,
  userType = 'new'
}: PricingCardProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // 新規ユーザーには初回限定プランを表示、リピーターには通常プラン
  const displayOptions = userType === 'new' 
    ? options 
    : options.filter(opt => !opt.isFirstTime);

  const handleSelectPlan = (option: PricingOption) => {
    setSelectedOption(option.id);
    onSelectPlan(option);
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString();
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          透明で分かりやすい料金プラン
        </h2>
        <p className="text-lg text-gray-600 mb-6">
          隠れた費用は一切ありません。24時間以内なら無条件でキャンセル可能です。
        </p>
        
        {/* 信頼要素 */}
        <div className="flex justify-center items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <ShieldCheckIcon className="h-4 w-4" />
            <span>SSL暗号化</span>
          </div>
          <div className="flex items-center space-x-1">
            <ClockIcon className="h-4 w-4" />
            <span>24時間返金保証</span>
          </div>
          <div className="flex items-center space-x-1">
            <StarIcon className="h-4 w-4" />
            <span>採択実績多数</span>
          </div>
        </div>
      </div>

      {/* 価格カード */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {displayOptions.map((option) => (
          <div
            key={option.id}
            className={`
              relative rounded-2xl border-2 p-6 transition-all duration-200
              ${option.isPopular 
                ? 'border-blue-500 shadow-lg scale-105 bg-gradient-to-b from-blue-50 to-white' 
                : 'border-gray-200 hover:border-gray-300 bg-white'
              }
              ${selectedOption === option.id ? 'ring-2 ring-blue-500' : ''}
            `}
          >
            {/* バッジ */}
            {option.badge && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge 
                  variant={option.badge.color === 'blue' ? 'primary' : 'success'}
                  className="px-3 py-1 text-sm font-medium"
                >
                  {option.badge.text}
                </Badge>
              </div>
            )}

            {/* プラン名 */}
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {option.name}
              </h3>
              <p className="text-sm text-gray-600">
                {option.description}
              </p>
            </div>

            {/* 価格表示 */}
            <div className="text-center mb-6">
              <div className="flex items-end justify-center mb-2">
                <span className="text-4xl font-bold text-gray-900">
                  ¥{formatPrice(option.price)}
                </span>
                <span className="text-gray-600 ml-1">
                  /{option.unit}
                </span>
              </div>

              {/* 割引表示 */}
              {option.originalPrice && (
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-lg text-gray-500 line-through">
                    ¥{formatPrice(option.originalPrice)}
                  </span>
                  {option.savings && (
                    <Badge variant="success" size="sm">
                      {option.savings}
                    </Badge>
                  )}
                </div>
              )}

              {/* パック詳細 */}
              {option.id === 'bulk_3' && (
                <p className="text-sm text-green-600 mt-2">
                  1回あたり ¥{formatPrice(Math.floor(option.price / 3))}
                </p>
              )}
            </div>

            {/* 機能一覧 */}
            <div className="mb-6">
              <ul className="space-y-3">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* 制限事項 */}
              {option.limitations && option.limitations.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-2">制限事項:</p>
                  <ul className="space-y-1">
                    {option.limitations.map((limitation, index) => (
                      <li key={index} className="text-xs text-gray-500">
                        • {limitation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* 選択ボタン */}
            <Button
              onClick={() => handleSelectPlan(option)}
              disabled={isLoading}
              variant={option.isPopular ? 'primary' : 'secondary'}
              className={`
                w-full py-3 font-medium transition-all duration-200
                ${option.isPopular 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'border-2 border-gray-300 hover:border-blue-500 text-gray-700'
                }
                ${selectedOption === option.id ? 'ring-2 ring-blue-500' : ''}
              `}
            >
              {isLoading && selectedOption === option.id ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>処理中...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  {option.isFirstTime && <SparklesIcon className="h-4 w-4" />}
                  <span>{option.buttonText}</span>
                </div>
              )}
            </Button>
          </div>
        ))}
      </div>

      {/* フッター情報 */}
      <div className="mt-8 text-center">
        <div className="bg-gray-50 rounded-lg p-6">
          <h4 className="font-semibold text-gray-900 mb-2">
            🛡️ 安心してお試しいただけます
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <strong>24時間返金保証</strong><br/>
              満足いただけない場合は無条件で返金
            </div>
            <div>
              <strong>透明な価格設定</strong><br/>
              表示価格以外の費用は一切発生しません
            </div>
            <div>
              <strong>セキュアな決済</strong><br/>
              クレジットカード情報は保存されません
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}