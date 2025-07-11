# 決済エラー処理フローチャート

**作成日**: 2025-06-20  
**作成者**: チームA（課金・決済担当）  
**バージョン**: 1.0  
**対象**: フロントエンド開発者、サポート担当者

---

## 📋 概要

AI補助金申請システムの決済プロセスで発生する可能性のあるエラーと、その対処法を体系化したフローチャートです。ユーザーファーストの観点から、分かりやすく親切な案内を心がけています。

---

## 🔄 メイン決済フロー

```
[決済開始] → [価格情報取得] → [Checkout Session作成] → [Stripe決済ページ] → [決済完了] → [PDF生成・配信]
     ↓              ↓                   ↓                    ↓               ↓              ↓
  [エラーA]      [エラーB]           [エラーC]           [エラーD]      [エラーE]       [エラーF]
```

---

## 📊 エラー分類と対処フロー

### エラーA: 価格情報取得エラー

```mermaid
flowchart TD
    A[価格情報取得開始] --> B{API応答確認}
    B -->|成功| C[価格表示]
    B -->|失敗| D{エラー種別判定}
    
    D -->|ネットワークエラー| E[ネットワーク確認メッセージ]
    D -->|サーバーエラー| F[サーバー障害メッセージ]
    D -->|タイムアウト| G[タイムアウトメッセージ]
    
    E --> H[5秒後自動リトライ]
    F --> I[手動リトライボタン]
    G --> H
    
    H --> J{リトライ回数確認}
    I --> J
    J -->|3回未満| B
    J -->|3回以上| K[サポート連絡案内]
```

**ユーザー向けメッセージ**:
- ネットワークエラー: "インターネット接続を確認して、再度お試しください"
- サーバーエラー: "一時的な障害が発生しています。しばらく時間をおいて再度お試しください"
- タイムアウト: "応答に時間がかかっています。もう一度お試しください"

### エラーB: バリデーションエラー

```mermaid
flowchart TD
    A[入力値検証] --> B{必須項目確認}
    B -->|OK| C{形式確認}
    B -->|NG| D[必須項目エラー表示]
    
    C -->|OK| E{プラン有効性確認}
    C -->|NG| F[形式エラー表示]
    
    E -->|OK| G[次のステップへ]
    E -->|NG| H[プラン選択エラー表示]
    
    D --> I[該当フィールドをハイライト]
    F --> I
    H --> I
    
    I --> J[具体的な修正方法を案内]
    J --> K[ユーザー修正待ち]
    K --> A
```

**具体的なエラーメッセージ例**:
```typescript
const validationErrors = {
  pdf_id: "PDFを選択してください",
  plan: "価格プランを選択してください", 
  success_url: "有効なURLを入力してください",
  email: "有効なメールアドレスを入力してください"
};
```

### エラーC: Checkout Session作成エラー

```mermaid
flowchart TD
    A[Session作成リクエスト] --> B{Stripe API応答}
    B -->|成功| C[決済ページリダイレクト]
    B -->|失敗| D{エラーコード判定}
    
    D -->|authentication_required| E[認証エラー処理]
    D -->|rate_limit_error| F[レート制限処理]
    D -->|api_error| G[API障害処理]
    D -->|invalid_request_error| H[リクエストエラー処理]
    
    E --> I[ログイン促進]
    F --> J[60秒待機後リトライ]
    G --> K[障害通知・手動リトライ]
    H --> L[入力値再確認促進]
    
    I --> M[ユーザー操作待ち]
    J --> A
    K --> N[サポート連絡案内]
    L --> O[フォーム修正案内]
```

### エラーD: 決済処理エラー（Stripe側）

