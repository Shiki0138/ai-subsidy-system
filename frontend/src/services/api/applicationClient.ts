/**
 * 申請書作成API クライアント
 */

export interface ApplicationRequest {
  title: string;
  subsidyType: string;
  companyInfo: {
    companyName: string;
    industry: string;
    employeeCount: string;
    businessDescription: string;
    address: string;
    phone: string;
    website: string;
    corporateNumber?: string;
  };
  businessPlan: string;
  projectDescription: string;
  budget: string;
  schedule: string;
  expectedResults: string;
  attachedFiles: any[];
}

export interface ApplicationResponse {
  id: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// モック実装（実際のAPIが利用可能になるまでの暫定対応）
export const applicationClient = {
  async createApplication(data: ApplicationRequest): Promise<ApplicationResponse> {
    // API実装待ちのため、モックレスポンスを返す
    console.log('申請書作成データ:', data);
    
    // 実際のAPI実装例:
    // const response = await fetch('/api/applications', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });
    // return response.json();
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `app_${Date.now()}`,
          status: 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }, 1000);
    });
  },

  async generateBusinessPlan(companyInfo: any, projectInfo: any): Promise<{ businessPlan: string }> {
    // AI生成API実装待ちのため、モックレスポンスを返す
    console.log('事業計画生成リクエスト:', { companyInfo, projectInfo });
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          businessPlan: `【${companyInfo.companyName}の事業計画】

1. 事業概要
${companyInfo.companyName}は${companyInfo.industry}分野において、${projectInfo.title || '新規事業'}を推進いたします。

2. 事業の必要性・背景
現在の市場環境において、デジタル化・効率化への対応が急務となっており、本事業により競争力の向上を図ります。

3. 事業内容
具体的な実施内容については、以下の通りです：
- 業務プロセスの見直しと最適化
- 新技術の導入による効率化
- 人材育成と組織体制の強化

4. 実施効果
本事業の実施により、以下の効果が期待されます：
- 業務効率の向上（30%改善目標）
- 売上高の増加（前年比10%増加目標）
- 顧客満足度の向上

5. 実施体制
代表者である${companyInfo.representativeName || '代表者'}を中心とした実施体制を構築し、確実な事業推進を図ります。

※ この事業計画は AI により自動生成されました。内容を確認の上、必要に応じて修正してください。`
        });
      }, 2000);
    });
  }
};