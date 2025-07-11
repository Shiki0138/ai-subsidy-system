#!/bin/bash

# ========================================
# 一般的なエラーの自動修正スクリプト
# ========================================
# デプロイ前に実行して一般的な問題を自動修正します

set -e

echo "🔧 一般的なエラーの自動修正を開始します..."
echo "================================================"

# 1. Chart.js依存関係の追加
echo ""
echo "1️⃣ Chart.js依存関係の確認と追加"
cd frontend
if ! grep -q '"chart.js"' package.json; then
    echo "   Chart.jsをインストール中..."
    npm install chart.js react-chartjs-2
    echo "   ✅ Chart.jsをインストールしました"
else
    echo "   ✅ Chart.jsは既にインストール済みです"
fi
cd ..

# 2. TypeScript型エラーの一般的な修正
echo ""
echo "2️⃣ TypeScript型エラーの修正"

# any型の警告を無視する設定
cat > frontend/src/types/global.d.ts << 'EOF'
// グローバル型定義
declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

// 環境変数の型定義
declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_SUPABASE_URL?: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
    SUPABASE_SERVICE_KEY?: string;
    GEMINI_API_KEY?: string;
    NEXT_PUBLIC_API_URL?: string;
    NODE_ENV: 'development' | 'production' | 'test';
  }
}

// Window拡張
interface Window {
  __logger?: any;
}
EOF

echo "   ✅ グローバル型定義を追加しました"

# 3. 環境変数のフォールバック追加
echo ""
echo "3️⃣ 環境変数のフォールバック設定"

# Next.js設定の環境変数フォールバック
cat > frontend/next.config.js << 'EOF'
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  
  // 環境変数のフォールバック
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || '',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // 画像最適化の設定
  images: {
    domains: ['localhost'],
    unoptimized: process.env.NODE_ENV === 'development',
  },
  
  // TypeScriptエラーを警告として扱う（本番ビルド用）
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // ESLintエラーを警告として扱う（本番ビルド用）
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Webpack設定
  webpack: (config, { isServer }) => {
    // SVGサポート
    config.module.rules.push({
      test: /\.svg$/,
      use: ['@svgr/webpack'],
    });
    
    // エイリアス設定
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    return config;
  },
};

module.exports = nextConfig;
EOF

echo "   ✅ Next.js設定を更新しました"

# 4. package.jsonのスクリプト修正
echo ""
echo "4️⃣ package.jsonスクリプトの修正"
cd frontend

# package.jsonにビルドスクリプトを追加
node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

// スクリプトの追加・修正
pkg.scripts = {
  ...pkg.scripts,
  'build': 'next build',
  'build:production': 'NODE_ENV=production next build',
  'type-check': 'tsc --noEmit',
  'lint': 'next lint',
  'pre-deploy': 'npm run type-check && npm run lint && npm run build',
};

// エンジン指定
pkg.engines = {
  'node': '>=18.17.0',
  'npm': '>=9.0.0'
};

fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
console.log('✅ package.jsonを更新しました');
"

cd ..

# 5. .gitignoreの更新
echo ""
echo "5️⃣ .gitignoreの更新"
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
/build
/dist
.next/
out/

# Misc
.DS_Store
*.pem
.vscode/

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Local env files
.env*.local
.env
.env.development
.env.production

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Testing
coverage/
.nyc_output

# Temporary files
*.log
*.swp
*.swo
*~
.idea/
*.iml

# OS files
Thumbs.db

# Backend specific
backend/dist/
backend/uploads/
backend/logs/
backend/.env

# Frontend specific
frontend/.next/
frontend/out/
frontend/.env.local

# Database
*.sqlite
*.sqlite3
prisma/migrations/dev/
EOF

echo "   ✅ .gitignoreを更新しました"

# 6. ESLint設定の作成
echo ""
echo "6️⃣ ESLint設定の作成"
cd frontend

if [ ! -f ".eslintrc.json" ]; then
cat > .eslintrc.json << 'EOF'
{
  "extends": ["next/core-web-vitals"],
  "rules": {
    "@next/next/no-img-element": "off",
    "react-hooks/exhaustive-deps": "warn",
    "@typescript-eslint/no-unused-vars": "warn",
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
EOF
echo "   ✅ ESLint設定を作成しました"
else
echo "   ✅ ESLint設定は既に存在します"
fi

cd ..

# 7. Vercel設定ファイルの作成
echo ""
echo "7️⃣ Vercel設定ファイルの作成"
cat > vercel.json << 'EOF'
{
  "framework": "nextjs",
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "npm install",
  "devCommand": "cd frontend && npm run dev",
  "functions": {
    "frontend/src/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@supabase-url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@supabase-anon-key",
    "SUPABASE_SERVICE_KEY": "@supabase-service-key",
    "GEMINI_API_KEY": "@gemini-api-key"
  }
}
EOF

echo "   ✅ Vercel設定を作成しました"

# 8. ビルド前スクリプトの設定
echo ""
echo "8️⃣ ビルド前スクリプトの設定"
cd frontend

# pre-installスクリプトの作成
cat > scripts/pre-install.js << 'EOF'
#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 ビルド前の準備を実行中...');

// 環境変数ファイルのチェック
if (!fs.existsSync('.env.local') && fs.existsSync('.env.example')) {
  console.log('📝 .env.example から .env.local を作成します...');
  fs.copyFileSync('.env.example', '.env.local');
}

// 必要なディレクトリの作成
const dirs = ['public/uploads', 'public/temp'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 ${dir} ディレクトリを作成しました`);
  }
});

console.log('✅ ビルド前の準備が完了しました');
EOF

chmod +x scripts/pre-install.js

cd ..

echo ""
echo "================================================"
echo "✅ 一般的なエラーの自動修正が完了しました"
echo ""
echo "次のステップ:"
echo "1. ./scripts/pre-deploy-check.sh を実行して再チェック"
echo "2. 問題がなければデプロイを実行"
echo "================================================"