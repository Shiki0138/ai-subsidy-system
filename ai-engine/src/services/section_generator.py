"""
セクション別文章生成サービス
補助金申請書の各セクションに特化した高品質文章生成
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import logging
import json

from .application_writer import ApplicationSection, WritingStyle, SectionRequirements, GeneratedSection
from .enhanced_ai_service import EnhancedAIService, AIProvider
from .quality_evaluator import QualityEvaluator
from ..prompts.prompt_manager import PromptManager, PromptType

logger = logging.getLogger(__name__)


@dataclass
class SectionContext:
    """セクション生成コンテキスト"""
    section_type: ApplicationSection
    company_profile: Dict[str, Any]
    project_info: Dict[str, Any]
    subsidy_info: Dict[str, Any]
    custom_data: Dict[str, Any] = field(default_factory=dict)
    reference_data: Dict[str, Any] = field(default_factory=dict)


@dataclass
class GenerationOptions:
    """生成オプション"""
    writing_style: WritingStyle = WritingStyle.FORMAL_BUSINESS
    target_length: int = 400
    creativity_level: float = 0.7  # 0.0-1.0
    technical_depth: str = "medium"  # basic, medium, advanced
    include_examples: bool = True
    include_metrics: bool = True
    personalization_level: str = "high"  # low, medium, high


class SectionGenerator:
    """セクション別文章生成器"""
    
    def __init__(self):
        """初期化"""
        self.ai_service = EnhancedAIService()
        self.quality_evaluator = QualityEvaluator()
        self.prompt_manager = PromptManager()
        
        # セクション別専用プロンプト
        self.section_prompts = self._initialize_section_prompts()
        
        # セクション別生成戦略
        self.generation_strategies = self._initialize_generation_strategies()
        
        # テンプレートデータベース
        self.templates = self._load_section_templates()

    async def generate_company_overview(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """企業概要セクション生成"""
        try:
            if options is None:
                options = GenerationOptions()
            
            company_profile = context.company_profile
            
            # 企業概要特化プロンプト構築
            prompt_context = {
                "company_name": company_profile.get("name", ""),
                "industry": company_profile.get("industry", ""),
                "founded_year": company_profile.get("founded_year", ""),
                "employee_count": company_profile.get("employee_count", 0),
                "business_description": company_profile.get("description", ""),
                "main_products": company_profile.get("products", []),
                "achievements": company_profile.get("achievements", []),
                "certifications": company_profile.get("certifications", []),
                "annual_revenue": company_profile.get("revenue", ""),
                "competitive_advantages": company_profile.get("advantages", []),
                "target_length": options.target_length,
                "writing_style": options.writing_style.value,
                "include_metrics": options.include_metrics
            }
            
            # 企業概要専用プロンプト使用
            content = await self._generate_with_specialized_prompt(
                "company_overview", prompt_context, options
            )
            
            # 企業概要特有の後処理
            content = self._enhance_company_overview(content, company_profile, options)
            
            return await self._create_generated_section(
                ApplicationSection.COMPANY_OVERVIEW,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"企業概要生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.COMPANY_OVERVIEW, context
            )

    async def generate_project_summary(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """事業概要セクション生成"""
        try:
            if options is None:
                options = GenerationOptions()
            
            project_info = context.project_info
            subsidy_info = context.subsidy_info
            
            prompt_context = {
                "project_title": project_info.get("title", ""),
                "project_description": project_info.get("description", ""),
                "project_objectives": project_info.get("objectives", []),
                "target_market": project_info.get("target_market", ""),
                "unique_value": project_info.get("unique_value", ""),
                "subsidy_type": subsidy_info.get("type", ""),
                "subsidy_purpose": subsidy_info.get("purpose", ""),
                "expected_impact": project_info.get("expected_impact", ""),
                "innovation_aspects": project_info.get("innovation", []),
                "target_length": options.target_length,
                "writing_style": options.writing_style.value
            }
            
            content = await self._generate_with_specialized_prompt(
                "project_summary", prompt_context, options
            )
            
            # 事業概要特有の強化
            content = self._enhance_project_summary(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.PROJECT_SUMMARY,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"事業概要生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.PROJECT_SUMMARY, context
            )

    async def generate_current_situation(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """現状・課題セクション生成"""
        try:
            if options is None:
                options = GenerationOptions()
            
            company_profile = context.company_profile
            project_info = context.project_info
            
            prompt_context = {
                "company_name": company_profile.get("name", ""),
                "industry": company_profile.get("industry", ""),
                "current_challenges": project_info.get("challenges", []),
                "market_issues": project_info.get("market_issues", []),
                "internal_issues": project_info.get("internal_issues", []),
                "competitive_pressures": project_info.get("competitive_pressures", []),
                "technology_gaps": project_info.get("technology_gaps", []),
                "regulatory_changes": project_info.get("regulatory_changes", []),
                "customer_needs": project_info.get("customer_needs", []),
                "urgency_factors": project_info.get("urgency", []),
                "target_length": options.target_length,
                "include_metrics": options.include_metrics
            }
            
            content = await self._generate_with_specialized_prompt(
                "current_situation", prompt_context, options
            )
            
            # 現状・課題特有の強化
            content = self._enhance_current_situation(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.CURRENT_SITUATION,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"現状・課題生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.CURRENT_SITUATION, context
            )

    async def generate_project_description(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """事業内容詳細セクション生成"""
        try:
            if options is None:
                options = GenerationOptions(target_length=600)  # より詳細なため長め
            
            project_info = context.project_info
            
            prompt_context = {
                "project_title": project_info.get("title", ""),
                "detailed_description": project_info.get("detailed_description", ""),
                "technical_approach": project_info.get("technical_approach", ""),
                "methodology": project_info.get("methodology", []),
                "key_technologies": project_info.get("technologies", []),
                "development_phases": project_info.get("phases", []),
                "deliverables": project_info.get("deliverables", []),
                "success_criteria": project_info.get("success_criteria", []),
                "quality_standards": project_info.get("quality_standards", []),
                "innovation_elements": project_info.get("innovation_elements", []),
                "technical_depth": options.technical_depth,
                "target_length": options.target_length,
                "include_examples": options.include_examples
            }
            
            content = await self._generate_with_specialized_prompt(
                "project_description", prompt_context, options
            )
            
            # 事業内容詳細特有の強化
            content = self._enhance_project_description(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.PROJECT_DESCRIPTION,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"事業内容詳細生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.PROJECT_DESCRIPTION, context
            )

    async def generate_implementation_plan(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """実施計画・体制セクション生成"""
        try:
            if options is None:
                options = GenerationOptions()
            
            project_info = context.project_info
            company_profile = context.company_profile
            
            prompt_context = {
                "project_duration": project_info.get("duration", ""),
                "project_phases": project_info.get("implementation_phases", []),
                "team_structure": project_info.get("team_structure", {}),
                "key_personnel": project_info.get("key_personnel", []),
                "external_partners": project_info.get("partners", []),
                "management_approach": project_info.get("management_approach", ""),
                "quality_control": project_info.get("quality_control", []),
                "risk_mitigation": project_info.get("risk_mitigation", []),
                "communication_plan": project_info.get("communication", []),
                "milestone_schedule": project_info.get("milestones", []),
                "resource_allocation": project_info.get("resources", {}),
                "company_experience": company_profile.get("project_experience", []),
                "target_length": options.target_length
            }
            
            content = await self._generate_with_specialized_prompt(
                "implementation_plan", prompt_context, options
            )
            
            # 実施計画特有の強化
            content = self._enhance_implementation_plan(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.IMPLEMENTATION_PLAN,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"実施計画生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.IMPLEMENTATION_PLAN, context
            )

    async def generate_expected_outcomes(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """期待効果・成果セクション生成"""
        try:
            if options is None:
                options = GenerationOptions(include_metrics=True)
            
            project_info = context.project_info
            company_profile = context.company_profile
            
            prompt_context = {
                "quantitative_goals": project_info.get("quantitative_goals", []),
                "qualitative_goals": project_info.get("qualitative_goals", []),
                "business_impact": project_info.get("business_impact", {}),
                "market_impact": project_info.get("market_impact", {}),
                "social_impact": project_info.get("social_impact", {}),
                "financial_projections": project_info.get("financial_projections", {}),
                "kpi_indicators": project_info.get("kpi", []),
                "measurement_methods": project_info.get("measurement_methods", []),
                "evaluation_timeline": project_info.get("evaluation_timeline", ""),
                "long_term_benefits": project_info.get("long_term_benefits", []),
                "competitive_advantages": project_info.get("competitive_advantages", []),
                "scalability": project_info.get("scalability", ""),
                "sustainability": project_info.get("sustainability", ""),
                "target_length": options.target_length,
                "include_metrics": options.include_metrics
            }
            
            content = await self._generate_with_specialized_prompt(
                "expected_outcomes", prompt_context, options
            )
            
            # 期待効果特有の強化
            content = self._enhance_expected_outcomes(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.EXPECTED_OUTCOMES,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"期待効果生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.EXPECTED_OUTCOMES, context
            )

    async def generate_market_analysis(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """市場分析セクション生成"""
        try:
            if options is None:
                options = GenerationOptions(include_metrics=True, technical_depth="medium")
            
            project_info = context.project_info
            
            prompt_context = {
                "target_market": project_info.get("target_market", ""),
                "market_size": project_info.get("market_size", {}),
                "market_growth": project_info.get("market_growth", {}),
                "customer_segments": project_info.get("customer_segments", []),
                "competitive_landscape": project_info.get("competitive_landscape", []),
                "market_trends": project_info.get("market_trends", []),
                "market_drivers": project_info.get("market_drivers", []),
                "market_barriers": project_info.get("market_barriers", []),
                "value_proposition": project_info.get("value_proposition", ""),
                "pricing_strategy": project_info.get("pricing_strategy", ""),
                "go_to_market": project_info.get("go_to_market_strategy", ""),
                "market_penetration": project_info.get("market_penetration", {}),
                "target_length": options.target_length,
                "include_metrics": options.include_metrics
            }
            
            content = await self._generate_with_specialized_prompt(
                "market_analysis", prompt_context, options
            )
            
            # 市場分析特有の強化
            content = self._enhance_market_analysis(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.MARKET_ANALYSIS,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"市場分析生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.MARKET_ANALYSIS, context
            )

    async def generate_budget_plan(
        self,
        context: SectionContext,
        options: GenerationOptions = None
    ) -> GeneratedSection:
        """予算計画セクション生成"""
        try:
            if options is None:
                options = GenerationOptions(include_metrics=True, technical_depth="advanced")
            
            project_info = context.project_info
            subsidy_info = context.subsidy_info
            
            prompt_context = {
                "total_budget": project_info.get("total_budget", 0),
                "budget_breakdown": project_info.get("budget_breakdown", {}),
                "personnel_costs": project_info.get("personnel_costs", {}),
                "equipment_costs": project_info.get("equipment_costs", {}),
                "operational_costs": project_info.get("operational_costs", {}),
                "external_costs": project_info.get("external_costs", {}),
                "contingency_budget": project_info.get("contingency", 0),
                "funding_sources": project_info.get("funding_sources", []),
                "cost_justification": project_info.get("cost_justification", {}),
                "roi_projections": project_info.get("roi_projections", {}),
                "cost_efficiency": project_info.get("cost_efficiency", ""),
                "subsidy_amount": subsidy_info.get("requested_amount", 0),
                "subsidy_percentage": subsidy_info.get("coverage_rate", 0),
                "target_length": options.target_length,
                "include_metrics": True  # 予算は必ずメトリクス含む
            }
            
            content = await self._generate_with_specialized_prompt(
                "budget_plan", prompt_context, options
            )
            
            # 予算計画特有の強化
            content = self._enhance_budget_plan(content, project_info, options)
            
            return await self._create_generated_section(
                ApplicationSection.BUDGET_PLAN,
                content, context, options
            )
            
        except Exception as e:
            logger.error(f"予算計画生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                ApplicationSection.BUDGET_PLAN, context
            )

    # 内部メソッド

    async def _generate_with_specialized_prompt(
        self,
        section_key: str,
        prompt_context: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """専用プロンプトを使用した生成"""
        
        # セクション専用プロンプトテンプレート取得
        prompt_template = self.section_prompts.get(section_key, "")
        
        if not prompt_template:
            # フォールバック汎用プロンプト
            prompt_template = self._get_generic_prompt_template()
        
        # プロンプト構築
        try:
            prompt = prompt_template.format(**prompt_context)
        except KeyError as e:
            logger.warning(f"プロンプト変数不足 {e}, 汎用プロンプト使用")
            prompt = self._build_fallback_prompt(section_key, prompt_context)
        
        # AI生成実行
        generation_strategy = self.generation_strategies.get(section_key, {})
        provider = generation_strategy.get("preferred_provider", AIProvider.HYBRID)
        
        response = await self.ai_service.generate_business_plan(
            company_data=prompt_context,
            subsidy_type=prompt_context.get("subsidy_type", "general"),
            provider=provider
        )
        
        if response.success and response.content:
            return response.content
        else:
            # フォールバック生成
            return self._generate_fallback_content(section_key, prompt_context)

    def _enhance_company_overview(
        self,
        content: str,
        company_profile: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """企業概要特有の強化処理"""
        
        enhanced = content
        
        # 設立年数の計算・追加
        founded_year = company_profile.get("founded_year")
        if founded_year and str(founded_year).isdigit():
            years_in_business = datetime.now().year - int(founded_year)
            if f"{years_in_business}年" not in enhanced:
                enhanced = enhanced.replace(
                    f"{founded_year}年設立",
                    f"{founded_year}年設立（{years_in_business}年の実績）"
                )
        
        # 従業員数の表現強化
        employee_count = company_profile.get("employee_count", 0)
        if employee_count > 0 and options.include_metrics:
            if "従業員" in enhanced and "名" not in enhanced:
                enhanced = enhanced.replace("従業員", f"従業員{employee_count}名")
        
        # 業界専門性の強調
        industry = company_profile.get("industry", "")
        if industry and industry not in enhanced:
            enhanced = f"{industry}分野における専門企業として、{enhanced}"
        
        return enhanced

    def _enhance_project_summary(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """事業概要特有の強化処理"""
        
        enhanced = content
        
        # 革新性の強調
        innovation_aspects = project_info.get("innovation", [])
        if innovation_aspects and "革新" not in enhanced:
            innovation_text = "、".join(innovation_aspects[:2])
            enhanced = enhanced.replace("事業です", f"革新的事業です。特に{innovation_text}において独自性を発揮します")
        
        # 定量的目標の追加
        if options.include_metrics:
            expected_impact = project_info.get("expected_impact", {})
            if expected_impact and "%" not in enhanced:
                for metric, value in expected_impact.items():
                    if isinstance(value, (int, float)):
                        enhanced += f"本事業により{metric}を{value}%向上させることを目標としています。"
                        break
        
        return enhanced

    def _enhance_current_situation(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """現状・課題特有の強化処理"""
        
        enhanced = content
        
        # 緊急性の強調
        urgency_factors = project_info.get("urgency", [])
        if urgency_factors and "急務" not in enhanced:
            enhanced += f"特に{urgency_factors[0]}への対応が急務となっています。"
        
        # 具体的な課題の詳細化
        challenges = project_info.get("challenges", [])
        if challenges and len(challenges) > 1:
            if "課題" in enhanced and "具体的には" not in enhanced:
                detailed_challenges = "、".join(challenges[:3])
                enhanced = enhanced.replace(
                    "課題があります",
                    f"課題があります。具体的には、{detailed_challenges}などが挙げられます"
                )
        
        return enhanced

    def _enhance_project_description(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """事業内容詳細特有の強化処理"""
        
        enhanced = content
        
        # 技術的詳細度に応じた強化
        if options.technical_depth == "advanced":
            technologies = project_info.get("technologies", [])
            if technologies and len(enhanced.split("。")) >= 3:
                # 3番目の文の後に技術詳細を追加
                sentences = enhanced.split("。")
                if len(sentences) > 2:
                    tech_detail = f"本システムでは{technologies[0]}を中核技術として採用し、高度な処理能力を実現します"
                    sentences.insert(3, tech_detail)
                    enhanced = "。".join(sentences)
        
        # 成功基準の明確化
        success_criteria = project_info.get("success_criteria", [])
        if success_criteria and "成功" not in enhanced:
            criteria_text = "、".join(success_criteria[:2])
            enhanced += f"成功基準として{criteria_text}を設定し、客観的な評価を行います。"
        
        return enhanced

    def _enhance_implementation_plan(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """実施計画特有の強化処理"""
        
        enhanced = content
        
        # マイルストーンの具体化
        milestones = project_info.get("milestones", [])
        if milestones and "マイルストーン" not in enhanced:
            milestone_text = "、".join([f"{m.get('month', '')}ヶ月目: {m.get('deliverable', '')}" for m in milestones[:3]])
            enhanced += f"主要マイルストーンとして、{milestone_text}を設定しています。"
        
        # リスク管理の詳細化
        risk_mitigation = project_info.get("risk_mitigation", [])
        if risk_mitigation and "リスク" not in enhanced:
            enhanced += f"リスク管理として{risk_mitigation[0]}を実施し、プロジェクトの確実な推進を図ります。"
        
        return enhanced

    def _enhance_expected_outcomes(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """期待効果特有の強化処理"""
        
        enhanced = content
        
        # 定量的効果の強調
        if options.include_metrics:
            quantitative_goals = project_info.get("quantitative_goals", [])
            for goal in quantitative_goals:
                metric = goal.get("metric", "")
                target = goal.get("target", "")
                if metric and target and metric not in enhanced:
                    enhanced += f"{metric}については{target}の達成を目標としています。"
        
        # 長期的影響の追加
        long_term_benefits = project_info.get("long_term_benefits", [])
        if long_term_benefits and "長期的" not in enhanced:
            enhanced += f"長期的には{long_term_benefits[0]}が期待され、持続的な成長に寄与します。"
        
        return enhanced

    def _enhance_market_analysis(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """市場分析特有の強化処理"""
        
        enhanced = content
        
        # 市場規模の数値化
        if options.include_metrics:
            market_size = project_info.get("market_size", {})
            if market_size and "億円" not in enhanced and "兆円" not in enhanced:
                size_value = market_size.get("value", "")
                size_unit = market_size.get("unit", "億円")
                if size_value:
                    enhanced = enhanced.replace("市場", f"市場規模{size_value}{size_unit}の市場")
        
        # 競合優位性の強調
        value_proposition = project_info.get("value_proposition", "")
        if value_proposition and "優位性" not in enhanced:
            enhanced += f"当社の{value_proposition}により、明確な競合優位性を確保できます。"
        
        return enhanced

    def _enhance_budget_plan(
        self,
        content: str,
        project_info: Dict[str, Any],
        options: GenerationOptions
    ) -> str:
        """予算計画特有の強化処理"""
        
        enhanced = content
        
        # 費用対効果の明示
        roi_projections = project_info.get("roi_projections", {})
        if roi_projections and "ROI" not in enhanced:
            roi_value = roi_projections.get("expected_roi", "")
            if roi_value:
                enhanced += f"投資回収率（ROI）として{roi_value}%を見込んでおり、高い費用対効果が期待できます。"
        
        # 予算配分の詳細化
        budget_breakdown = project_info.get("budget_breakdown", {})
        if budget_breakdown and "内訳" not in enhanced:
            major_categories = list(budget_breakdown.keys())[:3]
            if major_categories:
                breakdown_text = "、".join(major_categories)
                enhanced += f"予算の主要内訳は{breakdown_text}となっています。"
        
        return enhanced

    async def _create_generated_section(
        self,
        section: ApplicationSection,
        content: str,
        context: SectionContext,
        options: GenerationOptions
    ) -> GeneratedSection:
        """生成セクション作成"""
        
        # 品質評価
        quality_score = await self.quality_evaluator.evaluate_business_plan(
            content, context.company_profile, context.subsidy_info.get("type", "general")
        )
        
        # 要件適合性チェック
        requirements = SectionRequirements(
            section=section,
            min_length=max(200, options.target_length - 100),
            max_length=options.target_length + 200,
            style=options.writing_style
        )
        compliance_score = await self._check_section_compliance(content, requirements)
        
        # 改善提案生成
        suggestions = await self._generate_section_suggestions(
            content, section, quality_score, compliance_score
        )
        
        return GeneratedSection(
            section=section,
            title=self._get_section_title(section),
            content=content,
            word_count=len(content),
            quality_score=quality_score,
            compliance_score=compliance_score,
            improvement_suggestions=suggestions,
            metadata={
                "generation_options": {
                    "writing_style": options.writing_style.value,
                    "target_length": options.target_length,
                    "technical_depth": options.technical_depth,
                    "creativity_level": options.creativity_level
                },
                "context_used": {
                    "company_profile": bool(context.company_profile),
                    "project_info": bool(context.project_info),
                    "subsidy_info": bool(context.subsidy_info)
                }
            },
            generated_at=datetime.now()
        )

    async def _check_section_compliance(
        self,
        content: str,
        requirements: SectionRequirements
    ) -> float:
        """セクション要件適合性チェック"""
        
        scores = []
        
        # 長さチェック
        length = len(content)
        if requirements.min_length <= length <= requirements.max_length:
            scores.append(1.0)
        elif length < requirements.min_length:
            scores.append(max(0.0, length / requirements.min_length))
        else:
            scores.append(max(0.0, 1.0 - (length - requirements.max_length) / requirements.max_length))
        
        # 必須要素チェック
        if requirements.required_elements:
            present_elements = sum(1 for elem in requirements.required_elements if elem in content)
            scores.append(present_elements / len(requirements.required_elements))
        else:
            scores.append(1.0)
        
        # キーワードチェック
        if requirements.keywords:
            present_keywords = sum(1 for keyword in requirements.keywords if keyword in content)
            scores.append(present_keywords / len(requirements.keywords))
        else:
            scores.append(1.0)
        
        return sum(scores) / len(scores)

    async def _generate_section_suggestions(
        self,
        content: str,
        section: ApplicationSection,
        quality_score: float,
        compliance_score: float
    ) -> List[str]:
        """セクション改善提案生成"""
        
        suggestions = []
        
        if quality_score < 70:
            suggestions.append("内容の具体性と説得力を向上させてください")
        
        if compliance_score < 0.8:
            suggestions.append("セクション要件への適合性を改善してください")
        
        # セクション特有の提案
        section_specific_suggestions = {
            ApplicationSection.COMPANY_OVERVIEW: [
                "企業の実績や強みをより具体的に記載してください",
                "業界での位置づけを明確にしてください"
            ],
            ApplicationSection.PROJECT_SUMMARY: [
                "プロジェクトの革新性をより強調してください",
                "期待される効果を定量的に示してください"
            ],
            ApplicationSection.CURRENT_SITUATION: [
                "課題の緊急性をより明確に示してください",
                "現状分析に客観的データを含めてください"
            ],
            ApplicationSection.IMPLEMENTATION_PLAN: [
                "実施体制の詳細を追加してください",
                "リスク管理計画を強化してください"
            ]
        }
        
        if section in section_specific_suggestions:
            suggestions.extend(section_specific_suggestions[section][:2])
        
        return suggestions[:5]  # 最大5つまで

    async def _fallback_section_generation(
        self,
        section: ApplicationSection,
        context: SectionContext
    ) -> GeneratedSection:
        """フォールバックセクション生成"""
        
        fallback_content = self._get_fallback_content(section, context)
        
        return GeneratedSection(
            section=section,
            title=self._get_section_title(section),
            content=fallback_content,
            word_count=len(fallback_content),
            quality_score=60.0,
            compliance_score=0.7,
            improvement_suggestions=["詳細な内容の追加が必要です"],
            metadata={"generation_method": "fallback"},
            generated_at=datetime.now()
        )

    # 設定・データ初期化

    def _initialize_section_prompts(self) -> Dict[str, str]:
        """セクション別プロンプト初期化"""
        return {
            "company_overview": """
