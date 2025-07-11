#!/bin/bash
# スタンドアロンでNext.jsを起動

# Next.jsを直接実行
cd /Users/leadfive/Desktop/system/ai-subsidy-system/frontend

# node_modulesの場所を確認
if [ -d "../node_modules" ]; then
    echo "親ディレクトリのnode_modulesを使用"
    NODE_PATH="../node_modules" ../node_modules/.bin/next dev -p 7002
else
    echo "ローカルのnode_modulesを使用"
    ./node_modules/.bin/next dev -p 7002
fi