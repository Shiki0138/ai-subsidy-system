#!/usr/bin/env node

/**
 * 503エラー監視スクリプト
 * Gemini APIの状態を定期的にチェック
 */

const https = require('https');

const checkGeminiAPI = async () => {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GEMINI_API_KEY not set');
    return false;
  }

  const testPrompt = 'Hello';
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const data = JSON.stringify({
    contents: [{
      parts: [{
        text: testPrompt
      }]
    }]
  });

  return new Promise((resolve) => {
    const req = https.request(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      console.log(`Status: ${res.statusCode}`);
      
      if (res.statusCode === 200) {
        console.log('✅ Gemini API is operational');
        resolve(true);
      } else if (res.statusCode === 503) {
        console.log('⚠️  Gemini API is overloaded (503)');
        resolve(false);
      } else {
        console.log(`❌ Unexpected status: ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (e) => {
      console.error(`❌ Request error: ${e.message}`);
      resolve(false);
    });

    req.write(data);
    req.end();
  });
};

// 5分ごとにチェック
const monitor = async () => {
  console.log(`\n[${new Date().toISOString()}] Checking Gemini API status...`);
  const isHealthy = await checkGeminiAPI();
  
  if (!isHealthy) {
    console.log('🔄 Recommendation: Switch to template mode');
  }
};

// 初回実行
monitor();

// 定期実行（5分ごと）
setInterval(monitor, 5 * 60 * 1000);

console.log('🔍 Monitoring Gemini API status (Ctrl+C to stop)...');