企業概要セクションを作成してください。

【企業情報】
- 企業名: {company_name}
- 業界: {industry}
- 設立年: {founded_year}
- 従業員数: {employee_count}名
- 事業内容: {business_description}
- 主要製品・サービス: {main_products}
- 実績・認証: {achievements}

【作成要件】
- 文字数: {target_length}文字程度
- 文体: {writing_style}
- 企業の信頼性と実績を強調
- 業界での位置づけを明確に記載
- 具体的な数値や実績を含める

企業の強みと信頼性が伝わる企業概要を作成してください。
            """,
            
            "project_summary": """
事業概要セクションを作成してください。

【プロジェクト情報】
- プロジェクト名: {project_title}
- 事業内容: {project_description}
- 目的・目標: {project_objectives}
- ターゲット市場: {target_market}
- 独自価値: {unique_value}
- 革新的側面: {innovation_aspects}
- 補助金タイプ: {subsidy_type}
- 期待される影響: {expected_impact}

【作成要件】
- 文字数: {target_length}文字程度
- 文体: {writing_style}
- 事業の革新性と社会的意義を強調
- 明確で説得力のある表現
- 補助金の目的との整合性

読み手に強い印象を与える事業概要を作成してください。
            """,
            
            "current_situation": """
現状・課題セクションを作成してください。

