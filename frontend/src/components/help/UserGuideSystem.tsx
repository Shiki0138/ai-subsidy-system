'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Modal } from '../ui/Modal';
import { Alert } from '../ui/Alert';

interface GuideStep {
  id: string;
  title: string;
  description: string;
  content: string;
  category: 'basic' | 'advanced' | 'troubleshooting';
  estimatedTime: number; // 分
  prerequisites?: string[];
  relatedSteps?: string[];
  screenshots?: string[];
  videoUrl?: string;
  tips: string[];
  commonIssues: {
    issue: string;
    solution: string;
  }[];
}

interface GuideCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  steps: GuideStep[];
}

const UserGuideSystem: React.FC = () => {
  const [categories, setCategories] = useState<GuideCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<GuideStep | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showQuickStart, setShowQuickStart] = useState(false);

  useEffect(() => {
    initializeGuideData();
    loadUserProgress();
  }, []);

  const initializeGuideData = () => {
    const guideCategories: GuideCategory[] = [
      {
        id: 'getting_started',
        title: '🚀 はじめに',
        description: 'AI補助金申請システムの基本的な使い方',
        icon: '🚀',
        steps: [
          {
            id: 'registration',
            title: 'アカウント登録',
            description: '新規アカウントを作成して利用を開始',
            content: `
**アカウント登録の手順**

1. **登録ページへアクセス**
   - トップページから「新規登録」ボタンをクリック
   - メールアドレスとパスワードを入力

2. **企業情報の入力**
   - 企業名、代表者名を正確に入力
   - 業種、従業員数、設立年を選択
   - 所在地、連絡先を入力

3. **認証メールの確認**
   - 登録したメールアドレスに認証メールが送信されます
   - メール内のリンクをクリックして認証を完了

4. **プロフィール情報の完成**
   - 年商、ウェブサイトなど追加情報を入力
   - プロフィール完成度100%を目指しましょう

⚠️ **重要な注意事項**
- 企業名や代表者名は登記簿謄本と一致するように入力してください
- 正確な情報入力により、AI生成の精度が向上します
            `,
            category: 'basic',
            estimatedTime: 10,
            tips: [
              '企業情報は後から変更可能ですが、申請書生成前に正確な情報を入力してください',
              'パスワードは8文字以上、英数字を組み合わせることをお勧めします',
              '認証メールが届かない場合は、迷惑メールフォルダを確認してください'
            ],
            commonIssues: [
              {
                issue: 'メール認証が完了できない',
                solution: '迷惑メールフォルダを確認し、24時間以内にリンクをクリックしてください'
              },
              {
                issue: '企業名が正しく入力できない',
                solution: '全角・半角、スペースの有無など、登記簿謄本と完全に一致するように入力してください'
              }
            ]
          },
          {
            id: 'profile_setup',
            title: 'プロフィール設定',
            description: '詳細な企業プロフィールを設定',
            content: `
**企業プロフィール設定の重要性**

AIが最適な申請書を生成するために、詳細なプロフィール情報が必要です。

**必須項目**
- 企業名（登記簿謄本記載のもの）
- 代表者名
- 業種・事業内容
- 従業員数
- 年商
- 設立年
- 所在地

**推奨項目**
- ウェブサイトURL
- 主要取引先
- 過去の受賞歴
- 特許・認証取得状況
- SDGs取組み状況

**プロフィール完成度と効果**
- 80%以上: 基本的なAI生成が可能
- 90%以上: 高精度な申請書生成
- 100%: 最適化された申請書と個別提案

💡 **プロフィール活用のコツ**
- 定期的に情報を更新してください
- 新しい事業展開や実績は随時追加
- 申請する補助金に関連する情報を重視
            `,
            category: 'basic',
            estimatedTime: 15,
            prerequisites: ['registration'],
            tips: [
              'プロフィール完成度が高いほど、AI生成の精度が向上します',
              '年商や従業員数は最新の情報を入力してください',
              '業種選択は補助金の対象要件に大きく影響します'
            ],
            commonIssues: [
              {
                issue: 'プロフィール完成度が上がらない',
                solution: '全ての必須項目を入力し、推奨項目も可能な限り入力してください'
              }
            ]
          }
        ]
      },
      {
        id: 'application_creation',
        title: '📝 申請書作成',
        description: 'AI機能を使った効率的な申請書作成方法',
        icon: '📝',
        steps: [
          {
            id: 'subsidy_selection',
            title: '補助金選択',
            description: '最適な補助金プログラムの選択方法',
            content: `
**補助金選択のステップ**

1. **補助金一覧の確認**
   - ダッシュボードから「補助金一覧」をクリック
   - カテゴリ別、条件別にフィルタリング
   - 各補助金の基本情報を確認

2. **適合性チェック**
   - 企業規模、業種、事業内容の適合性
   - 申請期限と事業実施期間の確認
   - 補助率と上限額の確認

3. **詳細情報の確認**
   - 📊 データ更新状況の確認
   - 募集要項の最新版チェック
   - 過去の採択事例の参考

4. **マッチングスコアの活用**
   - AIが算出する適合度スコア
   - 80点以上なら申請を推奨
   - スコアが低い場合は理由を確認

**選択時の重要ポイント**
- 申請期限に余裕があるか
- 自己負担額が予算内か
- 事業計画と補助金の目的が一致しているか
- 過去の採択率を参考にする

🎯 **効果的な選択方法**
- 複数の補助金を比較検討
- 申請難易度と期待値のバランス
- 企業の成長段階に適した補助金選択
            `,
            category: 'basic',
            estimatedTime: 20,
            prerequisites: ['profile_setup'],
            tips: [
              'マッチングスコア80点以上の補助金を優先的に検討してください',
              '申請期限の1ヶ月前には申請準備を開始することをお勧めします',
              '複数の補助金に同時申請も可能ですが、内容の重複に注意してください'
            ],
            commonIssues: [
              {
                issue: 'マッチングスコアが低い',
                solution: 'プロフィール情報を詳細化し、事業計画を補助金の目的に合わせて調整してください'
              },
              {
                issue: 'どの補助金を選べばよいかわからない',
                solution: 'AIレコメンデーション機能を活用し、上位3つの補助金を詳しく比較してください'
              }
            ]
          },
          {
            id: 'ai_generation',
            title: 'AI申請書生成',
            description: 'AI機能を最大限活用した申請書作成',
            content: `
**AI申請書生成の流れ**

1. **事前準備**
   - 企業プロフィールの完成度確認
   - 事業計画の概要整理
   - 予算計画の準備

2. **ステップ1-2: 基本情報入力**
   - 補助金選択
   - 企業情報の最終確認・更新

3. **ステップ3-4: 事業計画詳細**
   - プロジェクトタイトルと概要
   - 目標設定（定量的・定性的）
   - ターゲット市場の明確化
   - 競合分析と優位性

4. **ステップ5: 予算・スケジュール**
   - 詳細な予算計画
   - 実施スケジュール
   - マイルストーン設定

5. **ステップ6: AI生成実行** ⭐
   - AIが9つのカテゴリで質問生成
   - 段階的な回答入力
   - リアルタイム申請書プレビュー
   - スコアリングと最適化提案

6. **ステップ7: 最終確認**
   - 生成された申請書の確認
   - 必要に応じて編集・修正
   - PDF出力と提出準備

**AI生成のコツ**
- 具体的で詳細な情報を提供
- 数値データを積極的に活用
- 業界専門用語は適度に使用
- 成果指標は測定可能なものを設定

🤖 **AI機能の特徴**
- Claude 3.5 Sonnet による高精度生成
- 補助金別の最適化アルゴリズム
- リアルタイムスコアリング
- 自動キーワード最適化
            `,
            category: 'advanced',
            estimatedTime: 60,
            prerequisites: ['subsidy_selection'],
            tips: [
              'AI質問には可能な限り具体的に回答してください',
              '数値データ（売上、従業員数、市場規模など）を積極的に活用してください',
              '生成途中でも内容を確認し、必要に応じて修正してください'
            ],
            commonIssues: [
              {
                issue: 'AI生成される内容が薄い',
                solution: '質問への回答をより具体的・詳細に入力し直してください'
              },
              {
                issue: '生成時間が長い',
                solution: '複雑な内容の場合、生成に数分かかることがあります。しばらくお待ちください'
              }
            ]
          }
        ]
      },
      {
        id: 'document_management',
        title: '📄 書類管理',
        description: '必要書類の準備と提出管理',
        icon: '📄',
        steps: [
          {
            id: 'document_checklist',
            title: '必要書類チェックリスト',
            description: '申請に必要な書類の確認と準備',
            content: `
**自動書類チェックリストの活用**

システムが企業プロフィールと選択した補助金に基づいて、必要書類を自動生成します。

**書類カテゴリ**
- 🔴 **必須書類**: 全企業が提出必要
- 🟡 **条件付き書類**: 特定条件下で必要
- ⚪ **任意書類**: 提出推奨

**主要な必須書類**
1. **申請書**: AI生成・最終確認済み
2. **事業計画書**: 詳細な実施計画
3. **登記事項証明書**: 3ヶ月以内発行
4. **決算書**: 直近2期分
5. **見積書**: 設備・サービス等

**条件付き書類の例**
- 従業員20名超 → 雇用保険適用事業所設置届
- 新設法人 → 創業計画書
- 製造業 → 製造業許可証

**書類準備のコツ**
- 早めの準備で余裕を持った申請
- 原本とコピーの区別を明確に
- ファイル形式とサイズ制限の確認
- 書類の有効期限をチェック

**自動チェック機能**
- ✅ ファイル形式の検証
- ✅ ファイルサイズの確認
- ✅ 必要書類の網羅性チェック
- ✅ よくある間違いの指摘
- ✅ 改善提案の表示

📋 **書類準備の進捗管理**
- リアルタイム完成度表示
- 未提出書類の一覧表示
- 提出期限のリマインダー
            `,
            category: 'basic',
            estimatedTime: 30,
            prerequisites: ['ai_generation'],
            tips: [
              '書類は早めに準備し、提出期限に余裕を持ってください',
              'PDF形式での提出が推奨されます',
              '書類の有効期限（特に登記事項証明書）に注意してください'
            ],
            commonIssues: [
              {
                issue: '書類のファイルサイズが大きすぎる',
                solution: 'PDF圧縮ツールを使用してファイルサイズを削減してください'
              },
              {
                issue: '条件付き書類が必要かわからない',
                solution: 'システムの自動判定を確認し、不明な場合はサポートにお問い合わせください'
              }
            ]
          }
        ]
      },
      {
        id: 'troubleshooting',
        title: '🔧 トラブルシューティング',
        description: 'よくある問題の解決方法',
        icon: '🔧',
        steps: [
          {
            id: 'common_issues',
            title: 'よくある問題と解決方法',
            description: 'システム利用時のトラブル対処法',
            content: `
**システム関連の問題**

**1. ログインできない**
- パスワードを忘れた場合
  → パスワードリセット機能を使用
- メール認証が完了していない
  → 認証メールを再送信

**2. AI生成が失敗する**
- 入力内容が不十分
  → より詳細な情報を入力
- システムの一時的な障害
  → 時間をおいて再試行

**3. ファイルアップロードエラー**
- ファイルサイズが上限を超過
  → ファイルを圧縮または分割
- 対応していないファイル形式
  → PDF, Word, Excel形式に変換

**申請書作成の問題**

**1. 内容が薄い・具体性に欠ける**
- 解決方法:
  - 数値データを具体的に入力
  - 業界データや市場調査結果を活用
  - 成功事例を参考にする

**2. スコアが向上しない**
- 解決方法:
  - キーワードの最適化
  - セクション別の改善提案を確認
  - 競合他社との差別化ポイントを強調

**3. 予算計画が妥当でない**
- 解決方法:
  - 詳細な見積もりを取得
  - 過去の類似プロジェクトを参考
  - 費用対効果を明確化

**緊急時の対応**

**申請期限が迫っている場合**
1. 必須項目のみ優先入力
2. AI生成で基本構造を作成
3. 重要セクションを手動で詳細化
4. 書類は後から追加・修正可能

**システム障害時の代替手段**
- オフライン作業用テンプレートのダウンロード
- サポートチームへの緊急連絡
- 申請期限延長の相談

🆘 **サポート連絡先**
- メール: support@ai-subsidy.example.com
- 電話: 03-XXXX-XXXX（平日9:00-18:00）
- チャット: システム内サポートチャット
            `,
            category: 'troubleshooting',
            estimatedTime: 15,
            tips: [
              'トラブル発生時は慌てずに、まず基本的な確認（ブラウザ更新、再ログインなど）を行ってください',
              '申請期限に余裕がない場合は、すぐにサポートチームにご連絡ください',
              'エラーメッセージはスクリーンショットを撮って保存してください'
            ],
            commonIssues: [
              {
                issue: 'サポートに連絡したが返答がない',
                solution: '緊急の場合は電話での連絡をお勧めします。メールの場合は24時間以内に返答いたします'
              }
            ]
          }
        ]
      }
    ];

    setCategories(guideCategories);
  };

  const loadUserProgress = () => {
    // localStorage から進捗状況を読み込み
    const saved = localStorage.getItem('guide_progress');
    if (saved) {
      setCompletedSteps(new Set(JSON.parse(saved)));
    }
  };

  const markStepCompleted = (stepId: string) => {
    const newCompleted = new Set(completedSteps);
    newCompleted.add(stepId);
    setCompletedSteps(newCompleted);
    localStorage.setItem('guide_progress', JSON.stringify([...newCompleted]));
  };

  const getProgressPercentage = () => {
    const totalSteps = categories.reduce((sum, cat) => sum + cat.steps.length, 0);
    return totalSteps > 0 ? Math.round((completedSteps.size / totalSteps) * 100) : 0;
  };

  const filteredCategories = categories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.steps.some(step => 
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* ヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">📚 ユーザーガイド</h1>
        <div className="flex items-center justify-between">
          <p className="text-gray-600">
            AI補助金申請システムの使い方を段階的に学習できます
          </p>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              進捗: {completedSteps.size} / {categories.reduce((sum, cat) => sum + cat.steps.length, 0)} 完了
            </span>
            <div className="w-32 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-blue-600">
              {getProgressPercentage()}%
            </span>
          </div>
        </div>
      </div>

      {/* クイックアクション */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button
          onClick={() => setShowQuickStart(true)}
          className="h-16 text-left"
        >
          <div>
            <div className="font-semibold">🚀 クイックスタート</div>
            <div className="text-sm opacity-75">5分で基本操作を習得</div>
          </div>
        </Button>
        
        <Button
          variant="default"
          onClick={() => setSelectedCategory('troubleshooting')}
          className="h-16 text-left"
        >
          <div>
            <div className="font-semibold">🔧 トラブル解決</div>
            <div className="text-sm opacity-75">よくある問題の解決方法</div>
          </div>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => window.open('/api/help/faq', '_blank')}
          className="h-16 text-left"
        >
          <div>
            <div className="font-semibold">❓ FAQ</div>
            <div className="text-sm opacity-75">よくある質問と回答</div>
          </div>
        </Button>
      </div>

      {/* 検索 */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="ガイドを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* カテゴリ一覧 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCategories.map((category) => (
          <Card key={category.id} className="p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{category.icon}</span>
              <div>
                <h3 className="text-lg font-semibold">{category.title}</h3>
                <p className="text-gray-600 text-sm">{category.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {category.steps.map((step) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    completedSteps.has(step.id)
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-blue-50'
                  }`}
                  onClick={() => setSelectedStep(step)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="mr-2">
                        {completedSteps.has(step.id) ? '✅' : '📖'}
                      </span>
                      <div>
                        <h4 className="font-medium">{step.title}</h4>
                        <p className="text-sm text-gray-600">{step.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={step.category === 'basic' ? 'green' : step.category === 'advanced' ? 'blue' : 'yellow'}>
                        {step.category === 'basic' ? '基本' : step.category === 'advanced' ? '上級' : '対処法'}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {step.estimatedTime}分
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* ステップ詳細モーダル */}
      <Modal
        isOpen={!!selectedStep}
        onClose={() => setSelectedStep(null)}
        title={selectedStep?.title || ''}
        size="large"
      >
        {selectedStep && (
          <div className="space-y-6">
            {/* ステップ情報 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant={selectedStep.category === 'basic' ? 'green' : selectedStep.category === 'advanced' ? 'blue' : 'yellow'}>
                  {selectedStep.category === 'basic' ? '基本' : selectedStep.category === 'advanced' ? '上級' : '対処法'}
                </Badge>
                <span className="text-sm text-gray-600">
                  所要時間: {selectedStep.estimatedTime}分
                </span>
                {completedSteps.has(selectedStep.id) && (
                  <Badge variant="green">完了済み</Badge>
                )}
              </div>
            </div>

            {/* 前提条件 */}
            {selectedStep.prerequisites && selectedStep.prerequisites.length > 0 && (
              <Alert variant="info">
                <strong>前提条件:</strong> {selectedStep.prerequisites.join(', ')} を完了している必要があります
              </Alert>
            )}

            {/* メインコンテンツ */}
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ 
                __html: selectedStep.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') 
              }} />
            </div>

            {/* Tips */}
            {selectedStep.tips.length > 0 && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">💡 コツ・ポイント</h4>
                <ul className="space-y-1">
                  {selectedStep.tips.map((tip, index) => (
                    <li key={index} className="text-sm">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* よくある問題 */}
            {selectedStep.commonIssues.length > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">⚠️ よくある問題と解決方法</h4>
                <div className="space-y-3">
                  {selectedStep.commonIssues.map((issue, index) => (
                    <div key={index}>
                      <div className="font-medium text-sm text-red-600">
                        問題: {issue.issue}
                      </div>
                      <div className="text-sm text-green-700">
                        解決: {issue.solution}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-between">
              <div>
                {selectedStep.relatedSteps && selectedStep.relatedSteps.length > 0 && (
                  <Button variant="outline" size="sm">
                    関連ステップを見る
                  </Button>
                )}
              </div>
              <div className="space-x-2">
                {!completedSteps.has(selectedStep.id) && (
                  <Button
                    onClick={() => markStepCompleted(selectedStep.id)}
                    variant="primary"
                  >
                    ✅ 完了済みにマーク
                  </Button>
                )}
                <Button variant="default" onClick={() => setSelectedStep(null)}>
                  閉じる
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* クイックスタートモーダル */}
      <Modal
        isOpen={showQuickStart}
        onClose={() => setShowQuickStart(false)}
        title="🚀 クイックスタートガイド"
      >
        <div className="space-y-4">
          <Alert variant="info">
            <strong>5分で基本操作を習得</strong><br/>
            AI補助金申請システムの基本的な使い方を素早く学習できます。
          </Alert>
          
          <div className="space-y-3">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <span className="mr-3">1️⃣</span>
              <div>
                <div className="font-medium">アカウント登録・プロフィール設定</div>
                <div className="text-sm text-gray-600">企業情報を正確に入力</div>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <span className="mr-3">2️⃣</span>
              <div>
                <div className="font-medium">補助金選択</div>
                <div className="text-sm text-gray-600">AIマッチングで最適な補助金を発見</div>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <span className="mr-3">3️⃣</span>
              <div>
                <div className="font-medium">AI申請書生成</div>
                <div className="text-sm text-gray-600">質問に答えるだけで自動生成</div>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <span className="mr-3">4️⃣</span>
              <div>
                <div className="font-medium">書類準備・提出</div>
                <div className="text-sm text-gray-600">自動チェックリストで漏れなく準備</div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setShowQuickStart(false);
                setSelectedCategory('getting_started');
              }}
            >
              詳細ガイドを見る
            </Button>
            <Button onClick={() => setShowQuickStart(false)}>
              今すぐ始める
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserGuideSystem;