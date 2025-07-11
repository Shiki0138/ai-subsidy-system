# 🚀 AI補助金申請書自動作成システム - セットアップガイド

## 📋 初心者向け完全セットアップガイド

このガイドに従えば、エンジニア初心者でも安全に世界最高レベルのAIシステムを構築できます。

---

## 🛠️ 必要な環境

### システム要件
- **OS**: macOS, Windows 10/11, Ubuntu 20.04+
- **CPU**: 2コア以上推奨
- **メモリ**: 8GB以上推奨
- **ストレージ**: 20GB以上の空き容量

### 必須ソフトウェア
```bash
# Node.js (v20以上)
https://nodejs.org/

# Docker Desktop
https://www.docker.com/products/docker-desktop/

# Git
https://git-scm.com/

# VS Code (推奨エディタ)
https://code.visualstudio.com/
```

---

## 🔧 ステップバイステップ セットアップ

### Step 1: プロジェクトのクローン
```bash
# ターミナルを開いて以下を実行
git clone <your-repository-url>
cd ai-subsidy-system

# ファイル構造を確認
ls -la
```

### Step 2: 環境変数の設定
```bash
# 環境変数ファイルをコピー
cp .env.example .env.local

# エディタで開いて設定
code .env.local
```

**⚠️ 重要: 以下の設定を必ず変更してください**

```bash
# 必須: セキュリティキーを変更
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-super-secret-session-key-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key!!

# 必須: AIモデルのAPIキーを設定
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# データベース設定（開発環境はそのままでOK）
DATABASE_URL=postgresql://postgres:dev_password_change_in_prod@localhost:5432/ai_subsidy_db
```

### Step 3: 依存関係のインストール
```bash
# ルートディレクトリで実行
npm install

# フロントエンドの依存関係
cd frontend && npm install && cd ..

# バックエンドの依存関係
cd backend && npm install && cd ..

# AI エンジンの依存関係
cd ai-engine && npm install && cd ..
```

### Step 4: Dockerサービスの起動
```bash
# データベース・Redis・MinIOを起動
docker-compose -f docker-compose.dev.yml up -d

# サービスの状態確認
docker-compose ps

# 正常起動の確認（全てUpになればOK）
```

**期待される出力:**
```
NAME                    IMAGE               STATUS
ai-subsidy-postgres     postgres:16-alpine  Up
ai-subsidy-redis        redis:7-alpine      Up  
ai-subsidy-minio        minio/minio:latest  Up
```

### Step 5: データベースの初期化
```bash
# バックエンドディレクトリで実行
cd backend

# Prismaクライアント生成
npx prisma generate

# データベースマイグレーション実行
npx prisma migrate dev

# 初期データの投入
npx prisma db seed

# データベースの確認（ブラウザが開きます）
npx prisma studio
```

### Step 6: 開発サーバーの起動
```bash
# ルートディレクトリに戻る
cd ..

# 全サービスを並列起動
npm run dev
```

**期待される出力:**
```
フロントエンド: http://localhost:3000
バックエンドAPI: http://localhost:3001
データベース管理: http://localhost:5555
MinIO管理画面: http://localhost:9001
```

---

## 🔍 動作確認

### 1. フロントエンド確認
ブラウザで `http://localhost:3000` にアクセス
- ログインページが表示される
- ページが正常にロードされる

### 2. バックエンドAPI確認
```bash
# APIの動作確認
curl http://localhost:3001/api/health

# 期待されるレスポンス
{"status":"ok","timestamp":"2024-XX-XX","services":{"database":"connected","redis":"connected"}}
```

### 3. データベース確認
ブラウザで `http://localhost:5555` にアクセス
- Prisma Studio が開く
- テーブル一覧が表示される

---

## 🚨 トラブルシューティング

### よくあるエラーと解決方法

#### 1. Dockerが起動しない
```bash
# Dockerデスクトップが起動しているか確認
docker --version

# Dockerデスクトップを再起動してから再実行
docker-compose down
docker-compose -f docker-compose.dev.yml up -d
```