【現状・課題情報】
- 業界: {industry}
- 企業名: {company_name}
- 現在の課題: {current_challenges}
- 市場の問題: {market_issues}
- 内部課題: {internal_issues}
- 競合圧力: {competitive_pressures}
- 技術的ギャップ: {technology_gaps}
- 規制変化: {regulatory_changes}
- 顧客ニーズ: {customer_needs}
- 緊急性要因: {urgency_factors}

【作成要件】
- 文字数: {target_length}文字程度
- 課題の深刻性と緊急性を明確に表現
- 客観的なデータや事実に基づく記載
- 解決の必要性を説得力を持って説明
- 数値データがあれば積極的に活用: {include_metrics}

現状の課題と解決の必要性が明確に伝わる内容を作成してください。
            """,
            
            "project_description": """
事業内容詳細セクションを作成してください。

【詳細情報】
- プロジェクト名: {project_title}
- 詳細説明: {detailed_description}
- 技術的アプローチ: {technical_approach}
- 実施方法: {methodology}
- 主要技術: {key_technologies}
- 開発フェーズ: {development_phases}
- 成果物: {deliverables}
- 成功基準: {success_criteria}
- 品質基準: {quality_standards}
- 革新要素: {innovation_elements}

【作成要件】
- 文字数: {target_length}文字程度
- 技術的詳細度: {technical_depth}
- 具体例を含める: {include_examples}
- 技術的実現可能性を示す
- 段階的な実施計画を含める

