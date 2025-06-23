"""
業務改善助成金（厚生労働省）申請書自動生成サービス
"""
import json
from datetime import datetime
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
import logging

# from ..templates.application_template_manager import ApplicationTemplateManager
# from ..config.subsidy_types import SubsidyType

# For testing purposes, we'll mock these imports
class ApplicationTemplateManager:
    pass

class SubsidyType:
    BUSINESS_IMPROVEMENT = "business_improvement"

logger = logging.getLogger(__name__)


@dataclass
class CompanyInfo:
    """企業情報"""
    name: str
    industry: str
    employee_count: int
    current_minimum_wage: int  # 現在の事業場内最低賃金
    regional_minimum_wage: int  # 地域別最低賃金
    address: str
    business_type: str
    yearly_revenue: Optional[int] = None
    founded_year: Optional[int] = None
    representative_name: Optional[str] = None


@dataclass
class WageIncreasePlan:
    """賃金引上げ計画"""
    course: str  # '30', '45', '60', '90'
    target_wage: int  # 引上げ後の賃金
    affected_employees: int  # 対象労働者数
    implementation_date: str  # 実施予定日
    sustainability_plan: str  # 持続可能性の説明


@dataclass
class InvestmentItem:
    """投資項目"""
    category: str  # 機械装置、システム構築等
    description: str
    cost: int
    vendor: str
    expected_effect: str


@dataclass
class InvestmentPlan:
    """設備投資計画"""
    items: List[InvestmentItem]
    total_cost: int
    financing_method: str  # 資金調達方法


@dataclass
class ProductivityPlan:
    """生産性向上計画"""
    current_productivity: str  # 現在の生産性
    target_productivity: str  # 目標生産性
    improvement_measures: List[str]  # 改善施策
    measurement_method: str  # 効果測定方法
    expected_roi: Optional[float] = None  # 期待投資収益率


@dataclass
class BusinessPlan:
    """事業計画"""
    challenges: str  # 現在の課題
    objectives: str  # 事業目標
    implementation: str  # 実施計画
    risk_management: str  # リスク管理
    local_contribution: str  # 地域貢献