```mermaid
flowchart TD
    A[Stripe決済ページ] --> B{決済実行}
    B -->|成功| C[決済完了]
    B -->|失敗| D{Stripeエラー種別}
    
    D -->|card_declined| E[カード拒否処理]
    D -->|insufficient_funds| F[残高不足処理] 
    D -->|expired_card| G[カード期限切れ処理]
    D -->|incorrect_cvc| H[CVC不正処理]
    D -->|processing_error| I[処理エラー処理]
    
    E --> J[別カード使用案内]
    F --> K[残高確認・別カード案内]
    G --> L[新しいカード登録案内]
    H --> M[正しいCVC入力案内]
    I --> N[時間をおいて再試行案内]
    
    J --> O[決済ページで再試行]
    K --> O
    L --> O
    M --> O
    N --> P[5分後自動リトライ]
    
    P --> Q{リトライ回数確認}
    Q -->|2回未満| A
    Q -->|2回以上| R[サポート連絡案内]
```

**決済エラーメッセージ例**:
```typescript
const stripeErrorMessages = {
  card_declined: {
    title: "カードが利用できませんでした",
    message: "お使いのカードで決済ができませんでした。別のカードをお試しいただくか、カード会社にお問い合わせください。",
    actions: ["別のカードを試す", "カード会社に連絡", "サポートに連絡"]
  },
  insufficient_funds: {
    title: "残高不足です", 
    message: "カードの利用限度額を超えているか、残高が不足しています。",
    actions: ["残高を確認", "別のカードを試す", "利用限度額を確認"]
  }
};
```

### エラーE: 決済完了後のWebhookエラー

```mermaid
flowchart TD
    A[決済完了通知受信] --> B{Webhook署名検証}
    B -->|成功| C{決済状態確認}
    B -->|失敗| D[署名エラーログ記録]
    
    C -->|completed| E[PDF使用権付与]
    C -->|failed| F[決済失敗処理]
    C -->|processing| G[処理中状態維持]
    
    D --> H[手動確認フラグ設定]
    F --> I[返金処理開始]
    G --> J[5分後ステータス再確認]
    
    E --> K{PDF使用権付与成功?}
    K -->|成功| L[ユーザー通知送信]
    K -->|失敗| M[使用権付与リトライ]
    
    H --> N[管理者通知]
    I --> O[ユーザー返金通知]
    M --> P{リトライ回数確認}
    
    P -->|3回未満| E
    P -->|3回以上| Q[手動対応フラグ]
```

### エラーF: PDF生成・配信エラー

```mermaid
flowchart TD
    A[PDF生成開始] --> B{AI生成サービス応答}
    B -->|成功| C[PDF品質確認]
    B -->|失敗| D{エラー種別判定}
    
    C -->|品質OK| E[PDF配信]
    C -->|品質NG| F[品質改善リトライ]
    
    D -->|AI服务超时| G[タイムアウト処理]
    D -->|AI配额不足| H[配額不足処理]
    D -->|データ不正| I[データエラー処理]
    
    E --> J{配信成功?}
    J -->|成功| K[完了通知]
    J -->|失敗| L[配信リトライ]
    
    F --> M{リトライ回数確認}
    M -->|2回未満| A
    M -->|2回以上| N[手動品質確認]
    
    G --> O[30秒後リトライ]
    H --> P[代替AI選択]
    I --> Q[入力データ再確認]
    
    L --> R{配信リトライ回数}
    R -->|3回未満| E
    R -->|3回以上| S[手動配信対応]
```

---

## 🚨 緊急時対応フロー

### サービス全体障害

```mermaid
flowchart TD
    A[サービス障害検知] --> B[障害レベル判定]
    B -->|Level 1: 軽微| C[自動復旧試行]
    B -->|Level 2: 中程度| D[手動復旧 + ユーザー通知]
    B -->|Level 3: 重大| E[緊急対応チーム招集]
    
    C --> F{復旧成功?}
    F -->|YES| G[監視継続]
    F -->|NO| D
    
    D --> H[ユーザー向けメンテナンス通知]
    E --> I[全ユーザー緊急通知]
    
    H --> J[復旧作業実行]
    I --> K[緊急復旧作業]
    
    J --> L[復旧確認テスト]
    K --> L
    
    L --> M{サービス正常化?}
    M -->|YES| N[復旧完了通知]
    M -->|NO| O[エスカレーション]
```

### 決済システム障害

