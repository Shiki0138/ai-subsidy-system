// 簡単なテストサーバー
const http = require('http');
const PORT = 7003;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>テスト</title>
    </head>
    <body>
      <h1>Node.jsサーバーは正常に動作しています！</h1>
      <p>ポート: ${PORT}</p>
    </body>
    </html>
  `);
});

server.listen(PORT, () => {
  console.log(`テストサーバーが起動しました: http://localhost:${PORT}`);
});