#!/bin/bash

# 認証ミドルウェアをconditionalAuthに更新するスクリプト

echo "🔧 認証ミドルウェアを開発用に更新中..."

# バックアップディレクトリを作成
mkdir -p backup-routes

# 各ルートファイルをバックアップして更新
for file in src/routes/*.ts; do
  if [[ -f "$file" ]]; then
    filename=$(basename "$file")
    
    # authルートとhealthルートは除外
    if [[ "$filename" == "auth.ts" ]] || [[ "$filename" == "health.ts" ]] || [[ "$filename" == "devAuth.ts" ]]; then
      continue
    fi
    
    # バックアップ
    cp "$file" "backup-routes/$filename.bak"
    
    # sedで更新
    # 1. import文の追加
    sed -i '' '1a\
import { conditionalAuth } from '"'"'../middleware/devAuthBypass'"'"';\
' "$file"
    
    # 2. authenticateをconditionalAuth(authenticate)に置換
    sed -i '' 's/, authenticate,/, conditionalAuth(authenticate),/g' "$file"
    sed -i '' 's/, authenticate)/, conditionalAuth(authenticate))/g' "$file"
    
    echo "✅ $filename を更新しました"
  fi
done

echo "🎉 認証ミドルウェアの更新が完了しました！"
echo "💡 元のファイルは backup-routes/ にバックアップされています"