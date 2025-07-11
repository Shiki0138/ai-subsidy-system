# 🚀 デプロイメントチェックリスト

このドキュメントは、Vercel/Hugging Faceへのデプロイ前に確認すべき項目をまとめています。

## 📋 開発環境での事前確認事項

### 1. 基本動作確認
- [ ] `npm run dev` でフロントエンドが起動する
- [ ] トップページが正しく表示される
- [ ] 各補助金申請ボタンが404エラーなく動作する
- [ ] 法人番号入力→「反映」ボタンで企業情報が取得される
- [ ] 申請書作成フローが最後まで完了する

### 2. 機能確認
- [ ] **Gemini API統合**: 申請書生成時にAIが動作する（モックモード含む）
- [ ] **統計グラフ**: ダッシュボードにグラフが表示される
- [ ] **自動保存**: フォーム入力が自動保存される
- [ ] **通知機能**: 通知APIが正しく動作する
- [ ] **テンプレート**: テンプレートの保存・適用が動作する

### 3. エラーチェック
- [ ] ブラウザコンソールにエラーが出ていない
- [ ] ネットワークタブで404エラーが発生していない
- [ ] TypeScriptのコンパイルエラーがない

## 🔧 デプロイ前の自動チェック

### 実行コマンド
```bash
# 1. 自動チェックスクリプトの実行
./scripts/pre-deploy-check.sh

# 2. エラーが出た場合は自動修正を試みる
./scripts/fix-common-errors.sh

# 3. 再度チェックを実行
./scripts/pre-deploy-check.sh
```

### チェック項目
1. **Node.jsバージョン** (>= 18.17.0)
2. **必須ファイルの存在**
3. **環境変数の設定**
4. **依存関係の整合性**
5. **TypeScriptコンパイル**
6. **ビルドテスト**
7. **ESLintチェック**
8. **不要ファイルの除外**
9. **ハードコーディングの検出**
10. **APIエンドポイントの確認**

## 🌐 Vercelへのデプロイ

### 環境変数の設定
Vercelダッシュボードで以下の環境変数を設定：

```env
# Supabase（必須）
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# AI API（オプション - 未設定時はモックモード）
GEMINI_API_KEY=your-gemini-api-key

# API URL（オプション）
NEXT_PUBLIC_API_URL=https://your-api-url.vercel.app
```

### ビルド設定
- **Framework Preset**: Next.js
- **Build Command**: `cd frontend && npm install && npm run build`
- **Output Directory**: `frontend/.next`
- **Install Command**: `npm install`

### よくあるエラーと対処法

#### 1. Chart.js関連のエラー
```bash
Error: Cannot find module 'chart.js'
```
**対処法**: 
```bash
cd frontend && npm install chart.js react-chartjs-2
```

#### 2. TypeScriptエラー
```bash
Type error: Cannot find name 'Window'
```
**対処法**: `global.d.ts`ファイルが正しく配置されているか確認

#### 3. 環境変数エラー
```bash
Error: Missing environment variables
```
**対処法**: Vercelダッシュボードで環境変数を設定

#### 4. ビルドメモリ不足
```bash
Error: JavaScript heap out of memory
```
**対処法**: 
```json
{
  "scripts": {
    "build": "NODE_OPTIONS='--max-old-space-size=4096' next build"
  }
}
```

## 🤗 Hugging Face Spacesへのデプロイ

### Dockerfileの作成
```dockerfile
FROM node:18-alpine

WORKDIR /app

# フロントエンドのビルド
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

COPY frontend ./frontend
RUN cd frontend && npm run build

# ポート設定
EXPOSE 7860

# 起動コマンド
CMD ["npm", "run", "start", "--prefix", "frontend"]
```

### app.pyの作成（Gradio対応）
```python
import subprocess
import gradio as gr

def run_nextjs():
    subprocess.Popen(["npm", "run", "start", "--prefix", "frontend"])
    return "Next.js app is running on port 3000"

iface = gr.Interface(fn=run_nextjs, inputs=[], outputs="text")
iface.launch(server_port=7860)
```

## 📝 デプロイ後の確認

### 1. 基本動作テスト
- [ ] サイトにアクセスできる
- [ ] 各ページが正しく表示される
- [ ] APIエンドポイントが動作する

### 2. 機能テスト
- [ ] 法人番号APIが動作する（またはモックが動作）
- [ ] 申請書生成が完了する
- [ ] グラフが表示される

### 3. パフォーマンステスト
- [ ] ページ読み込み速度が適切
- [ ] APIレスポンスが適切

## 🆘 トラブルシューティング

### ログの確認方法
**Vercel**:
```bash
vercel logs production
```

**Hugging Face**:
Spaces内のLogsタブで確認

### サポート
問題が解決しない場合は、以下を確認：
1. エラーメッセージの詳細
2. ブラウザコンソールのエラー
3. ネットワークタブのエラー
4. デプロイログ

## 🎯 最終チェック

デプロイ前に必ず実行：
```bash
# 完全なチェックフロー
cd /path/to/ai-subsidy-system

# 1. クリーンインストール
rm -rf frontend/node_modules backend/node_modules
cd frontend && npm install && cd ..
cd backend && npm install && cd ..

# 2. セルフチェック実行
./scripts/pre-deploy-check.sh

# 3. エラーがあれば修正
./scripts/fix-common-errors.sh

# 4. 最終ビルドテスト
cd frontend && npm run build

# 5. すべて成功したらデプロイ
```

このチェックリストに従えば、デプロイ時のエラーを最小限に抑えることができます。