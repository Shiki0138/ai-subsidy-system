# 共通コンポーネント仕様

## Button仕様
### バリエーション
- primary: メインアクション用
- secondary: サブアクション用  
- outline: 境界線スタイル
- ghost: 背景なしスタイル

### サイズ
- sm: 32px高さ、小さなアクション用
- md: 40px高さ、標準サイズ
- lg: 48px高さ、重要なアクション用

### 状態
- default: 通常状態
- hover: ホバー状態
- active: アクティブ状態
- disabled: 無効状態
- loading: ローディング状態

## Card仕様
### バリエーション
- default: 基本カードスタイル
- elevated: 高いシャドウ、重要な情報用
- outlined: 境界線強調スタイル

### パディング
- none: パディングなし
- sm: 16px
- md: 24px (デフォルト)
- lg: 32px

### 構成要素
- CardHeader: ヘッダー部分
- CardBody: メインコンテンツ
- CardFooter: フッター部分

## Input仕様
### バリエーション
- default: 標準入力フィールド
- filled: 背景塗りつぶしスタイル
- flushed: アンダーラインのみスタイル

### サイズ
- sm: 32px高さ
- md: 40px高さ (デフォルト)
- lg: 48px高さ

### 状態
- default: 通常状態
- focus: フォーカス状態
- error: エラー状態
- disabled: 無効状態

## Modal仕様
### サイズ
- sm: 400px幅
- md: 500px幅 (デフォルト)
- lg: 800px幅
- xl: 1200px幅

### 構成要素
- Modal: メインコンテナ
- ModalHeader: ヘッダー部分
- ModalBody: メインコンテンツ
- ModalFooter: フッター部分

## Badge仕様
### バリエーション
- success: 成功状態 (緑)
- warning: 警告状態 (黄)
- error: エラー状態 (赤)
- info: 情報状態 (青)
- gray: 中性状態 (グレー)

### サイズ
- sm: 小サイズ
- md: 標準サイズ (デフォルト)
- lg: 大サイズ

## Alert仕様
### バリエーション
- success: 成功メッセージ
- warning: 警告メッセージ
- error: エラーメッセージ
- info: 情報メッセージ

### スタイル
- filled: 背景塗りつぶし
- outlined: 境界線のみ
- subtle: 薄い背景色

## 共通原則
- すべてのコンポーネントはデザイントークンを使用
- アクセシビリティ対応必須
- TypeScript型定義必須
- レスポンシブ対応
- 一貫したAPI設計