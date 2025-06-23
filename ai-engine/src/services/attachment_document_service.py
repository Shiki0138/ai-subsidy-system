"""
添付書類自動作成サービス
補助金申請に必要な各種添付書類の自動生成機能
"""

from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
import asyncio
import logging
import json
from decimal import Decimal
import re

logger = logging.getLogger(__name__)


class DocumentType(Enum):
    """書類タイプ"""
    BUSINESS_PLAN = "business_plan"              # 事業計画書
    BUDGET_PLAN = "budget_plan"                  # 予算計画書
    ESTIMATE = "estimate"                        # 見積書
    FINANCIAL_STATEMENT = "financial_statement"  # 財務諸表
    MARKET_ANALYSIS = "market_analysis"          # 市場分析書
    TECHNICAL_SPEC = "technical_spec"            # 技術仕様書
    IMPLEMENTATION_PLAN = "implementation_plan"   # 実施計画書
    RISK_ASSESSMENT = "risk_assessment"          # リスク評価書
    PROGRESS_REPORT = "progress_report"          # 進捗報告書
    COMPLETION_REPORT = "completion_report"      # 完了報告書


class DocumentFormat(Enum):
    """書類フォーマット"""
    PDF = "pdf"
    WORD = "word"
    EXCEL = "excel"
    POWERPOINT = "powerpoint"
    HTML = "html"


class DocumentSection(Enum):
    """書類セクション"""
    EXECUTIVE_SUMMARY = "executive_summary"
    INTRODUCTION = "introduction"
    OBJECTIVES = "objectives"
    METHODOLOGY = "methodology"
    ANALYSIS = "analysis"
    RESULTS = "results"
    RECOMMENDATIONS = "recommendations"
    IMPLEMENTATION = "implementation"
    BUDGET = "budget"
    TIMELINE = "timeline"
    RISKS = "risks"
    APPENDIX = "appendix"


@dataclass
class DocumentTemplate:
    """書類テンプレート"""
    template_id: str
    name: str
    document_type: DocumentType
    format: DocumentFormat
    sections: List[DocumentSection]
    required_data: List[str]
    optional_data: List[str] = field(default_factory=list)
    style_guide: Dict[str, Any] = field(default_factory=dict)
    validation_rules: Dict[str, Any] = field(default_factory=dict)


@dataclass
class SectionContent:
    """セクションコンテンツ"""
    section: DocumentSection
    title: str
    content: str
    formatting: Dict[str, Any] = field(default_factory=dict)
    charts: List[Dict[str, Any]] = field(default_factory=list)
    tables: List[Dict[str, Any]] = field(default_factory=list)
    images: List[str] = field(default_factory=list)


@dataclass
class DocumentGenerationRequest:
    """書類生成リクエスト"""
    template_id: str
    project_data: Dict[str, Any]
    customization: Dict[str, Any] = field(default_factory=dict)
    format_preferences: Dict[str, Any] = field(default_factory=dict)
    ai_enhancement: bool = True
    review_required: bool = True


@dataclass
class GeneratedDocument:
    """生成済み書類"""
    document_id: str
    template_id: str
    document_type: DocumentType
    title: str
    sections: List[SectionContent]
    metadata: Dict[str, Any]
    generated_date: datetime
    format: DocumentFormat
    file_path: Optional[str] = None
    word_count: int = 0
    page_count: int = 0
    quality_score: float = 0.0
    review_status: str = "draft"