技術的に信頼性が高く、実現可能性が明確な事業内容を作成してください。
            """,
            
            "implementation_plan": """
実施計画・体制セクションを作成してください。

【実施計画情報】
- プロジェクト期間: {project_duration}
- 実施フェーズ: {project_phases}
- チーム構成: {team_structure}
- 主要メンバー: {key_personnel}
- 外部パートナー: {external_partners}
- 管理手法: {management_approach}
- 品質管理: {quality_control}
- リスク対策: {risk_mitigation}
- コミュニケーション計画: {communication_plan}
- マイルストーン: {milestone_schedule}
- リソース配分: {resource_allocation}
- 実績・経験: {company_experience}

【作成要件】
- 文字数: {target_length}文字程度
- 実施体制の信頼性を強調
- 具体的なスケジュールとマイルストーン
- リスク管理体制の詳細
- プロジェクト管理の確実性

確実で信頼性の高い実施計画を作成してください。
            """,
            
            "expected_outcomes": """
期待効果・成果セクションを作成してください。

【成果・効果情報】
- 定量的目標: {quantitative_goals}
- 定性的目標: {qualitative_goals}
- ビジネス影響: {business_impact}
- 市場への影響: {market_impact}
- 社会的影響: {social_impact}
- 財務予測: {financial_projections}
- KPI指標: {kpi_indicators}
- 測定方法: {measurement_methods}
- 評価スケジュール: {evaluation_timeline}
- 長期的効果: {long_term_benefits}
- 競合優位性: {competitive_advantages}
- 拡張性: {scalability}
- 持続性: {sustainability}