```mermaid
flowchart TD
    A[決済障害検知] --> B[Stripe Dashboard確認]
    B -->|Stripe正常| C[自社システム確認]
    B -->|Stripe障害| D[Stripe状況監視]
    
    C --> E{自社障害レベル}
    E -->|API障害| F[APIサーバー再起動]
    E -->|DB障害| G[DB復旧作業]
    E -->|ネットワーク障害| H[ネットワーク確認]
    
    D --> I[代替決済手段検討]
    F --> J[動作確認テスト]
    G --> J
    H --> J
    
    I --> K[ユーザー向け代替案内]
    J --> L{復旧確認}
    L -->|成功| M[決済再開通知]
    L -->|失敗| N[上位エスカレーション]
```

---

## 📱 フロントエンド実装ガイド

### エラーUI設計方針

1. **分かりやすさ優先**
   - 技術用語を避ける
   - 具体的な対処法を提示
   - 次のアクションを明確に

2. **親切な案内**
   - 謝罪の気持ちを表現
   - 代替手段を提示
   - サポート連絡先を明記

3. **視覚的配慮**
   - エラーレベルに応じた色分け
   - アイコンで直感的に理解
   - 進捗状況の可視化

### エラーコンポーネント例

```typescript
interface ErrorDisplayProps {
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    primary?: boolean;
  }>;
  supportContact?: boolean;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  type, title, message, actions, supportContact
}) => {
  return (
    <div className={`error-display error-${type}`}>
      <div className="error-icon">
        {type === 'error' && <ErrorIcon />}
        {type === 'warning' && <WarningIcon />}
        {type === 'info' && <InfoIcon />}
      </div>
      
      <div className="error-content">
        <h3 className="error-title">{title}</h3>
        <p className="error-message">{message}</p>
        
        {actions && (
          <div className="error-actions">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`btn ${action.primary ? 'btn-primary' : 'btn-secondary'}`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
        
        {supportContact && (
          <div className="error-support">
            <p>お困りの場合は<a href="/support">サポート</a>までお気軽にお問い合わせください。</p>
          </div>
        )}
      </div>
    </div>
  );
};
```

### 自動リトライ実装例

```typescript
class PaymentRetryManager {
  private maxRetries = 3;
  private retryDelay = 1000; // 1秒
  
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    errorHandler?: (error: Error, attempt: number) => void
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (errorHandler) {
          errorHandler(lastError, attempt);
        }
        
        if (attempt < this.maxRetries) {
          await this.delay(this.retryDelay * attempt);
        }
      }
    }
    
    throw lastError!;
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

---

## 📊 エラー監視・分析

### 主要メトリクス

1. **エラー率**
   - 決済成功率: 目標 99.5%以上
   - API応答率: 目標 99.9%以上
   - PDF生成成功率: 目標 99.8%以上

2. **レスポンス時間**
   - 価格取得: 100ms以下
   - Session作成: 500ms以下
   - PDF生成: 30秒以下

3. **ユーザー体験**
   - 離脱率: 5%以下
   - 再試行率: 80%以上
   - サポート問い合わせ率: 1%以下

### アラート設定

```yaml
alerts:
  payment_success_rate:
    threshold: 95%
    window: 5m
    action: immediate_notification
    
  api_error_rate:
    threshold: 1%
    window: 1m
    action: warning_notification
    
  pdf_generation_timeout:
    threshold: 30s
    window: 1m
    action: investigation_required
```

---

## 📞 サポートエスカレーション

### レベル1: 自動対応
- 自動リトライ
- 代替手段の提示
- FAQ案内

### レベル2: サポート対応
- チャットサポート
- メールサポート
- 電話サポート（緊急時）

### レベル3: 技術チーム対応
- システム障害
- データ不整合
- セキュリティインシデント

### エスカレーション基準

```typescript
const escalationRules = {
  level1: {
    conditions: ['standard_error', 'retry_possible'],
    response: 'automated_recovery'
  },
  level2: {
    conditions: ['user_frustration', 'multiple_failures'],
    response: 'human_support'
  },
  level3: {
    conditions: ['system_wide_impact', 'security_concern'],
    response: 'technical_team'
  }
};
```

---

**最終更新**: 2025-06-20  
**次回レビュー**: 2025-06-27  
**承認者**: チームAリーダー