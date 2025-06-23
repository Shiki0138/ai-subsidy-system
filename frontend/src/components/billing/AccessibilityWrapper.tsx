'use client';

import { useEffect, useState, ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import {
  EyeIcon,
  SpeakerWaveIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface AccessibilityWrapperProps {
  children: ReactNode;
}

interface AccessibilitySettings {
  highContrast: boolean;
  largeText: boolean;
  reduceMotion: boolean;
  screenReaderMode: boolean;
  focusIndicators: boolean;
}

export default function AccessibilityWrapper({ children }: AccessibilityWrapperProps) {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    highContrast: false,
    largeText: false,
    reduceMotion: false,
    screenReaderMode: false,
    focusIndicators: true
  });
  const [showPanel, setShowPanel] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // 設定の読み込みと保存
  useEffect(() => {
    const stored = localStorage.getItem('accessibility_settings');
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse accessibility settings');
      }
    }

    // システム設定の自動検出
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;

    if (prefersReducedMotion || prefersHighContrast) {
      setSettings(prev => ({
        ...prev,
        reduceMotion: prefersReducedMotion,
        highContrast: prefersHighContrast
      }));
    }

    setIsInitialized(true);
  }, []);

  // 設定変更時の処理
  useEffect(() => {
    if (!isInitialized) return;

    localStorage.setItem('accessibility_settings', JSON.stringify(settings));
    applyAccessibilitySettings(settings);
  }, [settings, isInitialized]);

  const applyAccessibilitySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement;

    // ハイコントラストモード
    if (newSettings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    // 大きなテキスト
    if (newSettings.largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }

    // モーション減少
    if (newSettings.reduceMotion) {
      root.classList.add('accessibility-reduce-motion');
    } else {
      root.classList.remove('accessibility-reduce-motion');
    }

    // フォーカスインジケーター強化
    if (newSettings.focusIndicators) {
      root.classList.add('accessibility-focus-indicators');
    } else {
      root.classList.remove('accessibility-focus-indicators');
    }

    // スクリーンリーダーモード
    if (newSettings.screenReaderMode) {
      root.classList.add('accessibility-screen-reader');
      // スクリーンリーダー用の追加aria-labelを設定
      addScreenReaderLabels();
    } else {
      root.classList.remove('accessibility-screen-reader');
    }
  };

  const addScreenReaderLabels = () => {
    // 価格要素にスクリーンリーダー用のラベルを追加
    const priceElements = document.querySelectorAll('[data-price]');
    priceElements.forEach(el => {
      const price = el.getAttribute('data-price');
      if (price) {
        el.setAttribute('aria-label', `価格 ${price}円`);
      }
    });

    // ボタンの詳細説明を追加
    const upgradeButtons = document.querySelectorAll('[data-upgrade-button]');
    upgradeButtons.forEach(el => {
      el.setAttribute('aria-describedby', 'upgrade-description');
    });
  };

  const toggleSetting = (key: keyof AccessibilitySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Alt + A でアクセシビリティパネル開閉
      if (e.altKey && e.key === 'a') {
        e.preventDefault();
        setShowPanel(!showPanel);
      }

      // Alt + H でハイコントラスト切り替え
      if (e.altKey && e.key === 'h') {
        e.preventDefault();
        toggleSetting('highContrast');
      }

      // Alt + T で大きなテキスト切り替え
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        toggleSetting('largeText');
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [showPanel]);

  return (
    <div className="relative">
      {children}

      {/* アクセシビリティ設定ボタン */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="fixed bottom-4 left-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg z-50 transition-colors"
        aria-label="アクセシビリティ設定を開く（Alt+A）"
        title="アクセシビリティ設定"
      >
        <AdjustmentsHorizontalIcon className="h-6 w-6" />
      </button>

      {/* アクセシビリティ設定パネル */}
      {showPanel && (
        <div className="fixed bottom-20 left-4 bg-white border border-gray-300 rounded-lg shadow-xl p-6 z-50 max-w-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              アクセシビリティ設定
            </h3>
            <button
              onClick={() => setShowPanel(false)}
              className="text-gray-400 hover:text-gray-600"
              aria-label="設定パネルを閉じる"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* ハイコントラスト */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                ハイコントラスト（Alt+H）
              </label>
              <button
                onClick={() => toggleSetting('highContrast')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={settings.highContrast}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* 大きなテキスト */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                大きなテキスト（Alt+T）
              </label>
              <button
                onClick={() => toggleSetting('largeText')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.largeText ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={settings.largeText}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.largeText ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* モーション減少 */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                アニメーション減少
              </label>
              <button
                onClick={() => toggleSetting('reduceMotion')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.reduceMotion ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={settings.reduceMotion}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.reduceMotion ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* スクリーンリーダーモード */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                スクリーンリーダー対応
              </label>
              <button
                onClick={() => toggleSetting('screenReaderMode')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={settings.screenReaderMode}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* フォーカスインジケーター */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                フォーカス強調表示
              </label>
              <button
                onClick={() => toggleSetting('focusIndicators')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.focusIndicators ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                aria-pressed={settings.focusIndicators}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.focusIndicators ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>キーボードショートカット：</p>
            <p>Alt+A: 設定パネル開閉</p>
            <p>Alt+H: ハイコントラスト切り替え</p>
            <p>Alt+T: 大きなテキスト切り替え</p>
          </div>
        </div>
      )}

      {/* アクセシビリティ用のスクリーンリーダー専用要素 */}
      <div id="upgrade-description" className="sr-only">
        完全版の申請書をダウンロードできます。24時間返金保証付きで安心してご利用いただけます。
      </div>

      {/* アクセシビリティスタイル */}
      <style jsx global>{`
        /* ハイコントラストモード */
        .accessibility-high-contrast {
          --tw-bg-gray-50: #ffffff;
          --tw-bg-gray-100: #f0f0f0;
          --tw-text-gray-600: #000000;
          --tw-text-gray-700: #000000;
          --tw-text-gray-900: #000000;
          --tw-border-gray-200: #000000;
        }
        
        .accessibility-high-contrast * {
          border-color: #000000 !important;
        }
        
        .accessibility-high-contrast .bg-blue-50 {
          background-color: #e6f3ff !important;
        }
        
        .accessibility-high-contrast .text-blue-600 {
          color: #0066cc !important;
        }

        /* 大きなテキスト */
        .accessibility-large-text {
          font-size: 120%;
        }
        
        .accessibility-large-text * {
          line-height: 1.6 !important;
        }

        /* モーション減少 */
        .accessibility-reduce-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }

        /* フォーカスインジケーター強化 */
        .accessibility-focus-indicators *:focus {
          outline: 3px solid #2563eb !important;
          outline-offset: 2px !important;
        }

        /* スクリーンリーダー専用 */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        /* スクリーンリーダーモード */
        .accessibility-screen-reader .animate-bounce,
        .accessibility-screen-reader .animate-pulse,
        .accessibility-screen-reader .animate-spin {
          animation: none !important;
        }
      `}</style>
    </div>
  );
}