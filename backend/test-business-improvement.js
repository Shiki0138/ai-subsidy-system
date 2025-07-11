/**
 * 業務改善助成金機能のテストスクリプト
 */

const express = require('express');
const cors = require('cors');

// 簡易サーバーを作成してテスト
const app = express();
app.use(cors());
app.use(express.json());

// 簡易テストルート
app.post('/api/business-improvement-subsidy/generate', (req, res) => {
  console.log('受信データ:', JSON.stringify(req.body, null, 2));
  
  // 模擬的な成功レスポンス
  res.json({
    success: true,
    data: {
      applicationId: 'test-' + Date.now(),
      documents: [
        {
          type: 'FORM1',
          title: '交付申請書（様式第1号）',
          content: `業務改善助成金交付申請書

申請者: ${req.body.companyInfo?.name || '未入力'}
申請コース: ${req.body.wageIncreasePlan?.course || '60'}円コース
申請額: 600,000円

申請内容が正常に受信されました。`,
          format: 'text'
        }
      ]
    }
  });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 業務改善助成金テストサーバー起動中...`);
  console.log(`📍 http://localhost:${PORT}`);
  console.log(`\n✅ テスト用エンドポイント:`);
  console.log(`POST /api/business-improvement-subsidy/generate`);
  console.log(`\n📝 フロントエンドで以下のURLに接続してください:`);
  console.log(`http://localhost:${PORT}/api/business-improvement-subsidy/generate`);
});