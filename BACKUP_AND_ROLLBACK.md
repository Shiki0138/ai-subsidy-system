# 📦 バックアップとロールバック計画

## 🔄 デプロイ前のバックアップ

### 1. コードのバックアップ
```bash
# Gitでタグを作成
git tag -a v1.0.0-pre-deploy -m "本番デプロイ前のバックアップ"
git push origin v1.0.0-pre-deploy

# ローカルバックアップ
tar -czf ai-subsidy-system-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  --exclude=node_modules \
  --exclude=.next \
  --exclude=dist \
  .
```

### 2. データベースのバックアップ（Supabase）
1. Supabaseダッシュボード → Settings → Database
2. "Backups" タブから手動バックアップを作成
3. バックアップIDを記録

### 3. 環境変数のバックアップ
```bash
# 環境変数を安全な場所に保存
cp frontend/.env.local frontend/.env.local.backup-$(date +%Y%m%d)
# パスワードマネージャーや安全なストレージに保管
```

## 🚨 ロールバック手順

### Vercelでのロールバック

#### 方法1: Vercelダッシュボードから
1. Vercelダッシュボード → プロジェクト選択
2. "Deployments" タブ
3. 以前の安定版デプロイメントを見つける
4. "..." メニュー → "Promote to Production"

#### 方法2: CLIから
```bash
# デプロイメント一覧を確認
vercel list

# 特定のデプロイメントにロールバック
vercel rollback [deployment-url]
```

### 緊急時の対応

#### 1. 即座のロールバック（5分以内）
```bash
# 最新のデプロイメントを確認
vercel list --limit 5

# 前のバージョンに戻す
vercel rollback
```

#### 2. データベースのロールバック
```sql
-- Supabaseダッシュボードから実行
-- 特定の時点に戻す
SELECT * FROM pg_restore_point('backup_point_name');
```

#### 3. 環境変数の復元
```bash
# Vercel CLI経由
vercel env pull
# バックアップから復元
cp frontend/.env.local.backup-YYYYMMDD frontend/.env.local
vercel env add
```

## 📋 ロールバックチェックリスト

### 即座に確認すること
- [ ] サイトがアクセス可能か
- [ ] 主要機能が動作するか
- [ ] エラーログを確認
- [ ] ユーザーからの報告

### ロールバック判断基準
以下のいずれかに該当する場合、即座にロールバック：
1. サイトが完全にダウン
2. 認証システムが機能しない
3. データ損失のリスク
4. 重大なセキュリティ脆弱性
5. 主要機能の50%以上が動作しない

### ロールバック後の対応
1. **原因調査**
   ```bash
   # ログの確認
   vercel logs --since 1h
   
   # エラーの詳細確認
   vercel inspect [deployment-id]
   ```

2. **修正とテスト**
   - ローカルで問題を再現
   - 修正を実装
   - 統合テストを実施

3. **段階的な再デプロイ**
   - プレビュー環境でテスト
   - 一部のユーザーのみに公開
   - 問題がなければ全体に展開

## 🔧 トラブルシューティング

### よくある問題と対処法

#### 1. ビルドエラー
```bash
# キャッシュをクリアして再ビルド
vercel --force
```

#### 2. 環境変数の問題
```bash
# 環境変数を再設定
vercel env rm VARIABLE_NAME
vercel env add VARIABLE_NAME
```

#### 3. データベース接続エラー
- Supabaseのコネクションプールを確認
- IPアドレスのホワイトリスト設定
- 接続文字列の確認

## 📞 緊急連絡先

### チーム内連絡
- **開発リーダー**: [連絡先]
- **インフラ担当**: [連絡先]
- **プロダクトマネージャー**: [連絡先]

### 外部サポート
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io

## 🎯 ベストプラクティス

1. **常にバックアップを取る**
2. **小さな変更を頻繁にデプロイ**
3. **カナリアリリースの活用**
4. **監視とアラートの設定**
5. **ロールバック訓練の実施**

このドキュメントを印刷して、デプロイ時に手元に置いておくことを推奨します。