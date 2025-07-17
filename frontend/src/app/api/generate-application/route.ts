import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subsidyType, companyInfo, projectInfo } = body;

    // ここで実際のAI分析を行う
    // 現在はモックデータを返す
    const generatedContent = {
      事業概要: generateBusinessOverview(companyInfo, projectInfo),
      実施計画: generateImplementationPlan(projectInfo),
      期待効果: generateExpectedEffects(projectInfo, subsidyType),
      資金計画: generateFinancialPlan(projectInfo),
      添付書類: {
        事業計画書: generateBusinessPlan(companyInfo, projectInfo),
        収支計画書: generateFinancialProjection(companyInfo, projectInfo)
      }
    };

    return NextResponse.json({
      success: true,
      data: generatedContent
    });
  } catch (error) {
    console.error('Application generation error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate application' },
      { status: 500 }
    );
  }
}

// 事業概要の生成
function generateBusinessOverview(companyInfo: any, projectInfo: any): string {
  return `【事業概要】
弊社${companyInfo.name}は、${companyInfo.industry}において${companyInfo.employees}名の従業員と共に事業を展開しております。
年間売上高${companyInfo.revenue}の中小企業として、地域経済の発展に貢献してまいりました。

今回、「${projectInfo.title}」を実施することで、以下の課題解決を目指します：
${projectInfo.purpose}

本事業では、${projectInfo.content}を実施し、弊社の競争力強化と地域経済への更なる貢献を実現します。`;
}

// 実施計画の生成
function generateImplementationPlan(projectInfo: any): string {
  return `【実施計画】
事業実施期間：${projectInfo.period}

■ 第1フェーズ（準備期間）- 1ヶ月
- 詳細要件定義と仕様確定
- 必要機器・システムの選定
- 関係者との調整

■ 第2フェーズ（導入期間）- 3ヶ月
- 機器・システムの導入
- 従業員研修の実施
- 試験運用の開始

■ 第3フェーズ（本格運用）- 2ヶ月
- 本格運用開始
- 効果測定と改善
- 成果報告書の作成`;
}

// 期待効果の生成
function generateExpectedEffects(projectInfo: any, subsidyType: string): string {
  const effects = {
    jizokuka: '売上高20%向上、新規顧客獲得数50件増加',
    gyomukaizen: '生産性30%向上、賃金5%以上引き上げ',
    it: '業務効率40%改善、コスト20%削減',
    monozukuri: '生産能力50%向上、不良率80%削減',
    saikochiku: '新事業売上比率30%達成、雇用10名増加'
  };

  return `【期待される効果】
1. 定量的効果
- ${effects[subsidyType as keyof typeof effects] || '売上高向上、生産性改善'}
- 投資回収期間：2年以内

2. 定性的効果
- 従業員のモチベーション向上
- 顧客満足度の向上
- 地域経済への波及効果

3. 持続可能性
- 継続的な改善サイクルの確立
- ノウハウの蓄積と横展開
- 競争優位性の確立`;
}

// 資金計画の生成
function generateFinancialPlan(projectInfo: any): string {
  const budget = projectInfo.budget.replace(/[^0-9]/g, '');
  const subsidyAmount = Math.floor(parseInt(budget) * 0.5);
  
  return `【資金計画】
■ 総事業費：${projectInfo.budget}
  
■ 内訳
- 設備費：${Math.floor(parseInt(budget) * 0.6).toLocaleString()}円
- システム費：${Math.floor(parseInt(budget) * 0.3).toLocaleString()}円
- その他経費：${Math.floor(parseInt(budget) * 0.1).toLocaleString()}円

■ 資金調達計画
- 補助金：${subsidyAmount.toLocaleString()}円
- 自己資金：${(parseInt(budget) - subsidyAmount).toLocaleString()}円

■ 費用対効果
- 年間削減額：${Math.floor(parseInt(budget) * 0.3).toLocaleString()}円
- 投資回収期間：約2年`;
}

// 事業計画書の生成
function generateBusinessPlan(companyInfo: any, projectInfo: any): string {
  return `【事業計画書】
1. 会社概要
- 企業名：${companyInfo.name}
- 所在地：${companyInfo.address}
- 業種：${companyInfo.industry}
- 従業員数：${companyInfo.employees}名
- 年間売上高：${companyInfo.revenue}

2. 事業の背景と目的
${projectInfo.purpose}

3. 事業内容
${projectInfo.content}

4. 実施体制
- プロジェクトリーダー：代表取締役
- 実施責任者：事業部長
- 実施担当者：各部門担当者

5. スケジュール
実施期間：${projectInfo.period}
（詳細は実施計画参照）`;
}

// 収支計画書の生成
function generateFinancialProjection(companyInfo: any, projectInfo: any): string {
  return `【収支計画書】
■ 3カ年収支計画
（単位：千円）
項目｜現状｜1年目｜2年目｜3年目
売上高｜100,000｜120,000｜140,000｜160,000
売上原価｜70,000｜80,000｜90,000｜100,000
売上総利益｜30,000｜40,000｜50,000｜60,000
販管費｜25,000｜28,000｜32,000｜36,000
営業利益｜5,000｜12,000｜18,000｜24,000

■ 投資効果
- ROI（投資収益率）：150%（3年間）
- 損益分岐点：事業開始後8ヶ月`;
}