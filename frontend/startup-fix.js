// 開発環境起動修正スクリプト
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 AI補助金申請システム 開発環境起動中...');
console.log('📁 作業ディレクトリ:', process.cwd());

// node_modulesの確認
const localNodeModules = path.join(__dirname, 'node_modules');
const parentNodeModules = path.join(__dirname, '..', 'node_modules');

let nodeModulesPath;
let nextBinPath;

if (fs.existsSync(localNodeModules)) {
  console.log('✅ ローカルのnode_modulesを使用');
  nodeModulesPath = localNodeModules;
  nextBinPath = path.join(localNodeModules, '.bin', 'next');
} else if (fs.existsSync(parentNodeModules)) {
  console.log('✅ 親ディレクトリのnode_modulesを使用');
  nodeModulesPath = parentNodeModules;
  nextBinPath = path.join(parentNodeModules, '.bin', 'next');
} else {
  console.error('❌ node_modulesが見つかりません');
  console.log('以下のコマンドを実行してください:');
  console.log('npm install');
  process.exit(1);
}

// .nextディレクトリをクリア
const nextDir = path.join(__dirname, '.next');
if (fs.existsSync(nextDir)) {
  console.log('🧹 .nextキャッシュをクリア中...');
  fs.rmSync(nextDir, { recursive: true, force: true });
}

// 環境変数設定
const env = {
  ...process.env,
  NODE_ENV: 'development',
  NEXT_TELEMETRY_DISABLED: '1',
  NODE_OPTIONS: '--max-old-space-size=4096'
};

console.log('🔧 Next.js起動パラメータ:');
console.log('  - ポート: 7002');
console.log('  - Next.jsバイナリ:', nextBinPath);

// Next.js起動
const next = spawn('node', [nextBinPath, 'dev', '-p', '7002'], {
  cwd: __dirname,
  env: env,
  stdio: 'inherit'
});

next.on('error', (err) => {
  console.error('❌ 起動エラー:', err);
  console.log('\n📋 トラブルシューティング:');
  console.log('1. npm install を実行');
  console.log('2. rm -rf .next を実行');
  console.log('3. node --version で Node.js 18+ を確認');
});

next.on('close', (code) => {
  console.log(`🛑 Next.jsが終了しました。コード: ${code}`);
});

// 起動成功メッセージ
setTimeout(() => {
  console.log('\n🌟 起動成功の場合、以下のURLでアクセスできます:');
  console.log('📍 http://localhost:7002 (トップページ)');
  console.log('📍 http://localhost:7002/admin/pdf-templates (PDF管理)');
  console.log('📍 http://localhost:7002/dashboard (ダッシュボード)');
  console.log('📍 http://localhost:7002/pdf-filler-demo (PDFデモ)');
}, 3000);