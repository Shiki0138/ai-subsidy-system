// シンプルなNext.js起動スクリプト
const { spawn } = require('child_process');
const path = require('path');

console.log('Next.jsサーバーを起動中...');
console.log('作業ディレクトリ:', process.cwd());

// 環境変数を設定
process.env.NODE_ENV = 'development';

// Next.jsを起動
const nextPath = path.join(__dirname, '..', 'node_modules', '.bin', 'next');
const next = spawn(nextPath, ['dev', '-p', '3000'], {
  cwd: __dirname,
  env: process.env,
  stdio: 'inherit'
});

next.on('error', (err) => {
  console.error('起動エラー:', err);
});

next.on('close', (code) => {
  console.log(`Next.jsが終了しました。コード: ${code}`);
});