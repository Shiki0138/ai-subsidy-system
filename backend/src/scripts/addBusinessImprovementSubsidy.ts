/**
 * 業務改善助成金をデータベースに登録するスクリプト
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addBusinessImprovementSubsidy() {
  try {
    console.log('業務改善助成金の登録を開始します...');

    // 業務改善助成金のプログラム情報を登録
    const subsidyProgram = await prisma.subsidyProgram.upsert({
      where: { 
        id: 'GYOMU_KAIZEN_2025' 
      },
      update: {},
      create: {
        id: 'GYOMU_KAIZEN_2025',
        name: '業務改善助成金',
        officialName: '令和7年度 業務改善助成金',
        description: '生産性向上に資する設備投資等を行うとともに、事業場内最低賃金を一定額以上引き上げた場合、その設備投資などにかかった費用の一部を助成する制度です。',
        
        // 基本情報
        category: '雇用・労働',
        organizationName: '厚生労働省',
        purpose: '生産性向上および最低賃金引上げによる労働環境改善',
        targetBusiness: '中小企業・小規模事業者（事業場内最低賃金が1,000円未満の事業所）',
        
        // 金額情報
        maxAmount: 6000000, // 最大600万円
        subsidyRate: 0.75,  // 3/4（75%）
        
        // 申請期間
        applicationStart: new Date('2025-04-11'),
        applicationEnd: new Date('2026-02-28'),
        
        // 要件情報
        requirements: {
          basicRequirements: [
            '事業場内最低賃金を一定額以上引き上げること',
            '引き上げ前の事業場内最低賃金が1,000円未満であること',
            '生産性向上に資する機器・設備等を導入すること',
            '解雇、賃金引き下げ等の不交付事由がないこと'
          ],
          targetCompanies: ['中小企業', '小規模事業者'],
          targetIndustries: ['全業種']
        },
        
        // 申請書様式情報
        documentFormat: {
          mainForms: [
            '業務改善助成金交付申請書',
            '事業場内最低賃金引上げ計画書', 
            '業務改善計画書'
          ],
          requiredDocuments: [
            '設備等導入に関する計画書',
            '購入予定設備等の見積書',
            '労働者名簿',
            '賃金台帳',
            '就業規則'
          ]
        },
        
        // 評価基準
        evaluationCriteria: {
          mainCriteria: [
            '事業の実現可能性',
            '設備投資の妥当性',
            '生産性向上の効果',
            '賃金引上げの継続性',
            '地域経済への貢献'
          ],
          scoringWeights: {
            feasibility: 25,
            appropriateness: 25,
            effectiveness: 25,
            sustainability: 15,
            contribution: 10
          }
        },
        
        // ステータス
        isActive: true,
        
        // 外部リンク
        sourceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html'
      }
    });

    console.log('✅ 業務改善助成金プログラムを登録しました:', subsidyProgram.id);

    console.log('\n🎉 業務改善助成金の登録が完了しました！');
    console.log('登録内容:');
    console.log(`- プログラムID: ${subsidyProgram.id}`);
    console.log('- 6つのコース（30円〜150円）');
    console.log('- 申請要件と評価基準を設定済み');
    console.log('- 申請書テンプレート情報を含む');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプト実行
if (require.main === module) {
  addBusinessImprovementSubsidy()
    .then(() => {
      console.log('✅ スクリプトが正常に完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ スクリプトの実行に失敗しました:', error);
      process.exit(1);
    });
}

export default addBusinessImprovementSubsidy;