#### 2. ポートが使用中エラー
```bash
# 使用中のポートを確認
lsof -i :3000
lsof -i :3001
lsof -i :5432

# プロセスを終了（PIDを確認してから）
kill -9 <PID>
```

#### 3. データベース接続エラー
```bash
# PostgreSQLコンテナの状態確認
docker logs ai-subsidy-postgres

# データベースに直接接続して確認
docker exec -it ai-subsidy-postgres psql -U postgres -d ai_subsidy_db

# テーブル一覧表示
\dt
```

#### 4. NPMインストールエラー
```bash
# キャッシュをクリア
npm cache clean --force

# node_modulesを削除して再インストール
rm -rf node_modules package-lock.json
npm install
```

#### 5. 環境変数が読み込まれない
```bash
# ファイル名を確認（.env.local が正しい）
ls -la | grep env

# ファイル権限を確認
chmod 644 .env.local

# 開発サーバーを再起動
npm run dev
```

---

## 🔒 セキュリティチェック

### 開発開始前のセキュリティ確認
```bash
# 脆弱性スキャン
npm audit

# 修正可能な脆弱性を自動修正
npm audit fix

# セキュリティ設定の確認
npm run security:audit
```

### Git設定の確認
```bash
# .gitignoreが正しく設定されているか確認
cat .gitignore

# 以下が含まれていることを確認:
# .env.local
# .env.production
# /node_modules
# /dist
# *.log
```

---

## 📝 開発ワークフロー

### 日常的な開発手順
1. **開発開始時**
   ```bash
   # サービス起動
   docker-compose -f docker-compose.dev.yml up -d
   npm run dev
   ```

2. **コード変更時**
   ```bash
   # 自動リロードで変更が反映される
   # データベーススキーマ変更時のみ以下を実行
   cd backend && npx prisma migrate dev
   ```

3. **開発終了時**
   ```bash
   # サーバー停止（Ctrl+C）
   # Dockerサービス停止
   docker-compose down
   ```

### コミット前のチェック
```bash
# コードフォーマット
npm run lint:fix

# テスト実行
npm run test

# セキュリティチェック
npm run security:audit

# 問題なければコミット
git add .
git commit -m "feat: 新機能追加"
```

---

## 🎯 次のステップ

セットアップが完了したら、以下の順序で開発を進めてください：

### 1. 認証システムの実装
- `/backend/src/routes/auth.ts` の実装
- `/frontend/src/app/auth/` コンポーネントの作成

### 2. ユーザープロフィール機能
- 企業情報入力フォームの実装
- プロフィール管理API の作成

### 3. AI生成機能の基礎
- OpenAI API 統合のテスト
- 簡単な文書生成の実装

### 4. 補助金情報管理
- 補助金データの登録・管理機能
- 管理者画面の実装

---

## 📞 サポート

### 開発中に困ったら

1. **エラーログの確認**
   ```bash
   # アプリケーションログ
   docker-compose logs -f
   
   # 特定のサービスのログ
   docker-compose logs ai-subsidy-postgres
   ```

2. **デバッグ情報の確認**
   ```bash
   # 環境変数の確認
   printenv | grep AI_SUBSIDY
   
   # プロセス状況の確認
   ps aux | grep node
   ```

3. **リセット手順**
   ```bash
   # 完全リセット（データは削除されます）
   docker-compose down -v
   rm -rf node_modules
   npm run setup
   ```

---

## ✅ セットアップ完了チェックリスト

- [ ] Node.js 20+ がインストールされている
- [ ] Docker Desktop が起動している
- [ ] プロジェクトがクローンされている
- [ ] 環境変数（.env.local）が設定されている
- [ ] APIキーが設定されている
- [ ] npm install が全て完了している
- [ ] Dockerサービスが起動している（postgres, redis, minio）
- [ ] データベースマイグレーションが完了している
- [ ] フロントエンド（localhost:3000）にアクセスできる
- [ ] バックエンドAPI（localhost:3001）が応答する
- [ ] セキュリティチェックが通る

全てチェックがついたら、開発を開始する準備完了です！

---

**🎉 おめでとうございます！**
**世界最高レベルのAI補助金申請書自動作成システムの開発環境が完成しました。**
**次は実際のコード実装に進みましょう！**