【作成要件】
- 文字数: {target_length}文字程度
- 数値データを積極活用: {include_metrics}
- 短期・中期・長期の効果を明示
- 測定可能な指標を含める
- 社会的意義も含める

説得力があり測定可能な期待効果を作成してください。
            """,
            
            "market_analysis": """
市場分析セクションを作成してください。

【市場分析情報】
- ターゲット市場: {target_market}
- 市場規模: {market_size}
- 市場成長率: {market_growth}
- 顧客セグメント: {customer_segments}
- 競合状況: {competitive_landscape}
- 市場トレンド: {market_trends}
- 市場推進要因: {market_drivers}
- 市場障壁: {market_barriers}
- 価値提案: {value_proposition}
- 価格戦略: {pricing_strategy}
- 市場参入戦略: {go_to_market}
- 市場浸透計画: {market_penetration}

【作成要件】
- 文字数: {target_length}文字程度
- 数値データを含める: {include_metrics}
- 市場機会の説得力ある説明
- 競合優位性の明確化
- 客観的分析に基づく記載

市場機会と事業性が明確に示される分析を作成してください。
            """,
            
            "budget_plan": """
予算計画セクションを作成してください。

【予算情報】
- 総予算: {total_budget}円
- 予算内訳: {budget_breakdown}
- 人件費: {personnel_costs}
- 設備費: {equipment_costs}
- 運営費: {operational_costs}
- 外部費用: {external_costs}
- 予備費: {contingency_budget}円
- 資金調達源: {funding_sources}
- 費用根拠: {cost_justification}
- ROI予測: {roi_projections}
- 費用効率性: {cost_efficiency}
- 補助金額: {subsidy_amount}円
- 補助率: {subsidy_percentage}%

