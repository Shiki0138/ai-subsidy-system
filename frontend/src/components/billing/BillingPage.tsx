'use client';

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import PricingCard from './PricingCard';
import CheckoutModal from './CheckoutModal';
import PaymentStatus from './PaymentStatus';
import SuccessAnimation from './SuccessAnimation';

interface BillingPageProps {
  applicationId?: string;
  previewUrl?: string;
  qualityScore?: number;
  onPaymentSuccess?: (paymentData: any) => void;
}

interface PaymentData {
  planId: string;
  userEmail: string;
  agreesToTerms: boolean;
}

interface OrderDetails {
  orderId: string;
  planName: string;
  amount: number;
  downloadUrl: string;
  userEmail: string;
}

type BillingState = 'pricing' | 'checkout' | 'processing' | 'success' | 'error';
type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled';

export default function BillingPage({
  applicationId,
  previewUrl,
  qualityScore,
  onPaymentSuccess
}: BillingPageProps) {
  const [billingState, setBillingState] = useState<BillingState>('pricing');
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [userType, setUserType] = useState<'new' | 'returning'>('new');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ユーザータイプの判定（ローカルストレージから過去の購入履歴を確認）
  useEffect(() => {
    const purchaseHistory = localStorage.getItem('purchase_history');
    if (purchaseHistory) {
      setUserType('returning');
    }
  }, []);

  const handlePlanSelection = (plan: any) => {
    setSelectedPlan(plan);
    setBillingState('checkout');
  };

  const handlePayment = async (paymentData: PaymentData): Promise<void> => {
    setIsProcessing(true);
    setPaymentStatus('processing');
    setBillingState('processing');

    try {
      // 実際の実装では Stripe Checkout Session を作成
      const checkoutData = {
        planId: paymentData.planId,
        userEmail: paymentData.userEmail,
        applicationId: applicationId,
        successUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`,
        metadata: {
          applicationId: applicationId || '',
          qualityScore: qualityScore?.toString() || ''
        }
      };

      // モック実装（実際は Stripe API を呼び出し）
      await simulatePaymentProcess(checkoutData);

    } catch (err: any) {
      setError(err.message);
      setPaymentStatus('failed');
      setBillingState('error');
      toast.error('決済処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // 決済プロセスのシミュレーション（開発用）
  const simulatePaymentProcess = async (checkoutData: any): Promise<void> => {
    // ステップ 1: 決済処理シミュレーション
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // ランダムで失敗をシミュレート（10%の確率）
    if (Math.random() < 0.1) {
      throw new Error('決済が失敗しました。カード情報をご確認ください。');
    }

    setPaymentStatus('processing');

    // ステップ 2: 申請書生成シミュレーション
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 成功時の処理
    const mockOrderDetails: OrderDetails = {
      orderId: `ORD-${Date.now()}`,
      planName: selectedPlan?.name || 'プラン',
      amount: selectedPlan?.price || 0,
      downloadUrl: '/api/download/application.pdf',
      userEmail: checkoutData.userEmail
    };

    setOrderDetails(mockOrderDetails);
    setPaymentStatus('succeeded');
    setBillingState('success');

    // 購入履歴を保存
    const purchaseHistory = JSON.parse(localStorage.getItem('purchase_history') || '[]');
    purchaseHistory.push({
      orderId: mockOrderDetails.orderId,
      planId: checkoutData.planId,
      amount: mockOrderDetails.amount,
      date: new Date().toISOString()
    });
    localStorage.setItem('purchase_history', JSON.stringify(purchaseHistory));

    // 成功コールバック
    if (onPaymentSuccess) {
      onPaymentSuccess(mockOrderDetails);
    }

    toast.success('申請書の作成が完了しました！');
  };

  const handleRetryPayment = () => {
    setError(null);
    setBillingState('checkout');
    setPaymentStatus('pending');
  };

  const handleDownload = (url: string) => {
    // 実際の実装では安全なダウンロードURLを生成
    window.open(url, '_blank');
    toast.success('ダウンロードを開始しました');
  };

  const handleCloseModal = () => {
    setBillingState('pricing');
    setSelectedPlan(null);
    setError(null);
  };

  const handleSuccessClose = () => {
    setBillingState('pricing');
    setSelectedPlan(null);
    setOrderDetails(null);
    // 必要に応じて別のページにリダイレクト
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            高品質な申請書を今すぐ作成
          </h1>
          
          {/* 品質スコア表示 */}
          {qualityScore && (
            <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium mb-4">
              📊 現在の品質スコア: {qualityScore}点
              {qualityScore >= 80 && <span className="ml-2">⭐ 高品質</span>}
            </div>
          )}

          {/* プレビューリンク */}
          {previewUrl && (
            <div className="mb-6">
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                📄 申請書プレビューを確認する
              </a>
            </div>
          )}
        </div>

        {/* メインコンテンツ */}
        {billingState === 'pricing' && (
          <PricingCard
            onSelectPlan={handlePlanSelection}
            userType={userType}
            isLoading={isProcessing}
          />
        )}

        {billingState === 'processing' && (
          <div className="flex justify-center">
            <PaymentStatus
              status={paymentStatus}
              paymentIntent="pi_test_123"
              orderId={orderDetails?.orderId}
              downloadUrl={orderDetails?.downloadUrl}
              error={error}
              onRetry={handleRetryPayment}
              onClose={handleCloseModal}
            />
          </div>
        )}

        {billingState === 'success' && orderDetails && (
          <div className="flex justify-center">
            <SuccessAnimation
              orderDetails={orderDetails}
              onDownload={handleDownload}
              onClose={handleSuccessClose}
              showFeedbackPrompt={true}
            />
          </div>
        )}

        {/* チェックアウトモーダル */}
        <CheckoutModal
          isOpen={billingState === 'checkout'}
          onClose={handleCloseModal}
          selectedPlan={selectedPlan}
          onConfirmPayment={handlePayment}
          isProcessing={isProcessing}
        />

        {/* エラーステート */}
        {billingState === 'error' && (
          <div className="flex justify-center">
            <PaymentStatus
              status="failed"
              error={error}
              onRetry={handleRetryPayment}
              onClose={handleCloseModal}
            />
          </div>
        )}

        {/* フッター情報 */}
        <div className="mt-16 border-t border-gray-200 pt-8">
          <div className="max-w-3xl mx-auto text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🤝 私たちがお約束すること
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-600">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">🛡️</div>
                <h4 className="font-semibold text-gray-900 mb-1">完全返金保証</h4>
                <p>24時間以内なら理由を問わず全額返金</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">🔒</div>
                <h4 className="font-semibold text-gray-900 mb-1">セキュア決済</h4>
                <p>SSL暗号化・PCI DSS準拠で安全</p>
              </div>
              
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl mb-2">💬</div>
                <h4 className="font-semibold text-gray-900 mb-1">専任サポート</h4>
                <p>専門スタッフが迅速にサポート</p>
              </div>
            </div>

            <div className="mt-6 text-xs text-gray-500">
              <p>
                ご質問やお困りのことがございましたら、
                <a href="mailto:support@ai-subsidy.com" className="text-blue-600 hover:underline">
                  support@ai-subsidy.com
                </a>
                までお気軽にお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}