class BusinessImprovementSubsidyService:
    """業務改善助成金申請書生成サービス"""
    
    def __init__(self):
        self.template_manager = ApplicationTemplateManager()
        self.subsidy_type = SubsidyType.BUSINESS_IMPROVEMENT
        
    def generate_application(
        self,
        company_info: CompanyInfo,
        wage_increase_plan: WageIncreasePlan,
        investment_plan: InvestmentPlan,
        productivity_plan: ProductivityPlan,
        business_plan: BusinessPlan
    ) -> Dict[str, Any]:
        """業務改善助成金申請書一式を生成"""
        
        logger.info(f"業務改善助成金申請書生成開始: {company_info.name}")
        
        # 申請資格チェック
        eligibility = self._check_eligibility(company_info)
        if not eligibility['is_eligible']:
            return {
                'success': False,
                'error': '申請資格を満たしていません',
                'reasons': eligibility['reasons']
            }
        
        # 補助金額計算
        subsidy_calculation = self._calculate_subsidy(
            wage_increase_plan.course,
            investment_plan.total_cost,
            productivity_plan.expected_roi
        )
        
        # 各種申請書類生成
        documents = []
        
        # 1. 交付申請書（様式第1号）
        form1 = self._generate_form1(
            company_info,
            wage_increase_plan,
            investment_plan,
            subsidy_calculation
        )
        documents.append({
            'type': 'form1',
            'title': '交付申請書（様式第1号）',
            'content': form1
        })
        
        # 2. 事業実施計画書（様式第1号別紙2）
        form1_2 = self._generate_form1_2(
            company_info,
            business_plan,
            investment_plan,
            productivity_plan,
            wage_increase_plan
        )
        documents.append({
            'type': 'form1_2',
            'title': '事業実施計画書（様式第1号別紙2）',
            'content': form1_2
        })
        
        # 3. 賃金引上げ計画書
        wage_plan = self._generate_wage_increase_plan(
            company_info,
            wage_increase_plan,
            productivity_plan
        )
        documents.append({
            'type': 'wage_increase_plan',
            'title': '賃金引上げ計画書',
            'content': wage_plan
        })
        
        # 4. 見積書一覧
        quotation_list = self._generate_quotation_list(investment_plan)
        documents.append({
            'type': 'quotation_list',
            'title': '見積書一覧',
            'content': quotation_list
        })
        
        # 5. 生産性向上計画詳細
        productivity_detail = self._generate_productivity_detail(
            productivity_plan,
            investment_plan
        )
        documents.append({
            'type': 'productivity_detail',
            'title': '生産性向上計画詳細',
            'content': productivity_detail
        })
        
        # 申請書評価スコア算出
        score = self._calculate_application_score(
            company_info,
            wage_increase_plan,
            investment_plan,
            productivity_plan,
            business_plan
        )
        
        logger.info(f"業務改善助成金申請書生成完了: {company_info.name}, スコア: {score['total_score']}")
        
        return {
            'success': True,
            'documents': documents,
            'subsidy_calculation': subsidy_calculation,
            'score': score,
            'recommendations': self._generate_recommendations(score)
        }
    
    def _check_eligibility(self, company_info: CompanyInfo) -> Dict[str, Any]:
        """申請資格チェック"""
        reasons = []
        
        # 賃金差額チェック
        wage_difference = company_info.current_minimum_wage - company_info.regional_minimum_wage
        if wage_difference > 50:
            reasons.append(f'事業場内最低賃金と地域別最低賃金の差が{wage_difference}円で、50円を超えています')
        
        # 中小企業判定（簡易版）
        size_limits = {
            '製造業': 300,
            '卸売業': 100,
            '小売業': 50,
            'サービス業': 100,
        }
        limit = size_limits.get(company_info.industry, 300)
        if company_info.employee_count > limit:
            reasons.append(f'{company_info.industry}の従業員数上限{limit}人を超えています')
        
        return {
            'is_eligible': len(reasons) == 0,
            'reasons': reasons
        }
    
    def _calculate_subsidy(
        self,
        course: str,
        total_cost: int,
        expected_roi: Optional[float]
    ) -> Dict[str, Any]:
        """補助金額計算"""
        course_settings = {
            '30': {'max': 1200000, 'base_rate': 0.75, 'productivity_rate': 0.9},
            '45': {'max': 1800000, 'base_rate': 0.8, 'productivity_rate': 0.9},
            '60': {'max': 3000000, 'base_rate': 0.8, 'productivity_rate': 0.9},
            '90': {'max': 6000000, 'base_rate': 0.8, 'productivity_rate': 0.9},
        }
        
        settings = course_settings.get(course, course_settings['30'])
        
        # 生産性要件を満たすかチェック
        has_productivity = expected_roi and expected_roi > 20
        subsidy_rate = settings['productivity_rate'] if has_productivity else settings['base_rate']
        
        calculated_amount = int(total_cost * subsidy_rate)
        estimated_amount = min(calculated_amount, settings['max'])
        
        return {
            'max_subsidy': settings['max'],
            'subsidy_rate': subsidy_rate,
            'estimated_amount': estimated_amount,
            'has_productivity_requirement': has_productivity
        }
    
    def _generate_form1(
        self,
        company_info: CompanyInfo,
        wage_plan: WageIncreasePlan,
        investment_plan: InvestmentPlan,
        subsidy_calc: Dict[str, Any]
    ) -> str:
        """交付申請書（様式第1号）生成"""
        
        current_date = datetime.now()
        reiwa_year = current_date.year - 2018
        
        content = f"""業務改善助成金交付申請書

令和{reiwa_year}年{current_date.month}月{current_date.day}日

厚生労働大臣　殿

【申請者情報】
事業場名称：{company_info.name}
所在地：{company_info.address}
代表者氏名：{company_info.representative_name or '[代表者名]'}
業種：{company_info.industry}
労働者数：{company_info.employee_count}人

【申請内容】
1. 申請コース：{wage_plan.course}円コース
2. 現在の事業場内最低賃金：{company_info.current_minimum_wage:,}円
3. 引上げ後の事業場内最低賃金：{wage_plan.target_wage:,}円
4. 引上げ額：{wage_plan.target_wage - company_info.current_minimum_wage}円
5. 対象労働者数：{wage_plan.affected_employees}人
6. 実施予定日：{wage_plan.implementation_date}

【助成金申請額】
設備投資等の総額：{investment_plan.total_cost:,}円
助成率：{int(subsidy_calc['subsidy_rate'] * 100)}％
申請額：{subsidy_calc['estimated_amount']:,}円

【設備投資等の概要】
"""
        
        for i, item in enumerate(investment_plan.items, 1):
            content += f"\n{i}. {item.category}\n"
            content += f"   内容：{item.description}\n"
            content += f"   金額：{item.cost:,}円\n"
            content += f"   業者：{item.vendor}\n"
        
        content += f"""
【添付書類】
1. 事業実施計画書（様式第1号別紙2）
2. 賃金引上げ計画書
3. 見積書（2社以上）
4. 賃金台帳（直近3か月分）
5. 労働者名簿
6. 就業規則
7. 決算書（直近2期分）

上記のとおり、業務改善助成金の交付を申請します。
なお、申請にあたっては、募集要項及び交付要綱の内容を理解し、これを遵守することを誓約します。

申請者：{company_info.name}
代表者：{company_info.representative_name or '[代表者名]'}
"""
        
        return content
    
    def _generate_form1_2(
        self,
        company_info: CompanyInfo,
        business_plan: BusinessPlan,
        investment_plan: InvestmentPlan,
        productivity_plan: ProductivityPlan,
        wage_plan: WageIncreasePlan
    ) -> str:
        """事業実施計画書（様式第1号別紙2）生成"""
        
        content = f"""事業実施計画書

【1. 事業の概要】
{business_plan.objectives}

【2. 現状の課題】
{business_plan.challenges}

本事業場では、以下の課題に直面しています：
1. 生産性の停滞による収益性の低下
2. 人材確保の困難さと定着率の低下
3. 設備の老朽化による作業効率の低下

【3. 生産性向上のための取組内容】
"""
        
        for i, measure in enumerate(productivity_plan.improvement_measures, 1):
            content += f"（{i}）{measure}\n"
        
        content += f"""
【4. 設備投資等の詳細】
"""
        
        for i, item in enumerate(investment_plan.items, 1):
            content += f"""
（{i}）{item.category}
　・内容：{item.description}
　・金額：{item.cost:,}円
　・業者：{item.vendor}
　・期待される効果：{item.expected_effect}
"""
        
        content += f"""
【5. 期待される生産性向上効果】
現在の生産性：{productivity_plan.current_productivity}
目標生産性：{productivity_plan.target_productivity}
効果測定方法：{productivity_plan.measurement_method}

生産性向上により、以下の効果が期待されます：
・作業効率の向上による人時生産性の改善
・品質向上による付加価値の増大
・コスト削減による利益率の改善

【6. 実施スケジュール】
・設備導入準備：交付決定後～1か月
・設備導入・設置：交付決定後2か月
・従業員研修：設備導入後2週間
・賃金引上げ実施：{wage_plan.implementation_date}
・効果測定：賃金引上げ後3か月、6か月、12か月

【7. 資金計画】
総事業費：{investment_plan.total_cost:,}円
資金調達方法：{investment_plan.financing_method}

【8. 地域経済への波及効果】
{business_plan.local_contribution}

【9. リスク管理】
{business_plan.risk_management}

【10. 事業の実施体制】
本事業は、経営陣のリーダーシップのもと、全社一丸となって実施します。
・総括責任者：{company_info.representative_name or '代表取締役'}
・実施責任者：[担当者名]
・進捗管理：月次での進捗確認と改善
"""
        
        return content
    
    def _generate_wage_increase_plan(
        self,
        company_info: CompanyInfo,
        wage_plan: WageIncreasePlan,
        productivity_plan: ProductivityPlan
    ) -> str:
        """賃金引上げ計画書生成"""
        
        wage_increase = wage_plan.target_wage - company_info.current_minimum_wage
        increase_rate = (wage_increase / company_info.current_minimum_wage) * 100
        affected_rate = (wage_plan.affected_employees / company_info.employee_count) * 100
        
        content = f"""賃金引上げ計画書

【1. 賃金引上げの概要】
引上げコース：{wage_plan.course}円コース
現在の事業場内最低賃金：{company_info.current_minimum_wage:,}円
引上げ後の事業場内最低賃金：{wage_plan.target_wage:,}円
引上げ額：{wage_increase}円（{increase_rate:.1f}％増）
実施予定日：{wage_plan.implementation_date}

【2. 対象労働者】
対象労働者数：{wage_plan.affected_employees}人
全労働者数：{company_info.employee_count}人
影響を受ける労働者の割合：{affected_rate:.1f}％

【3. 賃金引上げの実施方法】
1. 基本給の引上げ
   - 時給制労働者：現行時給に{wage_increase}円を加算
   - 月給制労働者：時給換算で{wage_increase}円相当を加算

2. 就業規則の改定
   - 賃金規定の改定
   - 最低賃金の明記
   - 労働者代表の意見聴取

3. 労働者への周知
   - 全体説明会の開催
   - 個別面談の実施
   - 書面による通知

【4. 賃金引上げの持続可能性】
{wage_plan.sustainability_plan}

生産性向上による収益改善：
"""
        
        for measure in productivity_plan.improvement_measures:
            content += f"・{measure}\n"
        
        content += f"""
【5. 賃金体系の見直し】
本計画では、最低賃金の引上げとともに、全体的な賃金体系の見直しを行います：
・職能給制度の導入検討
・成果連動型賞与の拡充
・キャリアパスの明確化

【6. 労働者への影響と期待効果】
1. 直接的効果
   - 労働者の生活水準向上
   - モチベーションの向上
   - 定着率の改善

2. 間接的効果
   - 採用競争力の強化
   - 企業イメージの向上
   - 地域経済への貢献

【7. 実施後のモニタリング計画】
・毎月：賃金台帳による支払い状況確認
・四半期：労働者満足度調査
・半期：生産性指標との相関分析
・年次：賃金体系全体の見直し

【8. 今後の賃金引上げ計画】
本計画を第一歩として、継続的な賃金引上げを目指します：
・次年度：さらに20円以上の引上げを検討
・3年後：地域別最低賃金＋100円を目標
・5年後：業界トップクラスの賃金水準を実現
"""
        
        return content
    
    def _generate_quotation_list(self, investment_plan: InvestmentPlan) -> str:
        """見積書一覧生成"""
        
        content = """見積書一覧

【見積書取得状況】
"""
        
        for i, item in enumerate(investment_plan.items, 1):
            content += f"""
{i}. {item.category}
   品目：{item.description}
   見積業者：
   (1) {item.vendor}（採用予定）
       見積金額：{item.cost:,}円
   (2) [比較業者名]
       見積金額：[金額]円
   
   採用理由：価格、品質、納期、アフターサービス等を総合的に判断
"""
        
        content += f"""
【見積金額合計】
採用予定業者合計：{investment_plan.total_cost:,}円

【業者選定基準】
1. 価格の妥当性
2. 製品・サービスの品質
3. 納期の確実性
4. アフターサービス体制
5. 過去の取引実績

※全ての見積書は別添として提出します。
"""
        
        return content
    
    def _generate_productivity_detail(
        self,
        productivity_plan: ProductivityPlan,
        investment_plan: InvestmentPlan
    ) -> str:
        """生産性向上計画詳細生成"""
        
        content = f"""生産性向上計画詳細

【1. 現状分析】
現在の生産性：{productivity_plan.current_productivity}

課題：
・設備の老朽化による作業効率の低下
・手作業による工程が多く、ミスや手戻りが発生
・情報共有の不足による無駄な作業の発生

【2. 生産性向上施策】
"""
        
        for i, measure in enumerate(productivity_plan.improvement_measures, 1):
            content += f"""
施策{i}：{measure}
"""
        
        content += f"""
【3. 設備投資による具体的な改善効果】
"""
        
        for item in investment_plan.items:
            content += f"""
■ {item.category}（{item.description}）
期待効果：{item.expected_effect}
定量的効果：
・作業時間の短縮：約30％削減見込み
・エラー率の低下：現行5％→1％以下
・処理能力の向上：時間当たり処理数20％増
"""
        
        content += f"""
【4. 生産性指標と測定方法】
目標生産性：{productivity_plan.target_productivity}
測定方法：{productivity_plan.measurement_method}

主要KPI：
1. 労働生産性（付加価値額÷労働投入量）
2. 設備稼働率
3. 不良品率
4. 納期遵守率
5. 顧客満足度

【5. 投資効果の試算】
"""
        
        if productivity_plan.expected_roi:
            content += f"期待ROI：{productivity_plan.expected_roi:.1f}％\n"
        
        content += """
収益改善効果（年間）：
・売上増加：生産性向上による受注拡大
・コスト削減：作業効率化による人件費削減
・品質向上：不良品削減による損失低減

【6. 実施計画とマイルストーン】
第1四半期：設備導入と初期調整
第2四半期：本格稼働と効果測定開始
第3四半期：改善点の抽出と最適化
第4四半期：効果検証と次期計画策定

【7. 成功要因とリスク対策】
成功要因：
・経営陣の強いコミットメント
・従業員の積極的な参加
・外部専門家の活用

リスク対策：
・段階的な導入による影響最小化
・十分な研修期間の確保
・バックアップ体制の構築
"""
        
        return content
    
    def _calculate_application_score(
        self,
        company_info: CompanyInfo,
        wage_plan: WageIncreasePlan,
        investment_plan: InvestmentPlan,
        productivity_plan: ProductivityPlan,
        business_plan: BusinessPlan
    ) -> Dict[str, Any]:
        """申請書評価スコア算出"""
        
        scores = {
            'productivity': 0,  # 40点満点
            'wage_increase': 0,  # 30点満点
            'sustainability': 0,  # 30点満点
        }
        
        # 生産性向上効果の評価
        if productivity_plan.expected_roi and productivity_plan.expected_roi > 20:
            scores['productivity'] += 15
        if len(productivity_plan.improvement_measures) >= 3:
            scores['productivity'] += 15
        if productivity_plan.measurement_method:
            scores['productivity'] += 10
            
        # 賃金引上げの評価
        wage_increase_rate = ((wage_plan.target_wage - company_info.current_minimum_wage) 
                             / company_info.current_minimum_wage)
        if wage_increase_rate >= 0.05:
            scores['wage_increase'] += 15
        if len(wage_plan.sustainability_plan) > 100:
            scores['wage_increase'] += 15
            
        # 事業継続性の評価
        if len(business_plan.risk_management) > 50:
            scores['sustainability'] += 10
        if len(business_plan.local_contribution) > 50:
            scores['sustainability'] += 10
        if investment_plan.financing_method:
            scores['sustainability'] += 10
            
        total_score = sum(scores.values())
        
        return {
            'total_score': total_score,
            'max_score': 100,
            'breakdown': scores,
            'percentage': (total_score / 100) * 100
        }
    
    def _generate_recommendations(self, score: Dict[str, Any]) -> List[str]:
        """改善提案生成"""
        recommendations = []
        
        if score['breakdown']['productivity'] < 30:
            recommendations.append('生産性向上効果をより具体的な数値で示すことをお勧めします')
            
        if score['breakdown']['wage_increase'] < 20:
            recommendations.append('賃金引上げの持続可能性についてより詳細な計画を追加してください')
            
        if score['breakdown']['sustainability'] < 20:
            recommendations.append('事業の継続性とリスク管理についてより詳しく記載することをお勧めします')
            
        if score['total_score'] >= 80:
            recommendations.append('申請書の内容は非常に充実しています。採択の可能性が高いと考えられます')
            
        return recommendations


