'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import {
  CheckCircleIcon,
  DocumentArrowDownIcon,
  StarIcon,
  SparklesIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

interface SuccessAnimationProps {
  orderDetails: {
    orderId: string;
    planName: string;
    amount: number;
    downloadUrl: string;
    userEmail: string;
  };
  onDownload: (url: string) => void;
  onClose: () => void;
  showFeedbackPrompt?: boolean;
}

export default function SuccessAnimation({
  orderDetails,
  onDownload,
  onClose,
  showFeedbackPrompt = true
}: SuccessAnimationProps) {
  const [animationPhase, setAnimationPhase] = useState<'initial' | 'success' | 'celebrate' | 'content'>('initial');
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    // アニメーション シーケンス
    const sequence = [
      { phase: 'success', delay: 500 },
      { phase: 'celebrate', delay: 1500 },
      { phase: 'content', delay: 3000 }
    ];

    sequence.forEach(({ phase, delay }) => {
      setTimeout(() => {
        setAnimationPhase(phase as any);
        if (phase === 'celebrate') {
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 2000);
        }
      }, delay);
    });
  }, []);

  const formatPrice = (price: number): string => {
    return price.toLocaleString();
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* 成功アニメーション */}
      <div className="text-center relative">
        
        {/* 紙吹雪エフェクト */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`absolute animate-bounce text-2xl`}
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${2 + Math.random() * 2}s`
                }}
              >
                {['🎉', '✨', '🎊', '⭐', '💫'][Math.floor(Math.random() * 5)]}
              </div>
            ))}
          </div>
        )}

        {/* メイン成功アイコン */}
        <div className={`
          transition-all duration-1000 transform
          ${animationPhase === 'initial' ? 'scale-0 opacity-0' : 'scale-100 opacity-100'}
          ${animationPhase === 'celebrate' ? 'animate-pulse' : ''}
        `}>
          <div className="relative inline-block">
            <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="h-12 w-12 text-white" />
            </div>
            
            {/* キラキラエフェクト */}
            {animationPhase === 'celebrate' && (
              <div className="absolute inset-0">
                <SparklesIcon className="absolute -top-2 -right-2 h-6 w-6 text-yellow-400 animate-ping" />
                <StarIcon className="absolute -bottom-2 -left-2 h-5 w-5 text-blue-400 animate-pulse" />
                <HeartIcon className="absolute top-0 left-0 h-4 w-4 text-red-400 animate-bounce" />
              </div>
            )}
          </div>
        </div>

        {/* 成功メッセージ */}
        <div className={`
          transition-all duration-1000 delay-500 transform
          ${animationPhase === 'initial' ? 'translate-y-8 opacity-0' : 'translate-y-0 opacity-100'}
        `}>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎉 申請書の作成が完了しました！
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            お疲れさまでした。高品質な申請書をお届けします。
          </p>
        </div>

        {/* 注文詳細 */}
        <div className={`
          transition-all duration-1000 delay-1000 transform
          ${animationPhase === 'content' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        `}>
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              ご注文完了
            </h2>
            
            <div className="space-y-3 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">注文番号</span>
                <span className="font-mono text-sm bg-white px-2 py-1 rounded">
                  {orderDetails.orderId}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">プラン</span>
                <span className="font-medium">{orderDetails.planName}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">お支払い金額</span>
                <span className="font-bold text-lg text-green-600">
                  ¥{formatPrice(orderDetails.amount)}
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">メール送信先</span>
                <span className="text-sm">{orderDetails.userEmail}</span>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className={`
          space-y-4 transition-all duration-1000 delay-1500 transform
          ${animationPhase === 'content' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        `}>
          
          {/* メインダウンロードボタン */}
          <Button
            onClick={() => onDownload(orderDetails.downloadUrl)}
            className="w-full py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white text-lg font-semibold shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <DocumentArrowDownIcon className="h-6 w-6 mr-3" />
            申請書をダウンロード
          </Button>

          {/* メール確認メッセージ */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              📧 ダウンロードリンクを <strong>{orderDetails.userEmail}</strong> にもお送りしました。
              メールが届かない場合は迷惑メールフォルダもご確認ください。
            </p>
          </div>

          {/* フィードバック促進 */}
          {showFeedbackPrompt && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="text-center">
                <h3 className="font-medium text-yellow-900 mb-2">
                  ⭐ サービスはいかがでしたか？
                </h3>
                <p className="text-sm text-yellow-800 mb-3">
                  皆様のご意見がサービス向上に役立ちます
                </p>
                <div className="flex justify-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className="text-yellow-400 hover:text-yellow-500 transition-colors"
                      onClick={() => {
                        // TODO: フィードバック送信処理
                        console.log(`Rating: ${star} stars`);
                      }}
                    >
                      <StarIcon className="h-6 w-6" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 次のステップ案内 */}
        <div className={`
          mt-8 transition-all duration-1000 delay-2000 transform
          ${animationPhase === 'content' ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}
        `}>
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              📋 次のステップ
            </h3>
            <ul className="text-sm text-gray-600 space-y-2 text-left">
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>ダウンロードした申請書の内容をご確認ください</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>必要に応じて追加情報を記入してください</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>補助金事務局に提出してください</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-500 mt-0.5">💡</span>
                <span>採択の可能性を高めるアドバイスも同封されています</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 閉じるボタン */}
        <div className="mt-6">
          <Button
            onClick={onClose}
            variant="secondary"
            className="w-full"
          >
            完了
          </Button>
        </div>

        {/* 感謝メッセージ */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            ✨ AI補助金申請システムをご利用いただき、ありがとうございました ✨
          </p>
          <p className="text-xs text-gray-400 mt-1">
            申請の成功を心よりお祈りしております
          </p>
        </div>
      </div>
    </div>
  );
}