// 最もシンプルなテスト
const http = require('http');

console.log('Starting server...');

const server = http.createServer((req, res) => {
  console.log('Request received:', req.url);
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Node.js!\n');
});

server.listen(9999, '0.0.0.0', () => {
  console.log('Server is running on http://0.0.0.0:9999');
  console.log('Try: http://localhost:9999');
});

server.on('error', (err) => {
  console.error('Server error:', err);
  if (err.code === 'EADDRINUSE') {
    console.log('Port 9999 is already in use');
  }
});

// Keep the process alive
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    process.exit(0);
  });
});