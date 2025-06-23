'use client';

import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { ReactNode, useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

// Stripe公開可能キーの設定
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeElementsWrapperProps {
  children: ReactNode;
  amount?: number;
  currency?: string;
  appearance?: 'default' | 'night' | 'flat';
}

export default function StripeElementsWrapper({
  children,
  amount = 1980,
  currency = 'jpy',
  appearance = 'default'
}: StripeElementsWrapperProps) {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PaymentIntentの作成
  useEffect(() => {
    const createPaymentIntent = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/billing/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: amount,
            currency: currency,
            automatic_payment_methods: {
              enabled: true,
            },
            metadata: {
              source: 'ai_subsidy_system',
              timestamp: new Date().toISOString()
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.success && data.client_secret) {
          setClientSecret(data.client_secret);
        } else {
          throw new Error(data.error || 'PaymentIntent作成に失敗しました');
        }
      } catch (err: any) {
        console.error('PaymentIntent creation failed:', err);
        setError(err.message);
        toast.error('決済システムの初期化に失敗しました');
      } finally {
        setIsLoading(false);
      }
    };

    // 開発環境ではモック、本番環境では実際のAPIを呼び出し
    if (process.env.NODE_ENV === 'development') {
      // 開発用のモックclient_secret
      setClientSecret('pi_mock_client_secret_for_development');
      setIsLoading(false);
    } else {
      createPaymentIntent();
    }
  }, [amount, currency]);

  // Stripe Elementsの設定
  const options: StripeElementsOptions = {
    clientSecret,
    appearance: {
      theme: appearance === 'night' ? 'night' : appearance === 'flat' ? 'flat' : 'stripe',
      variables: {
        colorPrimary: '#2563eb',
        colorBackground: '#ffffff',
        colorText: '#1f2937',
        colorDanger: '#ef4444',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '8px',
      },
      rules: {
        '.Input': {
          border: '1px solid #d1d5db',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
        '.Input:focus': {
          border: '1px solid #2563eb',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1)',
        },
        '.Label': {
          color: '#374151',
          fontSize: '14px',
          fontWeight: '500',
        },
        '.Error': {
          color: '#ef4444',
          fontSize: '13px',
        }
      }
    },
    fonts: [
      {
        cssSrc: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap',
      },
    ],
    locale: 'ja',
  };

  // エラー状態の表示
  if (error) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-red-500 text-xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            決済システムエラー
          </h3>
          <p className="text-gray-600 mb-4">
            決済システムの初期化中にエラーが発生しました。
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // ローディング状態の表示
  if (isLoading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">決済システムを初期化中...</p>
        </div>
      </div>
    );
  }

  // 正常状態：Stripe Elementsでラップ
  if (clientSecret) {
    return (
      <Elements stripe={stripePromise} options={options}>
        {children}
      </Elements>
    );
  }

  // fallback
  return <div>{children}</div>;
}

// Stripe Elementsの利用可能性チェック用フック
export function useStripeElementsAvailable() {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkStripeAvailability = async () => {
      try {
        const stripe = await stripePromise;
        setIsAvailable(!!stripe);
      } catch (error) {
        console.error('Stripe availability check failed:', error);
        setIsAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkStripeAvailability();
  }, []);

  return { isAvailable, isLoading };
}