# テスト用のモック実装
def create_test_application():
    """テスト用の申請データ作成"""
    company_info = CompanyInfo(
        name="株式会社テスト製造",
        industry="製造業",
        employee_count=50,
        current_minimum_wage=1050,
        regional_minimum_wage=1013,
        address="東京都中央区",
        business_type="金属加工業",
        yearly_revenue=300000000,
        founded_year=2010,
        representative_name="山田太郎"
    )
    
    wage_increase_plan = WageIncreasePlan(
        course="60",
        target_wage=1110,
        affected_employees=15,
        implementation_date="2024年8月1日",
        sustainability_plan="生産性向上による収益改善を原資として、継続的な賃金引上げを実施します。"
    )
    
    investment_items = [
        InvestmentItem(
            category="機械装置",
            description="CNC旋盤",
            cost=5000000,
            vendor="株式会社工作機械",
            expected_effect="加工精度向上と作業時間30％削減"
        ),
        InvestmentItem(
            category="システム構築",
            description="生産管理システム",
            cost=2000000,
            vendor="システム開発株式会社",
            expected_effect="在庫管理効率化と納期短縮"
        )
    ]
    
    investment_plan = InvestmentPlan(
        items=investment_items,
        total_cost=7000000,
        financing_method="自己資金50％、金融機関借入50％"
    )
    
    productivity_plan = ProductivityPlan(
        current_productivity="1人1時間あたり10個生産",
        target_productivity="1人1時間あたり13個生産（30％向上）",
        improvement_measures=[
            "CNC旋盤導入による加工時間短縮",
            "生産管理システムによる工程最適化",
            "従業員スキルアップ研修の実施"
        ],
        measurement_method="月次での生産個数と労働時間の記録・分析",
        expected_roi=25.0
    )
    
    business_plan = BusinessPlan(
        challenges="設備の老朽化による生産性低下と、人材確保の困難さ",
        objectives="最新設備導入による生産性向上と、賃金引上げによる人材定着",
        implementation="段階的な設備導入と並行した従業員研修の実施",
        risk_management="設備故障時のバックアップ体制構築と、複数名での技術習得",
        local_contribution="地域の雇用創出と、取引先企業への安定供給による地域経済活性化"
    )
    
    return company_info, wage_increase_plan, investment_plan, productivity_plan, business_plan


if __name__ == "__main__":
    # テスト実行
    service = BusinessImprovementSubsidyService()
    test_data = create_test_application()
    
    result = service.generate_application(*test_data)
    
    if result['success']:
        print("申請書生成成功")
        print(f"文書数: {len(result['documents'])}")
        print(f"推定補助金額: {result['subsidy_calculation']['estimated_amount']:,}円")
        print(f"評価スコア: {result['score']['total_score']}/100点")
    else:
        print("申請書生成失敗")
        print(f"エラー: {result['error']}")