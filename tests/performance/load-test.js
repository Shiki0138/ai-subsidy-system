/**
 * Performance Load Testing Suite
 * パフォーマンス負荷テストスイート
 * 作成日: 2025-06-20
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// カスタムメトリクス定義
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// テスト設定
export const options = {
  scenarios: {
    // 通常負荷テスト
    normal_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '5m', target: 100 },   // 5分で100ユーザーまで増加
        { duration: '10m', target: 100 },  // 10分間維持
        { duration: '5m', target: 0 },     // 5分で0まで減少
      ],
      exec: 'normalLoadTest',
    },
    
    // スパイクテスト
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 50 },
        { duration: '30s', target: 500 },  // 急激に増加
        { duration: '1m', target: 500 },
        { duration: '30s', target: 50 },   // 急激に減少
        { duration: '1m', target: 0 },
      ],
      exec: 'spikeTest',
      startTime: '25m',
    },
    
    // ストレステスト
    stress_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10m', target: 200 },
        { duration: '20m', target: 200 },
        { duration: '10m', target: 400 },
        { duration: '20m', target: 400 },
        { duration: '10m', target: 0 },
      ],
      exec: 'stressTest',
      startTime: '30m',
    },
    
    // AI処理特化テスト
    ai_processing_test: {
      executor: 'constant-vus',
      vus: 50,
      duration: '15m',
      exec: 'aiProcessingTest',
      startTime: '90m',
    },
  },
  
  thresholds: {
    http_req_duration: ['p(95)<3000'], // 95%のリクエストが3秒以内
    http_req_failed: ['rate<0.01'],    // エラー率1%未満
    errors: ['rate<0.01'],
    'http_req_duration{scenario:ai_processing_test}': ['p(95)<30000'], // AI処理は30秒以内
  },
};

// テストデータ
const testData = {
  companies: [
    {
      name: '株式会社テスト製造1',
      businessType: '製造業',
      employeeCount: 50,
      annualRevenue: 500000000
    },
    {
      name: '中小IT企業株式会社2',
      businessType: '情報通信業',
      employeeCount: 30,
      annualRevenue: 200000000
    }
  ],
  
  projects: [
    {
      name: 'DX推進プロジェクト',
      description: '製造工程のデジタル化による生産性向上',
      budget: 10000000,
      duration: 12
    },
    {
      name: 'ITシステム刷新',
      description: '基幹システムの近代化',
      budget: 15000000,
      duration: 18
    }
  ],
  
  kpiData: [
    { productivity: 150, efficiency: 130, quality: 110 },
    { productivity: 140, efficiency: 125, quality: 105 }
  ]
};

// 認証トークン取得
function authenticate() {
  const response = http.post('http://localhost:3000/api/auth/login', {
    email: 'loadtest@example.com',
    password: 'loadtest123'
  });
  
  return check(response, {
    'authentication successful': (r) => r.status === 200,
  }) ? response.json().token : null;
}

// 通常負荷テスト
export function normalLoadTest() {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // 企業情報入力
  const companyData = testData.companies[Math.floor(Math.random() * testData.companies.length)];
  let response = http.post('http://localhost:3000/api/companies', JSON.stringify(companyData), { headers });
  
  const companyCreated = check(response, {
    'company creation status is 201': (r) => r.status === 201,
    'company creation response time < 2s': (r) => r.timings.duration < 2000,
  });
  
  if (!companyCreated) {
    errorRate.add(1);
    return;
  }
  
  const companyId = response.json().id;
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  sleep(1);
  
  // マッチング実行
  response = http.get(`http://localhost:3000/api/matching/${companyId}`, { headers });
  
  check(response, {
    'matching status is 200': (r) => r.status === 200,
    'matching response time < 5s': (r) => r.timings.duration < 5000,
    'matching score exists': (r) => r.json().score !== undefined,
  });
  
  responseTime.add(response.timings.duration);
  requestCount.add(1);
  
  sleep(2);
  
  // 申請書生成
  const projectData = testData.projects[Math.floor(Math.random() * testData.projects.length)];
  response = http.post(`http://localhost:3000/api/applications/generate`, JSON.stringify({
    companyId: companyId,
    project: projectData
  }), { headers });
  
  const applicationGenerated = check(response, {
    'application generation status is 201': (r) => r.status === 201,
    'application generation response time < 30s': (r) => r.timings.duration < 30000,
  });
  
  if (applicationGenerated) {
    responseTime.add(response.timings.duration);
  } else {
    errorRate.add(1);
  }
  
  requestCount.add(1);
  sleep(1);
}

// スパイクテスト（急激な負荷増加）
export function spikeTest() {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // 軽量なAPIエンドポイントを大量実行
  const endpoints = [
    'http://localhost:3000/api/health',
    'http://localhost:3000/api/companies?page=1&limit=10',
    'http://localhost:3000/api/guidelines',
    'http://localhost:3000/api/applications?status=draft'
  ];
  
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(endpoint, { headers });
  
  check(response, {
    'spike test status is 200': (r) => r.status === 200,
    'spike test response time < 1s': (r) => r.timings.duration < 1000,
  });
  
  responseTime.add(response.timings.duration);
  requestCount.add(1);
}

// ストレステスト（高負荷継続）
export function stressTest() {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // 複数のAPIを順次実行
  const testScenarios = [
    () => {
      // 自動入力テスト
      const response = http.post('http://localhost:3000/api/auto-fill/suggestions', JSON.stringify({
        applicationId: 'test-app-1',
        sections: ['basic_info', 'project_details']
      }), { headers });
      
      return check(response, {
        'auto-fill suggestions status is 200': (r) => r.status === 200,
        'auto-fill response time < 10s': (r) => r.timings.duration < 10000,
      });
    },
    
    () => {
      // 進捗管理テスト
      const response = http.post('http://localhost:3000/api/projects/test-project/progress', JSON.stringify({
        overallProgress: Math.floor(Math.random() * 100),
        currentPhase: 'development',
        lastUpdated: new Date().toISOString()
      }), { headers });
      
      return check(response, {
        'progress update status is 200 or 201': (r) => r.status === 200 || r.status === 201,
        'progress update response time < 3s': (r) => r.timings.duration < 3000,
      });
    },
    
    () => {
      // 書類生成テスト
      const response = http.post('http://localhost:3000/api/documents/generate', JSON.stringify({
        documentType: 'estimate',
        data: {
          companyName: 'ストレステスト企業',
          projectName: 'ストレステストプロジェクト'
        }
      }), { headers });
      
      return check(response, {
        'document generation status is 201': (r) => r.status === 201,
        'document generation response time < 15s': (r) => r.timings.duration < 15000,
      });
    }
  ];
  
  const scenario = testScenarios[Math.floor(Math.random() * testScenarios.length)];
  const success = scenario();
  
  if (!success) {
    errorRate.add(1);
  }
  
  requestCount.add(1);
  sleep(0.5);
}

// AI処理特化テスト
export function aiProcessingTest() {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // AI重処理のテスト
  const aiTests = [
    () => {
      // 募集要項解析テスト
      const guidelineContent = `
        ものづくり補助金（一般型）
        
        1. 補助対象者: 中小企業・小規模事業者
        2. 補助率・補助上限額: 補助率：1/2、補助上限額：1,250万円
        3. 補助対象経費: 機械装置・システム構築費、技術導入費
        4. 実施期間: 交付決定日から10か月以内
      `;
      
      const response = http.post('http://localhost:3000/api/guidelines/parse', JSON.stringify({
        content: guidelineContent
      }), { headers });
      
      return check(response, {
        'guideline parsing status is 200': (r) => r.status === 200,
        'guideline parsing response time < 20s': (r) => r.timings.duration < 20000,
        'parsing result has required fields': (r) => {
          const result = r.json();
          return result.subsidyName && result.subsidyRate && result.maxAmount;
        }
      });
    },
    
    () => {
      // 申請書自動生成テスト（AI使用）
      const companyData = testData.companies[Math.floor(Math.random() * testData.companies.length)];
      const projectData = testData.projects[Math.floor(Math.random() * testData.projects.length)];
      
      const response = http.post('http://localhost:3000/api/applications/ai-generate', JSON.stringify({
        company: companyData,
        project: projectData,
        useAdvancedAI: true
      }), { headers });
      
      return check(response, {
        'AI application generation status is 201': (r) => r.status === 201,
        'AI generation response time < 30s': (r) => r.timings.duration < 30000,
        'generated content length > 500': (r) => {
          const result = r.json();
          return result.content && result.content.length > 500;
        }
      });
    },
    
    () => {
      // 結果報告書AI生成テスト
      const kpiData = testData.kpiData[Math.floor(Math.random() * testData.kpiData.length)];
      
      const response = http.post('http://localhost:3000/api/reports/ai-generate', JSON.stringify({
        reportType: 'final-report',
        kpiAchievements: kpiData,
        useNarrativeGeneration: true
      }), { headers });
      
      return check(response, {
        'AI report generation status is 201': (r) => r.status === 201,
        'AI report response time < 25s': (r) => r.timings.duration < 25000,
        'report has narrative content': (r) => {
          const result = r.json();
          return result.narrative && result.narrative.length > 200;
        }
      });
    }
  ];
  
  const aiTest = aiTests[Math.floor(Math.random() * aiTests.length)];
  const success = aiTest();
  
  if (!success) {
    errorRate.add(1);
  }
  
  requestCount.add(1);
  sleep(2);
}

// データベース負荷テスト
export function databaseLoadTest() {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  
  // 大量データ操作のテスト
  const operations = [
    () => {
      // 複雑な検索クエリ
      const response = http.get(
        'http://localhost:3000/api/applications/search?q=DX&status=all&sortBy=created_at&limit=100',
        { headers }
      );
      
      return check(response, {
        'complex search status is 200': (r) => r.status === 200,
        'complex search response time < 5s': (r) => r.timings.duration < 5000,
      });
    },
    
    () => {
      // 一括データ更新
      const bulkData = Array.from({ length: 10 }, (_, i) => ({
        id: `bulk-test-${i}`,
        status: 'updated',
        lastModified: new Date().toISOString()
      }));
      
      const response = http.put('http://localhost:3000/api/applications/bulk-update', 
        JSON.stringify({ updates: bulkData }), { headers });
      
      return check(response, {
        'bulk update status is 200': (r) => r.status === 200,
        'bulk update response time < 8s': (r) => r.timings.duration < 8000,
      });
    },
    
    () => {
      // 統計データ取得
      const response = http.get('http://localhost:3000/api/analytics/dashboard', { headers });
      
      return check(response, {
        'analytics status is 200': (r) => r.status === 200,
        'analytics response time < 10s': (r) => r.timings.duration < 10000,
        'analytics has required metrics': (r) => {
          const result = r.json();
          return result.totalApplications !== undefined && result.successRate !== undefined;
        }
      });
    }
  ];
  
  const operation = operations[Math.floor(Math.random() * operations.length)];
  const success = operation();
  
  if (!success) {
    errorRate.add(1);
  }
  
  requestCount.add(1);
  sleep(1);
}

// ファイルアップロード負荷テスト
export function fileUploadTest() {
  const token = authenticate();
  if (!token) {
    errorRate.add(1);
    return;
  }
  
  // モックファイルデータ（PDF形式のシミュレーション）
  const mockPdfData = 'A'.repeat(1024 * 1024); // 1MB のモックデータ
  
  const response = http.post('http://localhost:3000/api/documents/upload', {
    file: http.file(mockPdfData, 'test-document.pdf', 'application/pdf'),
    documentType: 'evidence',
    description: 'Load test file upload'
  }, {
    headers: {
      'Authorization': `Bearer ${token}`,
    }
  });
  
  const uploadSuccess = check(response, {
    'file upload status is 201': (r) => r.status === 201,
    'file upload response time < 15s': (r) => r.timings.duration < 15000,
    'upload response has file URL': (r) => {
      const result = r.json();
      return result.fileUrl !== undefined;
    }
  });
  
  if (!uploadSuccess) {
    errorRate.add(1);
  }
  
  requestCount.add(1);
  sleep(1);
}

// テスト結果の詳細ログ出力
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    test_duration: data.state.testRunDurationMs,
    scenarios: Object.keys(data.metrics).filter(key => key.includes('scenario')),
    
    performance_metrics: {
      total_requests: data.metrics.requests?.values?.count || 0,
      failed_requests: data.metrics.http_req_failed?.values?.rate || 0,
      average_response_time: data.metrics.http_req_duration?.values?.avg || 0,
      p95_response_time: data.metrics.http_req_duration?.values['p(95)'] || 0,
      p99_response_time: data.metrics.http_req_duration?.values['p(99)'] || 0,
    },
    
    thresholds_passed: Object.entries(data.thresholds)
      .reduce((acc, [key, value]) => {
        acc[key] = value.ok;
        return acc;
      }, {}),
    
    recommendations: []
  };
  
  // 推奨事項の生成
  if (summary.performance_metrics.failed_requests > 0.01) {
    summary.recommendations.push('Error rate exceeds 1% - investigate server stability');
  }
  
  if (summary.performance_metrics.p95_response_time > 3000) {
    summary.recommendations.push('95th percentile response time exceeds 3s - optimize performance');
  }
  
  if (summary.performance_metrics.average_response_time > 1000) {
    summary.recommendations.push('Average response time exceeds 1s - consider caching or optimization');
  }
  
  // JSON レポートとしてファイル出力
  return {
    'load-test-report.json': JSON.stringify(summary, null, 2),
    'load-test-summary.txt': `
=== LOAD TEST SUMMARY ===
Test Duration: ${summary.test_duration}ms
Total Requests: ${summary.performance_metrics.total_requests}
Failed Requests: ${(summary.performance_metrics.failed_requests * 100).toFixed(2)}%
Average Response Time: ${summary.performance_metrics.average_response_time.toFixed(2)}ms
P95 Response Time: ${summary.performance_metrics.p95_response_time.toFixed(2)}ms
P99 Response Time: ${summary.performance_metrics.p99_response_time.toFixed(2)}ms

=== RECOMMENDATIONS ===
${summary.recommendations.length > 0 ? summary.recommendations.join('\n') : 'No issues detected - system performing well!'}
    `
  };
}