"""
ものづくり補助金（Manufacturing Subsidy）専用サービス
簡単な入力で採択率の高い申請書を自動生成
"""

from typing import Dict, List, Any
import json
from datetime import datetime
from .ai_writing_assistant import AIWritingAssistant
from .document_quality_analyzer import DocumentQualityAnalyzer
from ..templates.application_template_manager import ApplicationTemplateManager
from ..config.subsidy_config import MONOZUKURI_CONFIG

class MonozukuriSubsidyService:
    """ものづくり補助金申請書自動生成サービス"""
    
    def __init__(self):
        self.ai_assistant = AIWritingAssistant()
        self.quality_analyzer = DocumentQualityAnalyzer()
        self.template_manager = ApplicationTemplateManager()
        
    def generate_from_simple_input(self, simple_input: Dict[str, Any]) -> Dict[str, Any]:
        """
        簡単な5-7個の質問から完全な申請書を生成
        
        Args:
            simple_input: {
                "equipment_type": "導入する設備・技術",
                "problem_to_solve": "解決する課題",
                "productivity_improvement": "生産性向上率(%)",
                "investment_amount": "投資額(円)",
                "implementation_period": "実施期間(月)",
                "industry": "業種",
                "company_size": "従業員数"
            }
        
        Returns:
            完全な申請書データ
        """
        # 簡単な入力から詳細な申請内容を拡張
        expanded_data = self._expand_simple_input(simple_input)
        
        # 採択率を高めるキーワードと構成を最適化
        optimized_data = self._optimize_for_adoption(expanded_data)
        
        # 申請書セクションを生成
        application_sections = self._generate_all_sections(optimized_data)
        
        # 品質分析と改善
        quality_report = self.quality_analyzer.analyze_document(application_sections)
        if quality_report['overall_score'] < 85:
            application_sections = self._improve_sections(application_sections, quality_report)
        
        return {
            "application_data": application_sections,
            "quality_score": quality_report['overall_score'],
            "adoption_probability": self._calculate_adoption_probability(application_sections),
            "generated_at": datetime.now().isoformat(),
            "simple_input": simple_input
        }
    
    def _expand_simple_input(self, simple_input: Dict[str, Any]) -> Dict[str, Any]:
        """簡単な入力から詳細なデータを生成"""
        
        # 業種別の成功パターンを適用
        industry_patterns = self._get_industry_success_patterns(simple_input['industry'])
        
        expanded = {
            **simple_input,
            "technical_innovation": self._generate_technical_innovation(
                simple_input['equipment_type'],
                simple_input['problem_to_solve']
            ),
            "market_competitiveness": self._analyze_market_competitiveness(
                simple_input['industry'],
                simple_input['equipment_type']
            ),
            "economic_effects": self._calculate_economic_effects(
                simple_input['investment_amount'],
                simple_input['productivity_improvement']
            ),
            "implementation_plan": self._create_implementation_plan(
                simple_input['implementation_period'],
                simple_input['equipment_type']
            ),
            "risk_mitigation": self._generate_risk_mitigation_strategies(
                simple_input['equipment_type'],
                simple_input['company_size']
            ),
            **industry_patterns
        }
        
        return expanded
    
    def _optimize_for_adoption(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """採択率を高めるための最適化"""
        
        # 高評価キーワードを追加
        high_score_keywords = [
            "革新的", "生産性向上", "競争力強化", "DX推進",
            "カーボンニュートラル", "サプライチェーン強化",
            "技術伝承", "働き方改革", "品質向上", "コスト削減"
        ]
        
        # 評価項目に対応した内容を強化
        evaluation_criteria = {
            "技術的革新性": self._enhance_technical_innovation(data),
            "事業化可能性": self._enhance_business_feasibility(data),
            "収益性向上": self._enhance_profitability(data),
            "政策的意義": self._enhance_policy_significance(data)
        }
        
        return {
            **data,
            "keywords": high_score_keywords,
            "evaluation_responses": evaluation_criteria
        }
    
    def _generate_all_sections(self, data: Dict[str, Any]) -> Dict[str, str]:
        """全セクションの生成"""
        
        sections = {
            "事業計画名": self._generate_project_title(data),
            "事業の背景・目的": self._generate_background_purpose(data),
            "技術的課題と解決方法": self._generate_technical_solution(data),
            "導入設備の詳細": self._generate_equipment_details(data),
            "実施体制": self._generate_implementation_structure(data),
            "市場性・将来性": self._generate_market_analysis(data),
            "収支計画": self._generate_financial_plan(data),
            "効果測定方法": self._generate_effect_measurement(data),
            "スケジュール": self._generate_schedule(data),
            "添付書類リスト": self._generate_attachment_list(data)
        }
        
        return sections
    
    def _generate_technical_innovation(self, equipment_type: str, problem: str) -> str:
        """技術的革新性の説明を生成"""
        prompt = f"""
        以下の情報から、ものづくり補助金の「技術的革新性」セクションを生成してください：
        
        導入設備・技術: {equipment_type}
        解決する課題: {problem}
        
        以下の要素を含めてください：
        1. 現状の技術課題の詳細分析
        2. 導入技術の革新的な点（3つ以上）
        3. 業界標準と比較した優位性
        4. 技術的な実現可能性の根拠
        
        説得力のある具体的な内容で、300-400文字で作成してください。
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _calculate_adoption_probability(self, sections: Dict[str, str]) -> float:
        """採択確率を計算"""
        
        # 各評価項目のスコアを計算
        scores = {
            "technical_score": self._evaluate_technical_content(sections),
            "business_score": self._evaluate_business_content(sections),
            "completeness_score": self._evaluate_completeness(sections),
            "keyword_score": self._evaluate_keyword_usage(sections)
        }
        
        # 重み付け平均で採択確率を算出
        weights = {
            "technical_score": 0.35,
            "business_score": 0.30,
            "completeness_score": 0.20,
            "keyword_score": 0.15
        }
        
        probability = sum(scores[key] * weights[key] for key in scores) / 100
        
        return min(probability * 100, 95)  # 最大95%
    
    def _get_industry_success_patterns(self, industry: str) -> Dict[str, Any]:
        """業種別の成功パターンを取得"""
        
        # 業種別の成功パターンデータベース（実際はDBから取得）
        patterns = {
            "製造業": {
                "success_keywords": ["IoT", "AI", "自動化", "品質管理"],
                "typical_improvements": "生産効率30%向上、不良率50%削減",
                "recommended_equipment": ["CNC工作機械", "協働ロボット", "画像検査装置"]
            },
            "金属加工": {
                "success_keywords": ["高精度", "短納期", "多品種少量"],
                "typical_improvements": "加工時間40%短縮、精度2倍向上",
                "recommended_equipment": ["5軸加工機", "レーザー加工機", "CAD/CAM"]
            }
        }
        
        return patterns.get(industry, patterns["製造業"])
    
    def get_quick_assessment(self, simple_input: Dict[str, Any]) -> Dict[str, Any]:
        """簡易評価を実施"""
        
        # 基本チェック
        if simple_input['investment_amount'] < 1000000:
            return {
                "eligible": False,
                "reason": "投資額が最低要件（100万円）を下回っています"
            }
        
        if simple_input['productivity_improvement'] < 3:
            return {
                "eligible": True,
                "warning": "生産性向上率が低いため、採択率が下がる可能性があります",
                "suggestion": "より具体的な改善効果を数値化することをお勧めします"
            }
        
        return {
            "eligible": True,
            "estimated_subsidy": simple_input['investment_amount'] * 0.5,
            "adoption_estimate": "高",
            "recommendations": self._get_quick_recommendations(simple_input)
        }
    
    def _get_quick_recommendations(self, simple_input: Dict[str, Any]) -> List[str]:
        """クイック推奨事項を生成"""
        recommendations = []
        
        if simple_input['productivity_improvement'] < 10:
            recommendations.append("生産性向上率をより詳細に分析し、10%以上を目指すことを推奨")
        
        if "デジタル" not in simple_input['equipment_type'] and "IT" not in simple_input['equipment_type']:
            recommendations.append("DX要素を含めることで評価が向上する可能性があります")
        
        if simple_input['implementation_period'] > 12:
            recommendations.append("実施期間を12ヶ月以内に短縮することを検討してください")
        
        return recommendations
    
    # 以下、各種ヘルパーメソッド
    def _enhance_technical_innovation(self, data: Dict[str, Any]) -> str:
        """技術的革新性を強化"""
        return self.ai_assistant.enhance_content(
            data.get('technical_innovation', ''),
            "技術的革新性を強調し、具体的な数値と比較優位性を追加"
        )
    
    def _enhance_business_feasibility(self, data: Dict[str, Any]) -> str:
        """事業化可能性を強化"""
        return self.ai_assistant.enhance_content(
            data.get('market_competitiveness', ''),
            "市場性と実現可能性を具体的に説明"
        )
    
    def _enhance_profitability(self, data: Dict[str, Any]) -> str:
        """収益性向上を強化"""
        return self.ai_assistant.enhance_content(
            data.get('economic_effects', ''),
            "ROIと収益向上の具体的数値を追加"
        )
    
    def _enhance_policy_significance(self, data: Dict[str, Any]) -> str:
        """政策的意義を強化"""
        keywords = ["地域経済活性化", "雇用創出", "カーボンニュートラル", "サプライチェーン強化"]
        return f"本事業は{', '.join(keywords)}に貢献し、国の製造業強化政策に合致します。"
    
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
                    f"{section_key}の内容を採択率向上のために最適化"
                )
                optimized_data[section_key] = optimized_content
        
        return optimized_data
    
    def _calculate_quality_score(self, data: Dict[str, Any]) -> float:
        """申請書の品質スコアを計算"""
        score = 0.0
        max_score = 100.0
        
        # 各セクションの完成度をチェック
        required_sections = [
            '事業計画名', '事業の背景・目的', '技術的課題と解決方法',
            '導入設備の詳細', '実施体制', '市場性・将来性',
            '収支計画', '効果測定方法', 'スケジュール'
        ]
        
        section_score = 0
        for section in required_sections:
            if section in data and data[section] and len(data[section]) > 50:
                section_score += 10
        
        score += section_score
        
        # 品質指標をチェック
        quality_indicators = self._check_quality_indicators(data)
        score += quality_indicators * 10
        
        return min(score, max_score)
    
    def _check_quality_indicators(self, data: Dict[str, Any]) -> int:
        """品質指標をチェック"""
        indicators = 0
        
        # 高評価キーワードの存在
        high_value_keywords = ['革新的', 'DX', 'IoT', 'AI', '生産性向上', '競争力強化']
        content_text = ' '.join([str(v) for v in data.values() if isinstance(v, str)])
        
        for keyword in high_value_keywords:
            if keyword in content_text:
                indicators += 1
        
        # 数値データの具体性
        if any('%' in str(v) for v in data.values() if isinstance(v, str)):
            indicators += 1
        
        # 具体的な効果の記述
        if any('効果' in str(v) and len(str(v)) > 100 for v in data.values() if isinstance(v, str)):
            indicators += 1
        
        return min(indicators, 5)  # 最大5点
    
    # 各セクション生成メソッドの実装
    def _generate_project_title(self, data: Dict[str, Any]) -> str:
        """事業計画名を生成"""
        equipment = data.get('equipment_type', '新設備')
        industry = data.get('industry', '製造業')
        
        title = f"{equipment}導入による{industry}の生産性向上・競争力強化事業"
        return title
    
    def _generate_background_purpose(self, data: Dict[str, Any]) -> str:
        """事業の背景・目的を生成"""
        problem = data.get('problem_to_solve', '生産効率の課題')
        equipment = data.get('equipment_type', '新設備')
        
        prompt = f"""
        以下の情報から、ものづくり補助金の「事業の背景・目的」セクションを生成してください：
        
        解決する課題: {problem}
        導入設備: {equipment}
        
        以下の要素を含めて300-400文字で作成してください：
        1. 現在の市場環境と課題の深刻さ
        2. 課題解決の必要性と緊急性
        3. 事業実施の目的と意義
        4. 地域経済・業界への貢献
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _generate_technical_solution(self, data: Dict[str, Any]) -> str:
        """技術的課題と解決方法を生成"""
        return data.get('technical_innovation', '') or self._generate_technical_innovation(
            data.get('equipment_type', ''),
            data.get('problem_to_solve', '')
        )
    
    def _generate_equipment_details(self, data: Dict[str, Any]) -> str:
        """導入設備の詳細を生成"""
        equipment = data.get('equipment_type', '')
        investment = data.get('investment_amount', 0)
        
        prompt = f"""
        以下の設備について詳細な仕様と導入計画を作成してください：
        
        設備名: {equipment}
        投資額: {investment:,}円
        
        以下の内容を含めてください：
        1. 設備の詳細仕様
        2. 導入する理由・根拠
        3. 既存設備との比較
        4. 導入後の効果
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _generate_implementation_structure(self, data: Dict[str, Any]) -> str:
        """実施体制を生成"""
        company_size = data.get('company_size', 10)
        
        structure = f"""
        【実施責任者】
        代表取締役社長（事業全体の統括）
        
        【プロジェクトチーム】
        - 技術責任者：製造部長（設備導入・技術指導）
        - 運用責任者：生産管理責任者（日常運用・効果測定）
        - 従業員{company_size}名による協力体制
        
        【外部協力体制】
        - 設備メーカー技術者（導入支援・研修）
        - 経営コンサルタント（効果測定・改善提案）
        """
        
        return structure
    
    def _generate_market_analysis(self, data: Dict[str, Any]) -> str:
        """市場性・将来性を生成"""
        industry = data.get('industry', '製造業')
        
        return data.get('market_competitiveness', '') or f"""
        【市場の現状】
        {industry}市場は競争が激化しており、生産性向上と品質向上が急務となっています。
        
        【本事業の市場性】
        導入する技術により、従来比で大幅な効率化を実現し、競合他社との差別化を図ります。
        
        【将来性】
        デジタル化・自動化の流れは今後さらに加速し、本事業による競争力強化効果は長期にわたって持続します。
        """
    
    def _generate_financial_plan(self, data: Dict[str, Any]) -> str:
        """収支計画を生成"""
        investment = data.get('investment_amount', 0)
        improvement = data.get('productivity_improvement', 10)
        
        return data.get('economic_effects', '') or f"""
        【投資額】
        総事業費：{investment:,}円
        補助金申請額：{int(investment * 0.5):,}円（補助率50%）
        自己負担額：{int(investment * 0.5):,}円
        
        【効果】
        生産性向上率：{improvement}%
        年間売上増加見込：{int(investment * 0.3):,}円
        投資回収期間：約3年
        """
    
    def _generate_effect_measurement(self, data: Dict[str, Any]) -> str:
        """効果測定方法を生成"""
        improvement = data.get('productivity_improvement', 10)
        
        return f"""
        【測定指標】
        1. 生産性：生産数量/作業時間（目標：{improvement}%向上）
        2. 品質：不良率（目標：50%削減）
        3. コスト：単位当たり製造コスト（目標：20%削減）
        
        【測定方法】
        導入前後3ヶ月間のデータを比較し、月次で効果を測定
        
        【報告】
        四半期ごとに効果測定結果を報告書として作成
        """
    
    def _generate_schedule(self, data: Dict[str, Any]) -> str:
        """スケジュールを生成"""
        period = data.get('implementation_period', 6)
        
        return f"""
        【実施スケジュール】（実施期間：{period}ヶ月）
        
        1ヶ月目：設備仕様確定・発注
        2-3ヶ月目：設備製造・準備
        {period-2}ヶ月目：設備導入・設置
        {period-1}ヶ月目：試運転・調整
        {period}ヶ月目：本格稼働開始・効果測定
        """
    
    def _generate_attachment_list(self, data: Dict[str, Any]) -> str:
        """添付書類リストを生成"""
        return """
        【添付書類】
        1. 設備の見積書・仕様書
        2. 事業計画書詳細版
        3. 財務諸表（直近3期分）
        4. 履歴事項全部証明書
        5. 導入予定設備のカタログ
        6. 効果測定計画書
        """
    
    # 評価メソッドの実装
    def _evaluate_technical_content(self, sections: Dict[str, str]) -> float:
        """技術的内容の評価"""
        score = 0.0
        
        # 技術的革新性の評価
        tech_section = sections.get('技術的課題と解決方法', '')
        tech_keywords = ['革新的', 'AI', 'IoT', 'DX', '自動化', '効率化']
        
        for keyword in tech_keywords:
            if keyword in tech_section:
                score += 15
        
        # 設備詳細の具体性
        equipment_section = sections.get('導入設備の詳細', '')
        if len(equipment_section) > 200:
            score += 20
        
        return min(score, 100)
    
    def _evaluate_business_content(self, sections: Dict[str, str]) -> float:
        """事業性内容の評価"""
        score = 0.0
        
        # 市場分析の充実度
        market_section = sections.get('市場性・将来性', '')
        if len(market_section) > 150:
            score += 30
        
        # 収支計画の具体性
        financial_section = sections.get('収支計画', '')
        if '円' in financial_section and '%' in financial_section:
            score += 40
        
        # 効果測定の明確性
        effect_section = sections.get('効果測定方法', '')
        if len(effect_section) > 100:
            score += 30
        
        return min(score, 100)
    
    def _evaluate_completeness(self, sections: Dict[str, str]) -> float:
        """完成度の評価"""
        required_sections = [
            '事業計画名', '事業の背景・目的', '技術的課題と解決方法',
            '導入設備の詳細', '実施体制', '市場性・将来性',
            '収支計画', '効果測定方法', 'スケジュール'
        ]
        
        completed = sum(1 for section in required_sections 
                       if section in sections and len(sections[section]) > 50)
        
        return (completed / len(required_sections)) * 100
    
    def _evaluate_keyword_usage(self, sections: Dict[str, str]) -> float:
        """キーワード使用の評価"""
        high_score_keywords = [
            '革新的', '生産性向上', '競争力強化', 'DX推進',
            'カーボンニュートラル', 'サプライチェーン強化',
            '技術伝承', '働き方改革', '品質向上', 'コスト削減'
        ]
        
        all_text = ' '.join(sections.values())
        
        keyword_score = 0
        for keyword in high_score_keywords:
            if keyword in all_text:
                keyword_score += 10
        
        return min(keyword_score, 100)
    
    # ヘルパーメソッドの実装を完了
    def _analyze_market_competitiveness(self, industry: str, equipment_type: str) -> str:
        """市場競争力を分析"""
        prompt = f"""
        {industry}業界における{equipment_type}導入の市場競争力を分析してください。
        
        以下の観点から200-300文字で分析してください：
        1. 業界の競争状況
        2. 導入技術の差別化要因
        3. 市場での優位性
        4. 今後の市場展望
        """
        
        return self.ai_assistant.generate_content(prompt)
    
    def _calculate_economic_effects(self, investment_amount: int, productivity_improvement: float) -> str:
        """経済効果を計算"""
        annual_sales_increase = int(investment_amount * 0.3)
        cost_reduction = int(investment_amount * 0.2)
        
        return f"""
        【年間経済効果】
        売上増加：{annual_sales_increase:,}円
        コスト削減：{cost_reduction:,}円
        合計効果：{annual_sales_increase + cost_reduction:,}円
        
        【投資効率】
        投資回収期間：{investment_amount / (annual_sales_increase + cost_reduction):.1f}年
        ROI：{((annual_sales_increase + cost_reduction) / investment_amount * 100):.1f}%
        """
    
    def _create_implementation_plan(self, implementation_period: int, equipment_type: str) -> str:
        """実施計画を作成"""
        return f"""
        【{equipment_type}導入計画】（{implementation_period}ヶ月計画）
        
        準備段階（1-2ヶ月）：
        - 設備仕様の最終確定
        - 設置場所の準備工事
        - 作業員への事前研修
        
        導入段階（{max(1, implementation_period//3)}ヶ月）：
        - 設備搬入・設置
        - 初期設定・調整
        
        運用開始（{implementation_period//2}ヶ月）：
        - 試運転・本格稼働
        - 効果測定・改善
        """
    
    def _generate_risk_mitigation_strategies(self, equipment_type: str, company_size: int) -> str:
        """リスク軽減策を生成"""
        return f"""
        【主要リスクと対策】
        
        1. 技術リスク
        - メーカーによる技術サポート契約
        - 段階的導入による影響最小化
        
        2. 運用リスク
        - 従業員{company_size}名への十分な研修実施
        - マニュアル整備と定期的な見直し
        
        3. 財務リスク
        - 段階的な投資実行
        - 効果測定による早期課題発見
        """