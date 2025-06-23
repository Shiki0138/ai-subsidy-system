'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  XMarkIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    description: string;
    savings?: string;
  } | null;
  onConfirmPayment: (paymentData: PaymentData) => Promise<void>;
  isProcessing?: boolean;
}

interface PaymentData {
  planId: string;
  userEmail: string;
  agreesToTerms: boolean;
}

export default function CheckoutModal({
  isOpen,
  onClose,
  selectedPlan,
  onConfirmPayment,
  isProcessing = false
}: CheckoutModalProps) {
  const [email, setEmail] = useState('');
  const [agreesToTerms, setAgreesToTerms] = useState(false);
  const [step, setStep] = useState<'confirm' | 'payment' | 'processing'>('confirm');
  const [errors, setErrors] = useState<{ email?: string; terms?: string }>({});

  // モーダルが開かれた時にステップをリセット
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setErrors({});
    }
  }, [isOpen]);

  if (!isOpen || !selectedPlan) return null;

  const validateForm = (): boolean => {
    const newErrors: { email?: string; terms?: string } = {};

    // メールアドレス検証
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      newErrors.email = 'メールアドレスを入力してください';
    } else if (!emailRegex.test(email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    // 利用規約同意確認
    if (!agreesToTerms) {
      newErrors.terms = '利用規約とプライバシーポリシーに同意してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProceedToPayment = () => {
    if (validateForm()) {
      setStep('payment');
    }
  };

  const handleConfirmPayment = async () => {
    setStep('processing');
    try {
      await onConfirmPayment({
        planId: selectedPlan.id,
        userEmail: email,
        agreesToTerms
      });
    } catch (error) {
      setStep('payment');
      // エラーは親コンポーネントで処理
    }
  };

  const formatPrice = (price: number): string => {
    return price.toLocaleString();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* オーバーレイ */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={step === 'processing' ? undefined : onClose}
      />

      {/* モーダルコンテンツ */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
          
          {/* ヘッダー */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              {step === 'confirm' && '申請書作成の確認'}
              {step === 'payment' && '決済情報の入力'}
              {step === 'processing' && '決済処理中...'}
            </h2>
            {step !== 'processing' && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* コンテンツ */}
          <div className="p-6">
            
            {/* ステップ1: 確認画面 */}
            {step === 'confirm' && (
              <div className="space-y-6">
                {/* 選択プラン詳細 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-blue-900">
                        {selectedPlan.name}
                      </h3>
                      <p className="text-sm text-blue-700 mt-1">
                        {selectedPlan.description}
                      </p>
                    </div>
                    {selectedPlan.savings && (
                      <Badge variant="success" size="sm">
                        {selectedPlan.savings}
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      {selectedPlan.originalPrice && (
                        <span className="text-blue-600 line-through text-sm mr-2">
                          ¥{formatPrice(selectedPlan.originalPrice)}
                        </span>
                      )}
                      <span className="text-2xl font-bold text-blue-900">
                        ¥{formatPrice(selectedPlan.price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* メールアドレス入力 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    メールアドレス *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`
                      w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
                      ${errors.email ? 'border-red-500' : 'border-gray-300'}
                    `}
                    placeholder="your@example.com"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    申請書のダウンロードリンクをお送りします
                  </p>
                </div>

                {/* 利用規約同意 */}
                <div>
                  <label className="flex items-start space-x-3">
                    <input
                      type="checkbox"
                      checked={agreesToTerms}
                      onChange={(e) => setAgreesToTerms(e.target.checked)}
                      className={`
                        mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded
                        ${errors.terms ? 'border-red-500' : ''}
                      `}
                    />
                    <span className="text-sm text-gray-700">
                      <a href="/terms" className="text-blue-600 hover:underline" target="_blank">
                        利用規約
                      </a>
                      と
                      <a href="/privacy" className="text-blue-600 hover:underline" target="_blank">
                        プライバシーポリシー
                      </a>
                      に同意します *
                    </span>
                  </label>
                  {errors.terms && (
                    <p className="text-red-500 text-sm mt-1">{errors.terms}</p>
                  )}
                </div>

                {/* 保証情報 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <ShieldCheckIcon className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">24時間返金保証</h4>
                      <p className="text-sm text-green-700 mt-1">
                        ご満足いただけない場合は、24時間以内であれば無条件で全額返金いたします。
                      </p>
                    </div>
                  </div>
                </div>

                {/* 次へボタン */}
                <Button
                  onClick={handleProceedToPayment}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  決済に進む
                </Button>
              </div>
            )}

            {/* ステップ2: 決済画面 */}
            {step === 'payment' && (
              <div className="space-y-6">
                {/* 戻るボタン */}
                <button
                  onClick={() => setStep('confirm')}
                  className="flex items-center text-gray-600 hover:text-gray-900 text-sm"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-1" />
                  前の画面に戻る
                </button>

                {/* 決済情報 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">お支払い情報</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>プラン: {selectedPlan.name}</div>
                    <div>金額: ¥{formatPrice(selectedPlan.price)}</div>
                    <div>メール: {email}</div>
                  </div>
                </div>

                {/* Stripe決済フォーム（実装時はStripe Elementsを使用） */}
                <div className="border border-gray-300 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <CreditCardIcon className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">
                      クレジットカード情報
                    </span>
                  </div>
                  
                  {/* 実際の実装では Stripe Elements を使用 */}
                  <div className="text-sm text-gray-600 bg-yellow-50 border border-yellow-200 rounded p-3">
                    <div className="flex items-start space-x-2">
                      <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div>
                        <p className="text-yellow-800 font-medium">開発中</p>
                        <p className="text-yellow-700">
                          実際の決済フォームはStripe Elementsで実装されます。
                          セキュアな決済処理でクレジットカード情報は当社サーバーに保存されません。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* セキュリティ情報 */}
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <ShieldCheckIcon className="h-3 w-3" />
                    <span>SSL暗号化</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircleIcon className="h-3 w-3" />
                    <span>PCI DSS準拠</span>
                  </div>
                </div>

                {/* 決済実行ボタン */}
                <Button
                  onClick={handleConfirmPayment}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium"
                >
                  ¥{formatPrice(selectedPlan.price)}を支払う
                </Button>
              </div>
            )}

            {/* ステップ3: 処理中画面 */}
            {step === 'processing' && (
              <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <CreditCardIcon className="h-6 w-6 text-blue-600" />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    決済を処理しています
                  </h3>
                  <p className="text-gray-600">
                    しばらくお待ちください。このページを閉じないでください。
                  </p>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-800">
                    <p>✅ 決済情報を確認中...</p>
                    <p>🔄 申請書生成を準備中...</p>
                    <p>📧 メールを送信準備中...</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}