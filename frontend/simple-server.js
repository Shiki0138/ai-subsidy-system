const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const server = http.createServer((req, res) => {
  console.log(`リクエスト受信: ${req.url}`);
  
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>AI補助金申請システム - テスト</title>
        <style>
          body { 
            font-family: sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 20px;
            background: #f5f5f5;
          }
          .status { 
            background: #4ade80; 
            color: white; 
            padding: 20px; 
            border-radius: 8px; 
            text-align: center;
            font-size: 24px;
            margin-bottom: 30px;
          }
          .info {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          code {
            background: #f0f0f0;
            padding: 2px 4px;
            border-radius: 3px;
          }
        </style>
      </head>
      <body>
        <div class="status">✅ サーバー接続成功！</div>
        <div class="info">
          <h2>次のステップ</h2>
          <p>Node.jsサーバーは正常に動作しています（ポート: ${PORT}）</p>
          <p>Next.jsの問題を解決するために：</p>
          <ol>
            <li>このウィンドウは開いたままにしてください</li>
            <li>新しいターミナルを開いてください</li>
            <li>以下のコマンドを実行してください：</li>
          </ol>
          <pre><code>cd /Users/leadfive/Desktop/system/ai-subsidy-system
npm install --force
cd frontend
../node_modules/.bin/next dev</code></pre>
        </div>
      </body>
      </html>
    `);
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`
========================================
✅ テストサーバーが起動しました
========================================
URL: http://localhost:${PORT}
========================================
  `);
});

server.on('error', (err) => {
  console.error('サーバーエラー:', err);
});