【作成要件】
- 文字数: {target_length}文字程度
- 数値データを必ず含める: True
- 費用の妥当性を明確に説明
- ROIと費用対効果を強調
- 詳細な内訳と根拠を提示

費用の妥当性と投資効果が明確な予算計画を作成してください。
            """
        }

    def _initialize_generation_strategies(self) -> Dict[str, Dict[str, Any]]:
        """セクション別生成戦略初期化"""
        return {
            "company_overview": {
                "preferred_provider": AIProvider.ANTHROPIC,
                "temperature": 0.5,
                "focus": "credibility_and_trust"
            },
            "project_summary": {
                "preferred_provider": AIProvider.HYBRID,
                "temperature": 0.7,
                "focus": "innovation_and_impact"
            },
            "current_situation": {
                "preferred_provider": AIProvider.OPENAI,
                "temperature": 0.6,
                "focus": "problem_clarity"
            },
            "project_description": {
                "preferred_provider": AIProvider.HYBRID,
                "temperature": 0.5,
                "focus": "technical_feasibility"
            },
            "implementation_plan": {
                "preferred_provider": AIProvider.ANTHROPIC,
                "temperature": 0.4,
                "focus": "execution_reliability"
            },
            "expected_outcomes": {
                "preferred_provider": AIProvider.OPENAI,
                "temperature": 0.6,
                "focus": "measurable_results"
            },
            "market_analysis": {
                "preferred_provider": AIProvider.HYBRID,
                "temperature": 0.5,
                "focus": "market_opportunity"
            },
            "budget_plan": {
                "preferred_provider": AIProvider.ANTHROPIC,
                "temperature": 0.3,
                "focus": "financial_accuracy"
            }
        }

    def _load_section_templates(self) -> Dict[str, Dict[str, str]]:
        """セクションテンプレート読み込み"""
        return {
            "fallback_templates": {
                "company_overview": "弊社は{industry}分野において事業を展開する企業です。",
                "project_summary": "本事業は{subsidy_type}を活用した革新的な取り組みです。",
                "current_situation": "現在、{industry}業界では様々な課題が存在しています。",
                "project_description": "本プロジェクトでは以下の手法で事業を推進します。",
                "implementation_plan": "確実な実施のため、段階的なアプローチを採用します。",
                "expected_outcomes": "本事業により大幅な効果向上が期待されます。"
            }
        }

    def _get_generic_prompt_template(self) -> str:
        """汎用プロンプトテンプレート"""
        return """
{section_type}セクションの内容を作成してください。

