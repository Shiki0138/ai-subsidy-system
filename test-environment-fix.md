# 🔧 テスト環境CSPエラー解決ガイド

**問題**: Content Security Policy エラーでAPIへの接続が拒否される

## 🚀 即座の解決方法

### 1. バックエンドサーバーを起動
```bash
# バックエンドサーバーを別ターミナルで起動
cd /Users/MBP/ai-subsidy-system/backend
npm run dev

# または簡易APIサーバーを起動
node simple-api.js
```

### 2. フロントエンドサーバーを再起動
```bash
# 設定変更後にフロントエンドを再起動
cd /Users/MBP/ai-subsidy-system/frontend
npm run dev
```

## 🔧 修正済み設定

### `next.config.js` - CSP設定修正済み
```javascript
// 開発環境でlocalhost:3001への接続を許可
value: isDev 
  ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' http://localhost:3001 ws://localhost:3000;"
  : "production CSP settings"
```

## 🔍 エラー原因の確認方法

### 1. バックエンドサーバー状態確認
```bash
# バックエンドが起動しているか確認
curl http://localhost:3001/api/health

# 期待される応答
{"status":"healthy","timestamp":"2025-06-17T..."}
```

### 2. フロントエンドの環境変数確認
```bash
# .env.localファイルの確認
cat /Users/MBP/ai-subsidy-system/frontend/.env.local

# API_URLが正しく設定されているか確認
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## 🛠️ 完全な解決手順

### 手順1: 両サーバーを正しい順序で起動
```bash
# 1. バックエンドを先に起動（ターミナル1）
cd /Users/MBP/ai-subsidy-system/backend
npm run dev

# 2. フロントエンドを起動（ターミナル2）  
cd /Users/MBP/ai-subsidy-system/frontend
npm run dev
```

### 手順2: ブラウザのキャッシュクリア
```
Chrome DevTools → Application → Storage → Clear storage
または
Cmd + Shift + R でハードリフレッシュ
```

### 手順3: ネットワークタブで確認
```
Chrome DevTools → Network → fetch/XHR
APIリクエストが正常に送信されているか確認
```

## 🚨 トラブルシューティング

### エラーパターン1: "Failed to fetch"
**原因**: バックエンドサーバーが起動していない
**解決**: `cd backend && npm run dev`

### エラーパターン2: "Refused to connect"
**原因**: CSP設定でlocalhost:3001が許可されていない
**解決**: 修正済み（next.config.js更新）

### エラーパターン3: CORS エラー
**原因**: バックエンドのCORS設定
**解決**: バックエンドで `cors: { origin: 'http://localhost:3000' }` 設定

## 🔄 開発環境セットアップ（推奨）

### tmux使用での同時起動
```bash
# tmuxセッション開始
tmux new-session -s ai-dev

# ペイン分割
tmux split-window -h

# 左ペイン: バックエンド
tmux send-keys -t 0 'cd backend && npm run dev' C-m

# 右ペイン: フロントエンド
tmux send-keys -t 1 'cd frontend && npm run dev' C-m
```

### package.jsonスクリプト使用
```bash
# ルートディレクトリから両方を起動
cd /Users/MBP/ai-subsidy-system
npm run dev  # バックエンド・フロントエンド同時起動
```

## ✅ 解決確認方法

### 1. APIヘルスチェック
```bash
curl http://localhost:3001/api/health
```

### 2. フロントエンドのログイン試行
```
http://localhost:3000/auth/login
demo@demo.com / demo123
```

### 3. ネットワークタブで成功応答確認
```
Status: 200 OK
Response: {"success": true, "data": {...}}
```

---

**この設定により、開発環境でのCSPエラーは解決されます。**
**本番環境では自動的に厳しいCSP設定が適用されます。**