class AttachmentDocumentService:
    """添付書類自動作成サービス"""
    
    def __init__(self):
        self.templates = {}
        self.generated_documents = {}
        self.ai_service = None  # AI サービスの注入
        self._initialize_templates()
    
    
    def _initialize_templates(self):
        """書類テンプレートの初期化"""
        
        # 事業計画書テンプレート
        business_plan_template = DocumentTemplate(
            template_id="business_plan_standard",
            name="標準事業計画書",
            document_type=DocumentType.BUSINESS_PLAN,
            format=DocumentFormat.PDF,
            sections=[
                DocumentSection.EXECUTIVE_SUMMARY,
                DocumentSection.INTRODUCTION,
                DocumentSection.OBJECTIVES,
                DocumentSection.ANALYSIS,
                DocumentSection.METHODOLOGY,
                DocumentSection.IMPLEMENTATION,
                DocumentSection.BUDGET,
                DocumentSection.TIMELINE,
                DocumentSection.RISKS
            ],
            required_data=[
                "company_info", "project_overview", "target_market",
                "competitive_analysis", "financial_projections"
            ],
            optional_data=[
                "team_info", "partnerships", "intellectual_property"
            ],
            style_guide={
                "font_family": "游ゴシック",
                "font_size": 11,
                "line_spacing": 1.5,
                "margin": {"top": 25, "bottom": 25, "left": 20, "right": 20},
                "header_footer": True
            }
        )
        
        # 予算計画書テンプレート
        budget_plan_template = DocumentTemplate(
            template_id="budget_plan_detailed",
            name="詳細予算計画書",
            document_type=DocumentType.BUDGET_PLAN,
            format=DocumentFormat.EXCEL,
            sections=[
                DocumentSection.EXECUTIVE_SUMMARY,
                DocumentSection.BUDGET,
                DocumentSection.ANALYSIS
            ],
            required_data=[
                "project_budget", "cost_breakdown", "funding_sources"
            ],
            optional_data=[
                "contingency_plans", "cost_assumptions"
            ]
        )
        
        # 見積書テンプレート
        estimate_template = DocumentTemplate(
            template_id="estimate_standard",
            name="標準見積書",
            document_type=DocumentType.ESTIMATE,
            format=DocumentFormat.PDF,
            sections=[
                DocumentSection.INTRODUCTION,
                DocumentSection.BUDGET
            ],
            required_data=[
                "vendor_info", "item_list", "pricing", "terms"
            ],
            style_guide={
                "font_family": "MS P明朝",
                "font_size": 10,
                "formal_layout": True
            }
        )
        
        # 市場分析書テンプレート
        market_analysis_template = DocumentTemplate(
            template_id="market_analysis_comprehensive",
            name="包括的市場分析書",
            document_type=DocumentType.MARKET_ANALYSIS,
            format=DocumentFormat.PDF,
            sections=[
                DocumentSection.EXECUTIVE_SUMMARY,
                DocumentSection.INTRODUCTION,
                DocumentSection.ANALYSIS,
                DocumentSection.RESULTS,
                DocumentSection.RECOMMENDATIONS
            ],
            required_data=[
                "market_size", "target_segments", "competitor_analysis",
                "trends", "opportunities"
            ]
        )
        
        # 実施計画書テンプレート
        implementation_plan_template = DocumentTemplate(
            template_id="implementation_plan_detailed",
            name="詳細実施計画書",
            document_type=DocumentType.IMPLEMENTATION_PLAN,
            format=DocumentFormat.PDF,
            sections=[
                DocumentSection.OBJECTIVES,
                DocumentSection.METHODOLOGY,
                DocumentSection.IMPLEMENTATION,
                DocumentSection.TIMELINE,
                DocumentSection.RISKS
            ],
            required_data=[
                "project_scope", "milestones", "resources", "timeline"
            ]
        )
        
        self.templates = {
            "business_plan_standard": business_plan_template,
            "budget_plan_detailed": budget_plan_template,
            "estimate_standard": estimate_template,
            "market_analysis_comprehensive": market_analysis_template,
            "implementation_plan_detailed": implementation_plan_template
        }
    
    
    async def generate_document(
        self,
        request: DocumentGenerationRequest
    ) -> GeneratedDocument:
        """書類自動生成"""
        
        if request.template_id not in self.templates:
            raise ValueError(f"テンプレートが見つかりません: {request.template_id}")
        
        template = self.templates[request.template_id]
        document_id = f"doc_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"書類生成開始: {document_id} - {template.name}")
        
        # データ検証
        await self._validate_input_data(template, request.project_data)
        
        # セクション生成
        sections = await self._generate_sections(
            template, request.project_data, request.customization
        )
        
        # AI による内容強化
        if request.ai_enhancement and self.ai_service:
            sections = await self._enhance_with_ai(sections, request.project_data)
        
        # 書類タイトル生成
        title = await self._generate_document_title(
            template, request.project_data
        )
        
        # 品質評価
        quality_score = await self._evaluate_document_quality(sections)
        
        # メタデータ生成
        metadata = self._generate_metadata(template, request, sections)
        
        document = GeneratedDocument(
            document_id=document_id,
            template_id=request.template_id,
            document_type=template.document_type,
            title=title,
            sections=sections,
            metadata=metadata,
            generated_date=datetime.now(),
            format=template.format,
            quality_score=quality_score
        )
        
        # ファイル出力
        if request.format_preferences.get("auto_export", True):
            document.file_path = await self._export_document(document)
        
        # 統計情報更新
        document.word_count = self._count_words(sections)
        document.page_count = self._estimate_page_count(sections, template.format)
        
        self.generated_documents[document_id] = document
        
        logger.info(f"書類生成完了: {document_id} - 品質スコア: {quality_score:.1f}")
        return document
    
    
    async def _validate_input_data(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any]
    ):
        """入力データの検証"""
        
        missing_required = []
        for required_field in template.required_data:
            if required_field not in project_data:
                missing_required.append(required_field)
        
        if missing_required:
            raise ValueError(f"必須データが不足しています: {', '.join(missing_required)}")
    
    
    async def _generate_sections(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> List[SectionContent]:
        """セクションコンテンツ生成"""
        
        sections = []
        
        for section_type in template.sections:
            content = await self._generate_section_content(
                section_type, template, project_data, customization
            )
            sections.append(content)
        
        return sections
    
    
    async def _generate_section_content(
        self,
        section_type: DocumentSection,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """個別セクションコンテンツ生成"""
        
        section_generators = {
            DocumentSection.EXECUTIVE_SUMMARY: self._generate_executive_summary,
            DocumentSection.INTRODUCTION: self._generate_introduction,
            DocumentSection.OBJECTIVES: self._generate_objectives,
            DocumentSection.ANALYSIS: self._generate_analysis,
            DocumentSection.METHODOLOGY: self._generate_methodology,
            DocumentSection.IMPLEMENTATION: self._generate_implementation,
            DocumentSection.BUDGET: self._generate_budget,
            DocumentSection.TIMELINE: self._generate_timeline,
            DocumentSection.RISKS: self._generate_risks,
            DocumentSection.RESULTS: self._generate_results,
            DocumentSection.RECOMMENDATIONS: self._generate_recommendations
        }
        
        generator = section_generators.get(section_type)
        if generator:
            return await generator(template, project_data, customization)
        else:
            # デフォルトセクション生成
            return SectionContent(
                section=section_type,
                title=section_type.value.replace("_", " ").title(),
                content="このセクションの内容は自動生成されます。"
            )
    
    
    async def _generate_executive_summary(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """エグゼクティブサマリー生成"""
        
        company_info = project_data.get("company_info", {})
        project_overview = project_data.get("project_overview", {})
        
        company_name = company_info.get("name", "当社")
        project_name = project_overview.get("name", "本プロジェクト")
        objectives = project_overview.get("objectives", [])
        
        content = f"""
        【エグゼクティブサマリー】
        
        {company_name}は、{project_name}の実施により、以下の目標達成を目指します。
        
        ■ プロジェクト概要
        {project_overview.get('description', 'プロジェクトの詳細な説明が記載されます。')}
        
        ■ 主要目標
        """
        
        for i, objective in enumerate(objectives[:3], 1):
            content += f"{i}. {objective}\n        "
        
        expected_results = project_overview.get("expected_results", {})
        if expected_results:
            content += f"""
        
        ■ 期待される成果
        - 売上向上: {expected_results.get('revenue_increase', 'XX')}%
        - 顧客獲得: {expected_results.get('customer_acquisition', 'XX')}件
        - 効率化: {expected_results.get('efficiency_gain', 'XX')}%改善
        
        本プロジェクトの成功により、{company_name}の持続的成長と競争力強化を実現します。
        """
        
        return SectionContent(
            section=DocumentSection.EXECUTIVE_SUMMARY,
            title="エグゼクティブサマリー",
            content=content.strip()
        )
    
    
    async def _generate_introduction(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """はじめに セクション生成"""
        
        company_info = project_data.get("company_info", {})
        project_overview = project_data.get("project_overview", {})
        
        content = f"""
        【はじめに】
        
        本書は、{company_info.get('name', '当社')}が実施する「{project_overview.get('name', 'プロジェクト')}」に関する詳細な計画書です。
        
        ■ 背景
        {project_overview.get('background', '市場環境の変化と顧客ニーズの多様化により、新たな取り組みが必要となっています。')}
        
        ■ 目的
        {project_overview.get('purpose', 'このプロジェクトにより、事業の持続的成長と競争力の向上を目指します。')}
        
        ■ 本書の構成
        本書では、プロジェクトの目標、実施方法、期待される成果について詳細に説明します。
        """
        
        return SectionContent(
            section=DocumentSection.INTRODUCTION,
            title="はじめに",
            content=content.strip()
        )
    
    
    async def _generate_objectives(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """目標 セクション生成"""
        
        project_overview = project_data.get("project_overview", {})
        objectives = project_overview.get("objectives", [])
        kpis = project_data.get("kpis", [])
        
        content = """
        【プロジェクト目標】
        
        ■ 主要目標
        """
        
        if objectives:
            for i, objective in enumerate(objectives, 1):
                content += f"{i}. {objective}\n        "
        else:
            content += """1. 販路開拓による売上向上
        2. 生産性改善による効率化
        3. 顧客満足度の向上
        """
        
        if kpis:
            content += "\n        ■ 成功指標（KPI）\n        "
            for kpi in kpis:
                content += f"- {kpi.get('name', 'KPI名')}: {kpi.get('target', '目標値')}{kpi.get('unit', '')}\n        "
        
        content += """
        
        ■ 成功の定義
        上記目標の達成により、企業の持続的成長と市場競争力の向上を実現します。
        """
        
        return SectionContent(
            section=DocumentSection.OBJECTIVES,
            title="プロジェクト目標",
            content=content.strip()
        )
    
    
    async def _generate_budget(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """予算 セクション生成"""
        
        budget_data = project_data.get("project_budget", {})
        cost_breakdown = project_data.get("cost_breakdown", [])
        
        content = """
        【予算計画】
        
        ■ 総予算
        """
        
        total_budget = budget_data.get("total", 0)
        content += f"総額: ¥{total_budget:,}\n        "
        
        if cost_breakdown:
            content += "\n        ■ 費用内訳\n        "
            
            # テーブル形式のデータ生成
            table_data = {
                "headers": ["項目", "金額", "比率", "説明"],
                "rows": []
            }
            
            for item in cost_breakdown:
                amount = item.get("amount", 0)
                ratio = (amount / total_budget * 100) if total_budget > 0 else 0
                
                content += f"- {item.get('category', '項目')}: ¥{amount:,} ({ratio:.1f}%)\n        "
                
                table_data["rows"].append([
                    item.get("category", "項目"),
                    f"¥{amount:,}",
                    f"{ratio:.1f}%",
                    item.get("description", "説明")
                ])
        
        funding_sources = project_data.get("funding_sources", [])
        if funding_sources:
            content += "\n        ■ 資金調達\n        "
            for source in funding_sources:
                content += f"- {source.get('source', '資金源')}: ¥{source.get('amount', 0):,}\n        "
        
        section_content = SectionContent(
            section=DocumentSection.BUDGET,
            title="予算計画",
            content=content.strip()
        )
        
        # テーブルデータの追加
        if cost_breakdown:
            section_content.tables.append(table_data)
        
        return section_content
    
    
    async def _generate_timeline(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """タイムライン セクション生成"""
        
        project_timeline = project_data.get("timeline", {})
        milestones = project_data.get("milestones", [])
        
        content = """
        【実施スケジュール】
        
        ■ プロジェクト期間
        """
        
        start_date = project_timeline.get("start_date", "2024年4月1日")
        end_date = project_timeline.get("end_date", "2024年12月31日")
        content += f"期間: {start_date} ～ {end_date}\n        "
        
        if milestones:
            content += "\n        ■ 主要マイルストーン\n        "
            
            # ガントチャート風のデータ生成
            chart_data = {
                "type": "gantt",
                "title": "プロジェクトタイムライン",
                "data": []
            }
            
            for milestone in milestones:
                target_date = milestone.get("target_date", "未定")
                content += f"- {milestone.get('name', 'マイルストーン')}: {target_date}\n        "
                
                chart_data["data"].append({
                    "task": milestone.get("name", "マイルストーン"),
                    "start": milestone.get("start_date", start_date),
                    "end": target_date,
                    "progress": milestone.get("progress", 0)
                })
        
        phases = project_data.get("phases", [])
        if phases:
            content += "\n        ■ 実施フェーズ\n        "
            for i, phase in enumerate(phases, 1):
                content += f"フェーズ{i}: {phase.get('name', 'フェーズ名')}\n        "
                content += f"  期間: {phase.get('duration', 'XX')}ヶ月\n        "
                content += f"  主要活動: {phase.get('activities', ['活動内容'])}\n        "
        
        section_content = SectionContent(
            section=DocumentSection.TIMELINE,
            title="実施スケジュール",
            content=content.strip()
        )
        
        # チャートデータの追加
        if milestones:
            section_content.charts.append(chart_data)
        
        return section_content
    
    
    async def _generate_analysis(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """分析 セクション生成"""
        
        market_analysis = project_data.get("market_analysis", {})
        competitive_analysis = project_data.get("competitive_analysis", {})
        
        content = """
        【市場・競合分析】
        
        ■ 市場環境
        """
        
        market_size = market_analysis.get("market_size", {})
        content += f"市場規模: {market_size.get('value', 'XX')}億円 (年間成長率: {market_size.get('growth_rate', 'X')}%)\n        "
        
        trends = market_analysis.get("trends", [])
        if trends:
            content += "\n        市場トレンド:\n        "
            for trend in trends:
                content += f"- {trend}\n        "
        
        competitors = competitive_analysis.get("competitors", [])
        if competitors:
            content += "\n        ■ 競合状況\n        "
            
            # 競合比較テーブル
            table_data = {
                "headers": ["企業名", "市場シェア", "強み", "弱み"],
                "rows": []
            }
            
            for competitor in competitors:
                content += f"- {competitor.get('name', '競合企業')}: シェア{competitor.get('market_share', 'X')}%\n        "
                
                table_data["rows"].append([
                    competitor.get("name", "競合企業"),
                    f"{competitor.get('market_share', 'X')}%",
                    competitor.get("strengths", "強み"),
                    competitor.get("weaknesses", "弱み")
                ])
        
        opportunities = market_analysis.get("opportunities", [])
        if opportunities:
            content += "\n        ■ 事業機会\n        "
            for opportunity in opportunities:
                content += f"- {opportunity}\n        "
        
        section_content = SectionContent(
            section=DocumentSection.ANALYSIS,
            title="市場・競合分析",
            content=content.strip()
        )
        
        # テーブルデータの追加
        if competitors:
            section_content.tables.append(table_data)
        
        return section_content
    
    
    async def _generate_methodology(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """手法 セクション生成"""
        
        methodology = project_data.get("methodology", {})
        approach = methodology.get("approach", "段階的アプローチ")
        
        content = f"""
        【実施手法】
        
        ■ アプローチ
        {approach}
        
        ■ 実施方法
        """
        
        methods = methodology.get("methods", [])
        if methods:
            for i, method in enumerate(methods, 1):
                content += f"{i}. {method.get('name', '手法名')}\n        "
                content += f"   {method.get('description', '手法の説明')}\n        "
        
        tools = methodology.get("tools", [])
        if tools:
            content += "\n        ■ 使用ツール・技術\n        "
            for tool in tools:
                content += f"- {tool}\n        "
        
        quality_assurance = methodology.get("quality_assurance", [])
        if quality_assurance:
            content += "\n        ■ 品質保証\n        "
            for qa_item in quality_assurance:
                content += f"- {qa_item}\n        "
        
        return SectionContent(
            section=DocumentSection.METHODOLOGY,
            title="実施手法",
            content=content.strip()
        )
    
    
    async def _generate_implementation(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """実施計画 セクション生成"""
        
        implementation = project_data.get("implementation", {})
        
        content = """
        【実施計画】
        
        ■ 実施体制
        """
        
        team = implementation.get("team", [])
        if team:
            for member in team:
                role = member.get("role", "担当者")
                name = member.get("name", "氏名")
                responsibilities = member.get("responsibilities", [])
                
                content += f"- {role}: {name}\n        "
                if responsibilities:
                    content += f"  責任範囲: {', '.join(responsibilities)}\n        "
        
        resources = implementation.get("resources", {})
        if resources:
            content += "\n        ■ 必要リソース\n        "
            for resource_type, resource_list in resources.items():
                content += f"- {resource_type}:\n        "
                for resource in resource_list:
                    content += f"  • {resource}\n        "
        
        success_criteria = implementation.get("success_criteria", [])
        if success_criteria:
            content += "\n        ■ 成功基準\n        "
            for criterion in success_criteria:
                content += f"- {criterion}\n        "
        
        return SectionContent(
            section=DocumentSection.IMPLEMENTATION,
            title="実施計画",
            content=content.strip()
        )
    
    
    async def _generate_risks(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """リスク セクション生成"""
        
        risks = project_data.get("risks", [])
        
        content = """
        【リスク分析・対策】
        """
        
        if risks:
            # リスクマトリックステーブル
            table_data = {
                "headers": ["リスク項目", "発生確率", "影響度", "対策", "責任者"],
                "rows": []
            }
            
            for risk in risks:
                risk_name = risk.get("name", "リスク項目")
                probability = risk.get("probability", "中")
                impact = risk.get("impact", "中")
                mitigation = risk.get("mitigation", "対策を検討中")
                owner = risk.get("owner", "担当者")
                
                content += f"""
        ■ {risk_name}
        - 発生確率: {probability}
        - 影響度: {impact}
        - 対策: {mitigation}
        - 責任者: {owner}
        """
                
                table_data["rows"].append([
                    risk_name, probability, impact, mitigation, owner
                ])
        else:
            content += """
        現時点で特定されている主要リスクは以下の通りです。
        
        ■ 技術的リスク
        - 新技術導入に伴う学習コスト
        - 対策: 十分な研修期間の確保
        
        ■ 市場リスク
        - 競合他社の新商品投入
        - 対策: 差別化戦略の強化
        
        ■ 運営リスク
        - プロジェクトメンバーの離脱
        - 対策: バックアップ体制の構築
        """
        
        section_content = SectionContent(
            section=DocumentSection.RISKS,
            title="リスク分析・対策",
            content=content.strip()
        )
        
        # テーブルデータの追加
        if risks:
            section_content.tables.append(table_data)
        
        return section_content
    
    
    async def _generate_results(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """結果 セクション生成"""
        
        results = project_data.get("results", {})
        
        content = """
        【期待される成果】
        
        ■ 定量的効果
        """
        
        quantitative_results = results.get("quantitative", {})
        for metric, value in quantitative_results.items():
            content += f"- {metric}: {value}\n        "
        
        qualitative_results = results.get("qualitative", [])
        if qualitative_results:
            content += "\n        ■ 定性的効果\n        "
            for result in qualitative_results:
                content += f"- {result}\n        "
        
        return SectionContent(
            section=DocumentSection.RESULTS,
            title="期待される成果",
            content=content.strip()
        )
    
    
    async def _generate_recommendations(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any],
        customization: Dict[str, Any]
    ) -> SectionContent:
        """推奨事項 セクション生成"""
        
        recommendations = project_data.get("recommendations", [])
        
        content = """
        【推奨事項】
        """
        
        if recommendations:
            for i, recommendation in enumerate(recommendations, 1):
                content += f"""
        {i}. {recommendation.get('title', '推奨事項')}
           {recommendation.get('description', '詳細な説明')}
           優先度: {recommendation.get('priority', '中')}
        """
        else:
            content += """
        1. 継続的な市場調査の実施
           変化する市場環境に対応するため、定期的な調査を推奨
           
        2. 成果指標の定期的見直し
           プロジェクトの進展に応じて、KPIの調整を実施
           
        3. ステークホルダーとの連携強化
           関係者との定期的なコミュニケーション維持
        """
        
        return SectionContent(
            section=DocumentSection.RECOMMENDATIONS,
            title="推奨事項",
            content=content.strip()
        )
    
    
    async def _enhance_with_ai(
        self,
        sections: List[SectionContent],
        project_data: Dict[str, Any]
    ) -> List[SectionContent]:
        """AI による内容強化"""
        
        if not self.ai_service:
            return sections
        
        enhanced_sections = []
        
        for section in sections:
            try:
                # AI による内容改善
                enhanced_content = await self.ai_service.enhance_document_section(
                    section.content, section.section.value, project_data
                )
                
                section.content = enhanced_content.get("content", section.content)
                
                # 追加の図表提案
                if enhanced_content.get("suggested_charts"):
                    section.charts.extend(enhanced_content["suggested_charts"])
                
                if enhanced_content.get("suggested_tables"):
                    section.tables.extend(enhanced_content["suggested_tables"])
                
            except Exception as e:
                logger.warning(f"AI強化エラー {section.section.value}: {e}")
            
            enhanced_sections.append(section)
        
        return enhanced_sections
    
    
    async def _generate_document_title(
        self,
        template: DocumentTemplate,
        project_data: Dict[str, Any]
    ) -> str:
        """書類タイトル生成"""
        
        company_name = project_data.get("company_info", {}).get("name", "")
        project_name = project_data.get("project_overview", {}).get("name", "")
        
        title_templates = {
            DocumentType.BUSINESS_PLAN: f"{company_name} {project_name} 事業計画書",
            DocumentType.BUDGET_PLAN: f"{project_name} 予算計画書",
            DocumentType.ESTIMATE: f"{project_name} 見積書",
            DocumentType.MARKET_ANALYSIS: f"{project_name} 市場分析報告書",
            DocumentType.IMPLEMENTATION_PLAN: f"{project_name} 実施計画書"
        }
        
        return title_templates.get(
            template.document_type,
            f"{project_name} {template.name}"
        )
    
    
    async def _evaluate_document_quality(
        self,
        sections: List[SectionContent]
    ) -> float:
        """書類品質評価"""
        
        total_score = 0.0
        max_score = 0.0
        
        for section in sections:
            # 文字数による評価
            word_count = len(section.content)
            word_score = min(word_count / 500, 1.0) * 20  # 最大20点
            
            # 構造による評価
            structure_score = 15 if section.title and section.content else 0
            
            # 図表による評価
            visual_score = min(len(section.charts) + len(section.tables), 2) * 5  # 最大10点
            
            section_score = word_score + structure_score + visual_score
            total_score += section_score
            max_score += 45  # セクションあたりの最大点
        
        return (total_score / max_score * 100) if max_score > 0 else 0
    
    
    def _generate_metadata(
        self,
        template: DocumentTemplate,
        request: DocumentGenerationRequest,
        sections: List[SectionContent]
    ) -> Dict[str, Any]:
        """メタデータ生成"""
        
        return {
            "template_name": template.name,
            "generation_settings": {
                "ai_enhancement": request.ai_enhancement,
                "review_required": request.review_required,
                "customization": request.customization
            },
            "content_statistics": {
                "section_count": len(sections),
                "has_charts": any(section.charts for section in sections),
                "has_tables": any(section.tables for section in sections),
                "has_images": any(section.images for section in sections)
            },
            "creation_info": {
                "created_by": "AI Document Generator",
                "version": "2.1.0",
                "processing_time": "auto-calculated"
            }
        }
    
    
    def _count_words(self, sections: List[SectionContent]) -> int:
        """単語数カウント"""
        
        total_words = 0
        for section in sections:
            # 日本語文字数をカウント（簡易版）
            text = section.content.replace(" ", "").replace("\n", "")
            total_words += len(text)
        
        return total_words
    
    
    def _estimate_page_count(
        self,
        sections: List[SectionContent],
        format: DocumentFormat
    ) -> int:
        """ページ数推定"""
        
        total_chars = self._count_words(sections)
        
        # フォーマット別の1ページあたり文字数
        chars_per_page = {
            DocumentFormat.PDF: 1400,
            DocumentFormat.WORD: 1400,
            DocumentFormat.HTML: 2000
        }
        
        base_chars = chars_per_page.get(format, 1400)
        estimated_pages = max(1, total_chars // base_chars)
        
        # 図表によるページ数加算
        chart_pages = sum(len(section.charts) for section in sections) * 0.5
        table_pages = sum(len(section.tables) for section in sections) * 0.3
        
        return int(estimated_pages + chart_pages + table_pages)
    
    
    async def _export_document(self, document: GeneratedDocument) -> str:
        """書類ファイル出力"""
        
        file_name = f"{document.document_id}_{document.title}"
        file_extension = {
            DocumentFormat.PDF: ".pdf",
            DocumentFormat.WORD: ".docx",
            DocumentFormat.EXCEL: ".xlsx",
            DocumentFormat.HTML: ".html"
        }.get(document.format, ".pdf")
        
        file_path = f"/tmp/documents/{file_name}{file_extension}"
        
        # 実際の実装では、適切なライブラリを使用してファイル生成
        logger.info(f"書類出力: {file_path}")
        
        return file_path
    
    
    async def get_available_templates(
        self,
        document_type: Optional[DocumentType] = None
    ) -> List[Dict[str, Any]]:
        """利用可能テンプレート一覧取得"""
        
        templates = list(self.templates.values())
        
        if document_type:
            templates = [t for t in templates if t.document_type == document_type]
        
        return [
            {
                "template_id": t.template_id,
                "name": t.name,
                "document_type": t.document_type.value,
                "format": t.format.value,
                "section_count": len(t.sections),
                "required_data": t.required_data,
                "optional_data": t.optional_data
            }
            for t in templates
        ]
    
    
    async def batch_generate_documents(
        self,
        requests: List[DocumentGenerationRequest]
    ) -> List[GeneratedDocument]:
        """一括書類生成"""
        
        results = []
        
        # 並列処理で複数書類を同時生成
        generation_tasks = [
            self.generate_document(request) for request in requests
        ]
        
        generated_docs = await asyncio.gather(*generation_tasks, return_exceptions=True)
        
        for i, result in enumerate(generated_docs):
            if isinstance(result, Exception):
                logger.error(f"書類生成エラー {i}: {result}")
            else:
                results.append(result)
        
        return results
    
    
    def set_ai_service(self, ai_service):
        """AI サービスの設定"""
        self.ai_service = ai_service