【基本情報】
企業名: {company_name}
業界: {industry}
補助金タイプ: {subsidy_type}

【要件】
- 文字数: {target_length}文字程度
- 文体: {writing_style}
- 専門性と説得力を重視

効果的な{section_type}を作成してください。
"""

    def _build_fallback_prompt(self, section_key: str, context: Dict[str, Any]) -> str:
        """フォールバックプロンプト構築"""
        return f"""
{section_key}に関する申請書の内容を作成してください。

企業: {context.get('company_name', '')}
業界: {context.get('industry', '')}
目標文字数: {context.get('target_length', 400)}文字

専門的で説得力のある内容を作成してください。
"""

    def _generate_fallback_content(self, section_key: str, context: Dict[str, Any]) -> str:
        """フォールバックコンテンツ生成"""
        templates = self.templates.get("fallback_templates", {})
        template = templates.get(section_key, f"{section_key}に関する詳細内容を記載いたします。")
        
        try:
            return template.format(**context)
        except:
            return template

    def _get_fallback_content(self, section: ApplicationSection, context: SectionContext) -> str:
        """フォールバックコンテンツ取得"""
        company_name = context.company_profile.get("name", "弊社")
        industry = context.company_profile.get("industry", "")
        subsidy_type = context.subsidy_info.get("type", "")
        
        fallback_map = {
            ApplicationSection.COMPANY_OVERVIEW: f"{company_name}は{industry}分野において長年の実績を持つ企業として、お客様のニーズに応える製品・サービスを提供してまいりました。今回の事業を通じて、さらなる成長と社会貢献を目指します。",
            ApplicationSection.PROJECT_SUMMARY: f"本事業は{subsidy_type}を活用し、{industry}分野における革新的な取り組みを実施するものです。最新技術の導入により、業務効率化と競争力強化を図ります。",
            ApplicationSection.CURRENT_SITUATION: f"現在、{industry}業界では様々な課題が存在しており、{company_name}においても効率化とデジタル化の推進が急務となっています。",
            ApplicationSection.IMPLEMENTATION_PLAN: f"{company_name}では確実な事業実施のため、段階的なアプローチを採用し、専門チームによる綿密な管理体制を構築します。"
        }
        
        return fallback_map.get(section, f"{section.value}に関する詳細な内容を記載いたします。")

    def _get_section_title(self, section: ApplicationSection) -> str:
        """セクションタイトル取得"""
        title_map = {
            ApplicationSection.COMPANY_OVERVIEW: "企業概要",
            ApplicationSection.PROJECT_SUMMARY: "事業概要",
            ApplicationSection.CURRENT_SITUATION: "現状と課題",
            ApplicationSection.PROJECT_DESCRIPTION: "事業内容詳細",
            ApplicationSection.IMPLEMENTATION_PLAN: "実施計画・体制",
            ApplicationSection.EXPECTED_OUTCOMES: "期待される効果・成果",
            ApplicationSection.MARKET_ANALYSIS: "市場分析",
            ApplicationSection.BUDGET_PLAN: "事業費・予算計画"
        }
        
        return title_map.get(section, section.value)