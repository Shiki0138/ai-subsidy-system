"""
事業再構築補助金（Business Reconstruction Subsidy）専用サービス
最大1億5000万円の大型補助金に対応した高品質申請書生成
"""

from typing import Dict, List, Any, Optional
import json
from datetime import datetime, timedelta
from .ai_writing_assistant import AIWritingAssistant
from .document_quality_analyzer import DocumentQualityAnalyzer
from ..templates.application_template_manager import ApplicationTemplateManager
from ..config.subsidy_config import RECONSTRUCTION_CONFIG

class ReconstructionSubsidyService:
    """事業再構築補助金申請書自動生成サービス"""
    
    def __init__(self):
        self.ai_assistant = AIWritingAssistant()
        self.quality_analyzer = DocumentQualityAnalyzer()
        self.template_manager = ApplicationTemplateManager()
        
    def check_eligibility(self, company_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        事業再構築補助金の申請資格をチェック
        
        Args:
            company_data: {
                "sales_2019": "2019年売上高(円)",
                "sales_2020": "2020年売上高(円)", 
                "sales_2021": "2021年売上高(円)",
                "sales_2022": "2022年売上高(円)",
                "employee_count": "従業員数",
                "industry": "業種",
                "has_support_org": "認定支援機関の確認",
                "reconstruction_type": "再構築の種類"
            }
        
        Returns:
            申請資格の判定結果
        """
        try:
            # 売上高減少率の計算
            decline_rate = self._calculate_sales_decline(company_data)
            
            # 基本要件チェック
            eligibility_checks = {
                "sales_decline": decline_rate >= 10.0,  # 10%以上の売上減少
                "support_organization": company_data.get("has_support_org", False),
                "employee_count_valid": self._check_employee_count(company_data),
                "reconstruction_plan": self._validate_reconstruction_type(company_data.get("reconstruction_type"))
            }
            
            # 申請可能な補助金額を計算
            max_subsidy = self._calculate_max_subsidy(company_data)
            
            # 総合判定
            is_eligible = all(eligibility_checks.values())
            
            result = {
                "eligible": is_eligible,
                "sales_decline_rate": decline_rate,
                "max_subsidy_amount": max_subsidy,
                "eligibility_details": eligibility_checks,
                "recommendations": self._generate_eligibility_recommendations(eligibility_checks, company_data)
            }
            
            if not is_eligible:
                result["blocking_issues"] = [
                    key for key, value in eligibility_checks.items() if not value
                ]
            
            return result
            
        except Exception as e:
            return {
                "eligible": False,
                "error": f"申請資格の確認中にエラーが発生しました: {str(e)}"
            }
    
    def generate_comprehensive_application(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        包括的な事業再構築申請書を生成
        
        Args:
            application_data: {
                "company_info": "企業情報",
                "current_business": "現在の事業内容",
                "reconstruction_plan": "再構築計画",
                "new_business": "新規事業内容",
                "market_analysis": "市場分析",
                "financial_plan": "資金計画",
                "implementation_schedule": "実施スケジュール"
            }
        
        Returns:
            完全な申請書データ
        """
        try:
            # 事前分析と最適化
            analyzed_data = self._analyze_and_optimize_plan(application_data)
            
            # 全セクションの生成
            application_sections = self._generate_all_reconstruction_sections(analyzed_data)
            
            # 品質分析と改善
            quality_report = self.quality_analyzer.analyze_document(application_sections)
            
            # 不十分なセクションの改善
            if quality_report['overall_score'] < 85:
                application_sections = self._improve_sections(application_sections, quality_report)
                quality_report = self.quality_analyzer.analyze_document(application_sections)
            
            # 採択確率の計算
            adoption_probability = self._calculate_adoption_probability(application_sections, analyzed_data)
            
            # リスク分析
            risk_analysis = self._analyze_reconstruction_risks(analyzed_data)
            
            return {
                "application_sections": application_sections,
                "quality_score": quality_report['overall_score'],
                "adoption_probability": adoption_probability,
                "risk_analysis": risk_analysis,
                "estimated_review_time": self._estimate_review_time(analyzed_data),
                "recommended_improvements": self._generate_improvement_recommendations(quality_report),
                "generated_at": datetime.now().isoformat(),
                "metadata": {
                    "subsidy_type": "reconstruction",
                    "max_amount": analyzed_data.get("requested_amount", 0),
                    "reconstruction_type": analyzed_data.get("reconstruction_type")
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": f"申請書生成中にエラーが発生しました: {str(e)}"
            }
    
    def _calculate_sales_decline(self, company_data: Dict[str, Any]) -> float:
        """売上高減少率を計算"""
        try:
            # 2019年を基準年とする
            base_year_sales = float(company_data.get("sales_2019", 0))
            
            if base_year_sales == 0:
                return 0.0
            
            # 比較年の売上（2020年以降の最低値）
            comparison_years = []
            for year in ["sales_2020", "sales_2021", "sales_2022"]:
                if company_data.get(year):
                    comparison_years.append(float(company_data[year]))
            
            if not comparison_years:
                return 0.0
            
            min_sales = min(comparison_years)
            decline_rate = ((base_year_sales - min_sales) / base_year_sales) * 100
            
            return max(0.0, decline_rate)
            
        except (ValueError, ZeroDivisionError):
            return 0.0
    
    def _check_employee_count(self, company_data: Dict[str, Any]) -> bool:
        """従業員数による制限をチェック"""
        employee_count = int(company_data.get("employee_count", 0))
        industry = company_data.get("industry", "")
        
        # 業種別従業員数制限
        if "製造業" in industry:
            return employee_count <= 300
        elif any(keyword in industry for keyword in ["情報通信", "IT", "ソフトウェア"]):
            return employee_count <= 300
        else:
            return employee_count <= 100
    
    def _validate_reconstruction_type(self, reconstruction_type: str) -> bool:
        """再構築タイプの妥当性をチェック"""
        valid_types = [
            "新分野展開", "事業転換", "業種転換", "業態転換", "事業再編"
        ]
        return reconstruction_type in valid_types
    
    def _calculate_max_subsidy(self, company_data: Dict[str, Any]) -> int:
        """最大補助金額を計算"""
        employee_count = int(company_data.get("employee_count", 0))
        
        if employee_count <= 20:
            return 100000000  # 1億円
        elif employee_count <= 50:
            return 120000000  # 1億2000万円
        else:
            return 150000000  # 1億5000万円
    
    def _analyze_and_optimize_plan(self, application_data: Dict[str, Any]) -> Dict[str, Any]:
        """申請計画を分析・最適化"""
        
        # 市場機会の分析
        market_opportunity = self._analyze_market_opportunity(
            application_data.get("new_business", {}),
            application_data.get("market_analysis", {})
        )
        
        # 競合優位性の分析
        competitive_advantage = self._analyze_competitive_advantage(
            application_data.get("current_business", {}),
            application_data.get("new_business", {})
        )
        
        # 財務実現可能性の分析
        financial_feasibility = self._analyze_financial_feasibility(
            application_data.get("financial_plan", {})
        )
        
        # シナジー効果の分析
        synergy_effects = self._analyze_synergy_effects(
            application_data.get("current_business", {}),
            application_data.get("new_business", {})
        )
        
        return {
            **application_data,
            "market_opportunity": market_opportunity,
            "competitive_advantage": competitive_advantage,
            "financial_feasibility": financial_feasibility,
            "synergy_effects": synergy_effects,
            "optimization_score": self._calculate_optimization_score({
                "market": market_opportunity,
                "competitive": competitive_advantage,
                "financial": financial_feasibility,
                "synergy": synergy_effects
            })
        }
    
    def _generate_all_reconstruction_sections(self, data: Dict[str, Any]) -> Dict[str, str]:
        """事業再構築申請書の全セクションを生成"""
        
        sections = {
            # 基本情報セクション
            "事業計画名": self._generate_project_title(data),
            "申請者概要": self._generate_applicant_overview(data),
            
            # 現状分析セクション
            "現在の事業内容": self._generate_current_business_analysis(data),
            "事業環境の変化": self._generate_business_environment_change(data),
            "売上高減少の分析": self._generate_sales_decline_analysis(data),
            
            # 再構築計画セクション
            "事業再構築の概要": self._generate_reconstruction_overview(data),
            "新規事業の詳細": self._generate_new_business_details(data),
            "市場分析と競合優位性": self._generate_market_competitive_analysis(data),
            
            # 実施計画セクション
            "実施体制とスケジュール": self._generate_implementation_plan(data),
            "必要な投資と資金調達": self._generate_investment_funding_plan(data),
            "収益計画と効果測定": self._generate_revenue_plan(data),
            
            # リスク管理セクション
            "リスク分析と対策": self._generate_risk_management(data),
            "事業継続性の確保": self._generate_business_continuity(data),
            
            # 政策的意義セクション
            "地域経済への貢献": self._generate_regional_contribution(data),
            "政策目標との整合性": self._generate_policy_alignment(data)
        }
        
        return sections
    
    def _generate_project_title(self, data: Dict[str, Any]) -> str:
        """事業計画名を生成"""
        current_business = data.get("current_business", {}).get("description", "既存事業")
        new_business = data.get("new_business", {}).get("description", "新規事業")
        reconstruction_type = data.get("reconstruction_plan", {}).get("type", "事業転換")
        
        title = f"{current_business}から{new_business}への{reconstruction_type}による事業再構築計画"
        return title[:100]  # タイトル長制限
    
    def _generate_applicant_overview(self, data: Dict[str, Any]) -> str:
        """申請者概要を生成"""
        company_info = data.get("company_info", {})
        
        prompt = f"""
        以下の企業情報から、事業再構築補助金申請用の申請者概要を作成してください：
        
        企業名: {company_info.get('name', '株式会社サンプル')}
        業種: {company_info.get('industry', '製造業')}
        従業員数: {company_info.get('employee_count', 50)}名
        設立年: {company_info.get('established_year', 2000)}年
        所在地: {company_info.get('location', '東京都')}
        主要事業: {company_info.get('main_business', '従来事業')}
        
        以下の要素を含めて400-500文字で作成してください：
        1. 企業の歴史と実績
        2. 現在の事業規模と市場ポジション
        3. 強みと特徴
        4. 再構築に取り組む背景
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _generate_current_business_analysis(self, data: Dict[str, Any]) -> str:
        """現在の事業内容分析を生成"""
        current_business = data.get("current_business", {})
        
        prompt = f"""
        現在の事業について詳細な分析を作成してください：
        
        事業内容: {current_business.get('description', '')}
        主要製品・サービス: {current_business.get('products', '')}
        対象顧客: {current_business.get('target_customers', '')}
        売上構成: {current_business.get('revenue_structure', '')}
        
        以下の観点から500-600文字で分析してください：
        1. 事業の詳細内容と特徴
        2. 顧客層と市場での位置づけ
        3. 収益モデルと売上構造
        4. 現在直面している課題
        5. 強みと弱みの分析
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _generate_business_environment_change(self, data: Dict[str, Any]) -> str:
        """事業環境の変化を生成"""
        industry = data.get("company_info", {}).get("industry", "")
        reconstruction_reason = data.get("reconstruction_plan", {}).get("reason", "")
        
        prompt = f"""
        {industry}業界における事業環境の変化について分析してください：
        
        再構築の背景: {reconstruction_reason}
        
        以下の観点から400-500文字で分析してください：
        1. COVID-19の影響と市場変化
        2. デジタル化やDXの進展
        3. 顧客ニーズの変化
        4. 競合環境の変化
        5. 規制や政策の変化
        6. 技術革新の影響
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _calculate_adoption_probability(self, sections: Dict[str, str], data: Dict[str, Any]) -> float:
        """採択確率を計算"""
        
        # 各評価項目のスコア計算
        scores = {
            "business_model_innovation": self._evaluate_business_model_innovation(sections, data),
            "market_potential": self._evaluate_market_potential(sections, data),
            "financial_feasibility": self._evaluate_financial_feasibility(sections, data),
            "implementation_capability": self._evaluate_implementation_capability(sections, data),
            "policy_significance": self._evaluate_policy_significance(sections, data)
        }
        
        # 重み付け（事業再構築補助金の評価基準に基づく）
        weights = {
            "business_model_innovation": 0.30,  # 事業モデルの革新性
            "market_potential": 0.25,           # 市場性・成長性
            "financial_feasibility": 0.25,     # 財務面の実现可能性
            "implementation_capability": 0.15,  # 実施体制・実現性
            "policy_significance": 0.05         # 政策的意義
        }
        
        # 重み付け平均で採択確率を算出
        probability = sum(scores[key] * weights[key] for key in scores)
        
        # 追加ボーナス要因
        bonus_factors = self._calculate_bonus_factors(data)
        probability += bonus_factors
        
        return min(probability, 95.0)  # 最大95%
    
    def _analyze_reconstruction_risks(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """再構築計画のリスク分析"""
        
        risks = {
            "market_risk": self._assess_market_risk(data),
            "financial_risk": self._assess_financial_risk(data),
            "operational_risk": self._assess_operational_risk(data),
            "competitive_risk": self._assess_competitive_risk(data),
            "regulatory_risk": self._assess_regulatory_risk(data)
        }
        
        # 総合リスクレベル
        risk_scores = [risk["score"] for risk in risks.values()]
        overall_risk = sum(risk_scores) / len(risk_scores)
        
        return {
            "risks": risks,
            "overall_risk_level": self._categorize_risk_level(overall_risk),
            "mitigation_strategies": self._generate_mitigation_strategies(risks),
            "risk_monitoring_plan": self._generate_risk_monitoring_plan(risks)
        }
    
    # 評価メソッド群
    def _evaluate_business_model_innovation(self, sections: Dict[str, str], data: Dict[str, Any]) -> float:
        """事業モデル革新性の評価"""
        score = 0.0
        
        # 新規性の評価
        new_business_section = sections.get("新規事業の詳細", "")
        innovation_keywords = ["革新的", "画期的", "独自", "先駆的", "差別化", "DX", "デジタル"]
        
        for keyword in innovation_keywords:
            if keyword in new_business_section:
                score += 10
        
        # 転換の抜本性
        reconstruction_type = data.get("reconstruction_plan", {}).get("type", "")
        if reconstruction_type in ["業種転換", "業態転換"]:
            score += 20
        elif reconstruction_type in ["事業転換", "新分野展開"]:
            score += 15
        
        # 市場創造性
        market_section = sections.get("市場分析と競合優位性", "")
        if "新市場" in market_section or "市場創造" in market_section:
            score += 15
        
        return min(score, 100)
    
    def _evaluate_market_potential(self, sections: Dict[str, str], data: Dict[str, Any]) -> float:
        """市場性・成長性の評価"""
        score = 0.0
        
        market_section = sections.get("市場分析と競合優位性", "")
        
        # 市場規模と成長性
        if "市場規模" in market_section:
            score += 20
        if "成長率" in market_section or "拡大" in market_section:
            score += 20
        
        # 顧客ニーズの明確性
        if "顧客ニーズ" in market_section:
            score += 15
        
        # 競合優位性
        if "競合優位" in market_section or "差別化" in market_section:
            score += 20
        
        # データの具体性
        if "%" in market_section or "億円" in market_section:
            score += 15
        
        return min(score, 100)
    
    # 他の評価メソッドも同様に実装...
    
    def generate_quick_assessment(self, basic_info: Dict[str, Any]) -> Dict[str, Any]:
        """簡易評価（問い合わせ段階での事前評価）"""
        try:
            # 基本的な申請資格チェック
            eligibility = self.check_eligibility(basic_info)
            
            if not eligibility["eligible"]:
                return {
                    "assessment_type": "eligibility_failed",
                    "eligible": False,
                    "issues": eligibility.get("blocking_issues", []),
                    "recommendations": eligibility.get("recommendations", [])
                }
            
            # 概算採択確率の算出
            estimated_probability = self._estimate_probability_from_basic_info(basic_info)
            
            # 推奨される再構築タイプ
            recommended_type = self._recommend_reconstruction_type(basic_info)
            
            # 概算補助金額
            estimated_subsidy = min(
                int(basic_info.get("planned_investment", 0)) * 0.75,  # 補助率75%
                eligibility["max_subsidy_amount"]
            )
            
            return {
                "assessment_type": "quick_assessment",
                "eligible": True,
                "estimated_probability": estimated_probability,
                "estimated_subsidy": estimated_subsidy,
                "recommended_reconstruction_type": recommended_type,
                "key_success_factors": self._identify_key_success_factors(basic_info),
                "next_steps": self._generate_next_steps(basic_info)
            }
            
        except Exception as e:
            return {
                "assessment_type": "error",
                "eligible": False,
                "error": f"評価中にエラーが発生しました: {str(e)}"
            }
    
    # 追加のヘルパーメソッド群
    def _get_market_trends(self, industry: str) -> List[str]:
        """業界の市場トレンドを取得"""
        trends_data = {
            "製造業": [
                "IoT・Industry4.0の導入拡大",
                "サプライチェーンの見直し",
                "カーボンニュートラルへの対応",
                "人手不足解消のための自動化"
            ],
            "情報通信業": [
                "DXサービスの需要拡大",
                "リモートワーク関連技術",
                "AIとデータ分析の活用",
                "サイバーセキュリティ強化"
            ],
            "宿泊業・飲食サービス業": [
                "非接触・非対面サービス",
                "テイクアウト・デリバリー拡大",
                "デジタル決済の普及",
                "衛生管理の高度化"
            ]
        }
        
        return trends_data.get(industry, [
            "デジタル化の推進",
            "顧客ニーズの多様化",
            "持続可能性への対応",
            "新しいビジネスモデルの模索"
        ])
    
    def _get_common_reconstruction_types(self, industry: str) -> Dict[str, int]:
        """業界別の一般的な再構築タイプとその割合"""
        patterns = {
            "製造業": {
                "新分野展開": 40,
                "業態転換": 30,
                "事業転換": 20,
                "業種転換": 10
            },
            "宿泊業・飲食サービス業": {
                "事業転換": 35,
                "新分野展開": 30,
                "業態転換": 25,
                "業種転換": 10
            }
        }
        
        return patterns.get(industry, {
            "新分野展開": 35,
            "事業転換": 25,
            "業態転換": 25,
            "業種転換": 15
        })
    
    def _get_industry_success_factors(self, industry: str) -> List[str]:
        """業界別の成功要因"""
        factors = {
            "製造業": [
                "既存技術の活用と新技術の融合",
                "顧客との長期関係の維持",
                "品質管理体制の確立",
                "技術者のスキル向上"
            ],
            "情報通信業": [
                "技術革新への迅速な対応",
                "顧客のDXニーズの深い理解",
                "パートナーシップの構築",
                "セキュリティ対策の徹底"
            ]
        }
        
        return factors.get(industry, [
            "市場ニーズの正確な把握",
            "適切な投資タイミング",
            "組織の変革管理",
            "財務計画の精緻性"
        ])
    
    def _get_typical_challenges(self, industry: str) -> List[str]:
        """業界別の典型的な課題"""
        challenges = {
            "製造業": [
                "人手不足と技術継承",
                "設備の老朽化",
                "原材料価格の上昇",
                "環境規制への対応"
            ],
            "宿泊業・飲食サービス業": [
                "感染症対策と売上確保の両立",
                "人材確保の困難",
                "固定費の負担",
                "顧客行動の変化への対応"
            ]
        }
        
        return challenges.get(industry, [
            "市場競争の激化",
            "デジタル化の遅れ",
            "人材育成の課題",
            "資金調達の困難"
        ])
    
    def _get_funding_patterns(self, industry: str) -> Dict[str, Any]:
        """業界別の資金調達パターン"""
        patterns = {
            "製造業": {
                "平均投資額": 80000000,
                "補助金依存度": 0.6,
                "自己資金比率": 0.25,
                "借入比率": 0.15
            },
            "情報通信業": {
                "平均投資額": 50000000,
                "補助金依存度": 0.7,
                "自己資金比率": 0.2,
                "借入比率": 0.1
            }
        }
        
        return patterns.get(industry, {
            "平均投資額": 60000000,
            "補助金依存度": 0.65,
            "自己資金比率": 0.25,
            "借入比率": 0.1
        })
    
    def _search_support_organizations(self, location: str, specialty: str) -> List[Dict[str, Any]]:
        """認定支援機関の検索（モックデータ）"""
        # 実際の実装では外部APIまたはデータベースと連携
        mock_organizations = [
            {
                "name": "○○経営コンサルティング株式会社",
                "certification_number": "123456789",
                "location": "東京都千代田区",
                "specialties": ["事業再構築", "DX支援", "製造業"],
                "rating": 4.5,
                "completed_applications": 150,
                "contact_info": {
                    "phone": "03-1234-5678",
                    "email": "info@example.com",
                    "website": "https://example.com"
                }
            },
            {
                "name": "△△中小企業診断士事務所",
                "certification_number": "987654321",
                "location": "大阪府大阪市",
                "specialties": ["事業再構築", "財務改善", "IT導入"],
                "rating": 4.2,
                "completed_applications": 98,
                "contact_info": {
                    "phone": "06-9876-5432",
                    "email": "contact@example.org",
                    "website": "https://example.org"
                }
            }
        ]
        
        # 位置と専門性でフィルタリング
        filtered = []
        for org in mock_organizations:
            if location and location not in org["location"]:
                continue
            if specialty and specialty not in org["specialties"]:
                continue
            filtered.append(org)
        
        return filtered[:10]  # 最大10件
    
    def _optimize_content_with_updates(self, current_data: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
        """更新内容で申請書を最適化"""
        optimized_data = current_data.copy()
        
        # 更新内容を適用
        for key, value in updates.items():
            if key in optimized_data:
                optimized_data[key] = value
        
        # AI で内容を最適化
        for section_key, section_content in optimized_data.items():
            if isinstance(section_content, str) and len(section_content) > 100:
                # 長いテキストセクションを最適化
                optimized_content = self.ai_assistant.enhance_content(
                    section_content,
                    f"{section_key}の内容を事業再構築補助金の採択率向上のために最適化"
                )
                optimized_data[section_key] = optimized_content
        
        return optimized_data
    
    def _calculate_quality_score(self, data: Dict[str, Any]) -> float:
        """申請書の品質スコアを計算"""
        score = 0.0
        max_score = 100.0
        
        # 各セクションの完成度をチェック
        required_sections = [
            '事業計画名', '申請者概要', '現在の事業内容', '事業環境の変化',
            '事業再構築の概要', '新規事業の詳細', '市場分析と競合優位性',
            '実施体制とスケジュール', '必要な投資と資金調達', '収益計画と効果測定'
        ]
        
        section_score = 0
        for section in required_sections:
            if section in data and data[section] and len(data[section]) > 100:
                section_score += 8  # 各セクション8点
        
        score += section_score
        
        # 品質指標をチェック
        quality_indicators = self._check_quality_indicators(data)
        score += quality_indicators * 4  # 各指標4点
        
        return min(score, max_score)
    
    def _check_quality_indicators(self, data: Dict[str, Any]) -> int:
        """品質指標をチェック"""
        indicators = 0
        
        # 高評価キーワードの存在
        high_value_keywords = ['革新的', 'DX', 'デジタル', '持続可能', '競争力', '差別化']
        content_text = ' '.join([str(v) for v in data.values() if isinstance(v, str)])
        
        for keyword in high_value_keywords:
            if keyword in content_text:
                indicators += 1
        
        # 数値データの具体性
        if any('%' in str(v) or '億円' in str(v) for v in data.values() if isinstance(v, str)):
            indicators += 1
        
        # 具体的な効果の記述
        if any('効果' in str(v) and len(str(v)) > 200 for v in data.values() if isinstance(v, str)):
            indicators += 1
        
        return min(indicators, 10)  # 最大10点
    
    def _generate_improvement_recommendations(self, quality_report: Dict[str, Any]) -> List[str]:
        """改善提案を生成"""
        recommendations = []
        
        overall_score = quality_report.get('overall_score', 0)
        
        if overall_score < 70:
            recommendations.append("全体的な内容の充実度を向上させてください")
        
        if overall_score < 80:
            recommendations.append("より具体的な数値データと根拠を追加してください")
        
        if overall_score < 90:
            recommendations.append("競合優位性をより明確に示してください")
        
        # セクション別の改善提案
        section_scores = quality_report.get('section_scores', {})
        
        for section, score in section_scores.items():
            if score < 70:
                if section == 'market_analysis':
                    recommendations.append("市場分析により詳細なデータと分析を追加してください")
                elif section == 'financial_plan':
                    recommendations.append("財務計画の根拠と実現可能性を強化してください")
                elif section == 'implementation':
                    recommendations.append("実施計画をより具体的で実現可能なものにしてください")
        
        return recommendations[:5]  # 最大5つの提案

# 設定定数の追加
RECONSTRUCTION_CONFIG = {
    "max_subsidy_amounts": {
        "small": 100000000,    # 従業員20名以下
        "medium": 120000000,   # 従業員21-50名
        "large": 150000000     # 従業員51名以上
    },
    "subsidy_rate": 0.75,      # 補助率75%
    "min_sales_decline": 10.0,  # 最低売上減少率10%
    "required_support_org": True,  # 認定支援機関必須
    
    "reconstruction_types": [
        "新分野展開",
        "事業転換", 
        "業種転換",
        "業態転換",
        "事業再編"
    ],
    
    "evaluation_criteria": {
        "business_model_innovation": 30,
        "market_potential": 25,
        "financial_feasibility": 25,
        "implementation_capability": 15,
        "policy_significance": 5
    }
}