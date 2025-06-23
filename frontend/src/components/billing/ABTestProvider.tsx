'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ABTestVariant {
  id: string;
  name: string;
  weight: number;
}

interface ABTest {
  testId: string;
  variants: ABTestVariant[];
  defaultVariant: string;
}

interface ABTestContextType {
  getVariant: (testId: string) => string;
  setVariant: (testId: string, variant: string) => void;
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
}

const ABTestContext = createContext<ABTestContextType | undefined>(undefined);

// 設定可能なA/Bテスト
const AB_TESTS: ABTest[] = [
  {
    testId: 'pricing_display',
    variants: [
      { id: 'control', name: '通常表示', weight: 50 },
      { id: 'variant_a', name: '割引強調', weight: 50 }
    ],
    defaultVariant: 'control'
  },
  {
    testId: 'cta_button_text',
    variants: [
      { id: 'control', name: '完全版を取得する', weight: 40 },
      { id: 'variant_a', name: '今すぐダウンロード', weight: 30 },
      { id: 'variant_b', name: '申請書を作成する', weight: 30 }
    ],
    defaultVariant: 'control'
  },
  {
    testId: 'social_proof_position',
    variants: [
      { id: 'control', name: 'サイドバー表示', weight: 50 },
      { id: 'variant_a', name: 'メイン上部表示', weight: 50 }
    ],
    defaultVariant: 'control'
  },
  {
    testId: 'urgency_messaging',
    variants: [
      { id: 'control', name: '緊急性なし', weight: 33 },
      { id: 'variant_a', name: '限定期間強調', weight: 33 },
      { id: 'variant_b', name: '在庫制限強調', weight: 34 }
    ],
    defaultVariant: 'control'
  }
];

interface ABTestProviderProps {
  children: ReactNode;
  userId?: string;
  enableTracking?: boolean;
}

export function ABTestProvider({ 
  children, 
  userId,
  enableTracking = process.env.NODE_ENV === 'production'
}: ABTestProviderProps) {
  const [variants, setVariants] = useState<Record<string, string>>({});
  const [isInitialized, setIsInitialized] = useState(false);

  // ユーザーIDベースで一貫したバリアント割り当て
  const hashString = (str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  };

  const assignVariant = (testId: string, userIdentifier: string): string => {
    const test = AB_TESTS.find(t => t.testId === testId);
    if (!test) return '';

    // ユーザーIDとテストIDの組み合わせでハッシュ値生成
    const seed = hashString(`${userIdentifier}_${testId}`);
    const random = (seed % 100) + 1; // 1-100の範囲

    // 重み付けに基づいてバリアント選択
    let weightSum = 0;
    for (const variant of test.variants) {
      weightSum += variant.weight;
      if (random <= weightSum) {
        return variant.id;
      }
    }

    return test.defaultVariant;
  };

  // 初期化処理
  useEffect(() => {
    const userIdentifier = userId || 
      localStorage.getItem('abtest_user_id') || 
      generateUserId();

    if (!userId && !localStorage.getItem('abtest_user_id')) {
      localStorage.setItem('abtest_user_id', userIdentifier);
    }

    // 既存のバリアント情報を読み込み
    const storedVariants = localStorage.getItem('abtest_variants');
    let currentVariants: Record<string, string> = {};

    if (storedVariants) {
      try {
        currentVariants = JSON.parse(storedVariants);
      } catch (e) {
        console.warn('Failed to parse stored A/B test variants');
      }
    }

    // 新しいテストや未割り当てのテストに対してバリアント割り当て
    const updatedVariants = { ...currentVariants };
    AB_TESTS.forEach(test => {
      if (!updatedVariants[test.testId]) {
        updatedVariants[test.testId] = assignVariant(test.testId, userIdentifier);
      }
    });

    setVariants(updatedVariants);
    localStorage.setItem('abtest_variants', JSON.stringify(updatedVariants));
    setIsInitialized(true);

    // テスト参加をトラッキング
    if (enableTracking) {
      Object.entries(updatedVariants).forEach(([testId, variant]) => {
        trackEvent('ab_test_assigned', {
          test_id: testId,
          variant: variant,
          user_id: userIdentifier
        });
      });
    }
  }, [userId, enableTracking]);

  const generateUserId = (): string => {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
  };

  const getVariant = (testId: string): string => {
    return variants[testId] || AB_TESTS.find(t => t.testId === testId)?.defaultVariant || '';
  };

  const setVariant = (testId: string, variant: string): void => {
    const updatedVariants = { ...variants, [testId]: variant };
    setVariants(updatedVariants);
    localStorage.setItem('abtest_variants', JSON.stringify(updatedVariants));
  };

  const trackEvent = (eventName: string, properties: Record<string, any> = {}): void => {
    if (!enableTracking) return;

    const eventData = {
      event: eventName,
      timestamp: new Date().toISOString(),
      user_id: userId || localStorage.getItem('abtest_user_id'),
      variants: variants,
      ...properties
    };

    // 実際の実装では分析サービス（Google Analytics、Mixpanel等）に送信
    if (process.env.NODE_ENV === 'development') {
      console.log('A/B Test Event:', eventData);
    }

    // ローカルストレージに一時保存（バックエンドへの送信用）
    const storedEvents = JSON.parse(localStorage.getItem('abtest_events') || '[]');
    storedEvents.push(eventData);
    
    // 最新100件のみ保持
    if (storedEvents.length > 100) {
      storedEvents.splice(0, storedEvents.length - 100);
    }
    
    localStorage.setItem('abtest_events', JSON.stringify(storedEvents));

    // バックエンドへの送信（実装例）
    if (typeof window !== 'undefined') {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData)
      }).catch(err => {
        console.warn('Failed to track A/B test event:', err);
      });
    }
  };

  if (!isInitialized) {
    return <div>{children}</div>; // 初期化中は通常レンダリング
  }

  return (
    <ABTestContext.Provider value={{ getVariant, setVariant, trackEvent }}>
      {children}
    </ABTestContext.Provider>
  );
}

// A/Bテストフック
export function useABTest() {
  const context = useContext(ABTestContext);
  if (context === undefined) {
    throw new Error('useABTest must be used within an ABTestProvider');
  }
  return context;
}

// 特定のテストバリアント取得フック
export function useVariant(testId: string) {
  const { getVariant, trackEvent } = useABTest();
  const variant = getVariant(testId);

  const trackConversion = (conversionEvent: string, properties?: Record<string, any>) => {
    trackEvent(conversionEvent, {
      test_id: testId,
      variant: variant,
      ...properties
    });
  };

  return { variant, trackConversion };
}

// バリアント別コンポーネント表示フック
export function useABTestComponent<T>(
  testId: string,
  components: Record<string, React.ComponentType<T>>
) {
  const { variant } = useVariant(testId);
  const Component = components[variant] || components['control'];
  
  return Component;
}

// 開発用：テスト一覧とバリアント情報表示
export function ABTestDebugger() {
  const { getVariant, setVariant } = useABTest();

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 bg-gray-900 text-white text-xs p-4 max-w-md z-50">
      <h4 className="font-bold mb-2">A/B Test Debugger</h4>
      {AB_TESTS.map(test => (
        <div key={test.testId} className="mb-2">
          <span className="font-medium">{test.testId}:</span>
          <select
            value={getVariant(test.testId)}
            onChange={(e) => setVariant(test.testId, e.target.value)}
            className="ml-2 bg-gray-700 text-white text-xs"
          >
            {test.variants.map(variant => (
              <option key={variant.id} value={variant.id}>
                {variant.name}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}