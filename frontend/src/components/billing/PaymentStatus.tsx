'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ArrowPathIcon,
  DocumentArrowDownIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface PaymentStatusProps {
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';
  paymentIntent?: string;
  orderId?: string;
  downloadUrl?: string;
  error?: string;
  onRetry?: () => void;
  onClose?: () => void;
}

interface ProgressStep {
  id: string;
  name: string;
  status: 'completed' | 'current' | 'upcoming';
  icon: React.ComponentType<{ className?: string }>;
}

export default function PaymentStatus({
  status,
  paymentIntent,
  orderId,
  downloadUrl,
  error,
  onRetry,
  onClose
}: PaymentStatusProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState('');

  // ステップ定義
  const getSteps = (): ProgressStep[] => {
    const baseSteps = [
      { id: 'payment', name: '決済処理', icon: CheckCircleIcon },
      { id: 'generation', name: '申請書生成', icon: DocumentArrowDownIcon },
      { id: 'delivery', name: '完了', icon: CheckCircleIcon }
    ];

    let currentStepIndex = 0;
    if (status === 'processing') currentStepIndex = 1;
    if (status === 'succeeded') currentStepIndex = 3;

    return baseSteps.map((step, index) => ({
      ...step,
      status: index < currentStepIndex ? 'completed' : 
              index === currentStepIndex ? 'current' : 'upcoming'
    }));
  };

  // プログレスアニメーション
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (status === 'processing') {
      const messages = [
        '決済情報を確認しています...',
        'AI申請書生成を開始しています...',
        '品質チェックを実行中...',
        'PDF文書を作成中...',
        'メール送信を準備中...'
      ];
      
      let messageIndex = 0;
      let progressValue = 0;
      
      interval = setInterval(() => {
        progressValue += Math.random() * 15;
        if (progressValue > 95) progressValue = 95;
        
        setProgress(progressValue);
        setCurrentMessage(messages[Math.floor(messageIndex / 20) % messages.length]);
        messageIndex++;
      }, 200);
    } else if (status === 'succeeded') {
      setProgress(100);
      setCurrentMessage('処理が完了しました！');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status]);

  const getStatusDisplay = () => {
    switch (status) {
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          icon: ClockIcon,
          title: '決済待機中',
          description: '決済処理を開始しています...'
        };
      case 'processing':
        return {
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          icon: ArrowPathIcon,
          title: '処理中',
          description: currentMessage || '申請書を生成しています...'
        };
      case 'succeeded':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200',
          icon: CheckCircleIcon,
          title: '完了',
          description: 'お支払いと申請書生成が完了しました！'
        };
      case 'failed':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          icon: XCircleIcon,
          title: '決済失敗',
          description: error || '決済処理中にエラーが発生しました'
        };
      case 'cancelled':
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: XCircleIcon,
          title: 'キャンセル',
          description: '決済がキャンセルされました'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          icon: ClockIcon,
          title: '不明',
          description: '状態を確認中...'
        };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;
  const steps = getSteps();

  return (
    <div className="max-w-md mx-auto">
      {/* メインステータス表示 */}
      <div className={`
        rounded-2xl border-2 p-6 text-center transition-all duration-300
        ${statusDisplay.bgColor} ${statusDisplay.borderColor}
      `}>
        
        {/* アイコンとタイトル */}
        <div className="mb-4">
          <div className={`
            inline-flex items-center justify-center w-16 h-16 rounded-full mb-4
            ${status === 'processing' ? 'animate-pulse' : ''} 
            ${statusDisplay.bgColor}
          `}>
            <StatusIcon className={`h-8 w-8 ${statusDisplay.color}
              ${status === 'processing' ? 'animate-spin' : ''}
            `} />
          </div>
          
          <h2 className={`text-xl font-bold ${statusDisplay.color} mb-2`}>
            {statusDisplay.title}
          </h2>
          
          <p className="text-gray-600">
            {statusDisplay.description}
          </p>
        </div>

        {/* プログレスバー（処理中のみ） */}
        {status === 'processing' && (
          <div className="mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {Math.floor(progress)}% 完了
            </p>
          </div>
        )}

        {/* ステップ表示 */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center mb-2
                  ${step.status === 'completed' ? 'bg-green-500 text-white' :
                    step.status === 'current' ? 'bg-blue-500 text-white' :
                    'bg-gray-200 text-gray-400'}
                `}>
                  <step.icon className="h-4 w-4" />
                </div>
                <span className={`text-xs font-medium
                  ${step.status === 'completed' ? 'text-green-600' :
                    step.status === 'current' ? 'text-blue-600' :
                    'text-gray-400'}
                `}>
                  {step.name}
                </span>
                
                {/* 接続線 */}
                {index < steps.length - 1 && (
                  <div className={`
                    absolute w-8 h-0.5 mt-4 ml-8
                    ${step.status === 'completed' ? 'bg-green-500' :
                      step.status === 'current' ? 'bg-blue-200' :
                      'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="space-y-3">
          {status === 'succeeded' && downloadUrl && (
            <Button
              onClick={() => window.open(downloadUrl, '_blank')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              申請書をダウンロード
            </Button>
          )}
          
          {status === 'failed' && onRetry && (
            <Button
              onClick={onRetry}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <ArrowPathIcon className="h-4 w-4 mr-2" />
              再試行
            </Button>
          )}
          
          {(status === 'succeeded' || status === 'failed' || status === 'cancelled') && onClose && (
            <Button
              onClick={onClose}
              variant="secondary"
              className="w-full"
            >
              閉じる
            </Button>
          )}
        </div>

        {/* 詳細情報 */}
        {(paymentIntent || orderId) && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              {paymentIntent && (
                <span>決済ID: {paymentIntent.slice(0, 8)}...</span>
              )}
              {paymentIntent && orderId && <span className="mx-2">•</span>}
              {orderId && (
                <span>注文ID: {orderId}</span>
              )}
            </p>
          </div>
        )}
      </div>

      {/* 追加情報・サポート */}
      <div className="mt-6 text-center">
        {status === 'processing' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <ExclamationTriangleIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-left">
                <p className="text-sm text-yellow-800 font-medium">
                  処理中はページを閉じないでください
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  通常1-2分で完了します。問題が発生した場合は自動的に通知されます。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <p className="text-xs text-gray-500">
            問題が発生した場合は、
            <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
              サポートチーム
            </a>
            までお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}