"""
申請書テンプレート管理システム
補助金タイプ別テンプレート・動的カスタマイズ・バージョン管理
"""

from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import asyncio
import logging
from collections import defaultdict
import copy

from ..services.application_writer import ApplicationSection, WritingStyle, SectionRequirements

logger = logging.getLogger(__name__)


class TemplateCategory(Enum):
    """テンプレートカテゴリ"""
    SUBSIDY_SPECIFIC = "subsidy_specific"    # 補助金特化
    INDUSTRY_SPECIFIC = "industry_specific"  # 業界特化
    SIZE_SPECIFIC = "size_specific"          # 企業規模特化
    GENERIC = "generic"                      # 汎用
    CUSTOM = "custom"                        # カスタム


class TemplateStatus(Enum):
    """テンプレートステータス"""
    ACTIVE = "active"           # アクティブ
    DRAFT = "draft"             # 下書き
    DEPRECATED = "deprecated"   # 非推奨
    ARCHIVED = "archived"       # アーカイブ


@dataclass
class SectionTemplate:
    """セクションテンプレート"""
    section: ApplicationSection
    template_id: str
    title: str
    content_template: str
    variables: List[str] = field(default_factory=list)
    requirements: SectionRequirements = None
    examples: List[str] = field(default_factory=list)
    tips: List[str] = field(default_factory=list)
    common_mistakes: List[str] = field(default_factory=list)
    success_patterns: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.requirements is None:
            self.requirements = SectionRequirements(self.section)


@dataclass
class ApplicationTemplate:
    """申請書テンプレート"""
    template_id: str
    name: str
    category: TemplateCategory
    subsidy_type: str
    target_industry: Optional[str] = None
    target_company_size: Optional[str] = None
    description: str = ""
    sections: Dict[ApplicationSection, SectionTemplate] = field(default_factory=dict)
    requirements: Dict[str, Any] = field(default_factory=dict)
    success_rate: float = 0.0
    usage_count: int = 0
    version: str = "1.0.0"
    status: TemplateStatus = TemplateStatus.ACTIVE
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    created_by: str = "system"
    tags: List[str] = field(default_factory=list)


@dataclass
class TemplateUsageStats:
    """テンプレート使用統計"""
    template_id: str
    total_usage: int = 0
    successful_applications: int = 0
    average_quality_score: float = 0.0
    user_ratings: List[float] = field(default_factory=list)
    feedback_comments: List[str] = field(default_factory=list)
    last_used: Optional[datetime] = None
    popular_sections: Dict[ApplicationSection, int] = field(default_factory=dict)
    improvement_suggestions: List[str] = field(default_factory=list)


@dataclass
class TemplateCustomization:
    """テンプレートカスタマイズ"""
    base_template_id: str
    customization_id: str
    company_profile: Dict[str, Any]
    customized_sections: Dict[ApplicationSection, SectionTemplate]
    customization_rules: Dict[str, Any]
    created_at: datetime = field(default_factory=datetime.now)


class ApplicationTemplateManager:
    """申請書テンプレート管理システム"""
    
    def __init__(self, storage_path: str = "templates/"):
        """初期化"""
        self.storage_path = storage_path
        self.templates: Dict[str, ApplicationTemplate] = {}
        self.usage_stats: Dict[str, TemplateUsageStats] = {}
        self.customizations: Dict[str, TemplateCustomization] = {}
        
        # カテゴリ別テンプレート索引
        self.category_index: Dict[TemplateCategory, List[str]] = defaultdict(list)
        self.subsidy_index: Dict[str, List[str]] = defaultdict(list)
        self.industry_index: Dict[str, List[str]] = defaultdict(list)
        
        # デフォルトテンプレート
        self.default_templates = {}
        
        # ディレクトリ作成
        os.makedirs(storage_path, exist_ok=True)
        
        # 初期化処理
        self._load_templates()
        self._load_usage_stats()
        self._initialize_default_templates()

    async def create_template(
        self,
        name: str,
        category: TemplateCategory,
        subsidy_type: str,
        sections_config: Dict[ApplicationSection, Dict[str, Any]],
        target_industry: Optional[str] = None,
        target_company_size: Optional[str] = None,
        description: str = ""
    ) -> str:
        """
        テンプレート作成
        
        Args:
            name: テンプレート名
            category: カテゴリ
            subsidy_type: 補助金タイプ
            sections_config: セクション設定
            target_industry: 対象業界
            target_company_size: 対象企業規模
            description: 説明
            
        Returns:
            str: テンプレートID
        """
        try:
            template_id = f"tpl_{subsidy_type}_{category.value}_{int(datetime.now().timestamp())}"
            
            # セクションテンプレート作成
            sections = {}
            for section, config in sections_config.items():
                section_template = await self._create_section_template(
                    section, config, template_id
                )
                sections[section] = section_template
            
            # 申請書テンプレート作成
            template = ApplicationTemplate(
                template_id=template_id,
                name=name,
                category=category,
                subsidy_type=subsidy_type,
                target_industry=target_industry,
                target_company_size=target_company_size,
                description=description,
                sections=sections,
                requirements=self._extract_template_requirements(sections_config),
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # テンプレート保存
            self.templates[template_id] = template
            await self._save_template(template)
            
            # インデックス更新
            self._update_indexes(template)
            
            # 使用統計初期化
            self.usage_stats[template_id] = TemplateUsageStats(template_id=template_id)
            
            logger.info(f"テンプレート作成完了: {template_id}")
            return template_id
            
        except Exception as e:
            logger.error(f"テンプレート作成エラー: {str(e)}")
            raise

    async def get_recommended_templates(
        self,
        subsidy_type: str,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any] = None,
        limit: int = 5
    ) -> List[ApplicationTemplate]:
        """
        推奨テンプレート取得
        
        Args:
            subsidy_type: 補助金タイプ
            company_profile: 企業プロファイル
            project_info: プロジェクト情報
            limit: 取得数限界
            
        Returns:
            List[ApplicationTemplate]: 推奨テンプレートリスト
        """
        try:
            # 候補テンプレート収集
            candidates = []
            
            # 1. 補助金タイプ完全一致
            exact_matches = [
                self.templates[tid] for tid in self.subsidy_index.get(subsidy_type, [])
                if self.templates[tid].status == TemplateStatus.ACTIVE
            ]
            candidates.extend(exact_matches)
            
            # 2. 業界一致テンプレート
            industry = company_profile.get("industry", "")
            if industry:
                industry_matches = [
                    self.templates[tid] for tid in self.industry_index.get(industry, [])
                    if self.templates[tid].status == TemplateStatus.ACTIVE
                    and tid not in [t.template_id for t in candidates]
                ]
                candidates.extend(industry_matches)
            
            # 3. 企業規模一致テンプレート
            company_size = self._determine_company_size(company_profile)
            size_matches = [
                t for t in self.templates.values()
                if (t.target_company_size == company_size and 
                    t.status == TemplateStatus.ACTIVE and
                    t.template_id not in [c.template_id for c in candidates])
            ]
            candidates.extend(size_matches)
            
            # 4. 汎用テンプレート
            generic_templates = [
                self.templates[tid] for tid in self.category_index.get(TemplateCategory.GENERIC, [])
                if (self.templates[tid].status == TemplateStatus.ACTIVE and
                    tid not in [t.template_id for t in candidates])
            ]
            candidates.extend(generic_templates)
            
            # テンプレート評価・ランキング
            scored_templates = []
            for template in candidates:
                score = await self._calculate_template_score(
                    template, subsidy_type, company_profile, project_info
                )
                scored_templates.append((template, score))
            
            # スコア順にソート
            scored_templates.sort(key=lambda x: x[1], reverse=True)
            
            # 上位テンプレートを返す
            recommended = [template for template, score in scored_templates[:limit]]
            
            logger.info(f"推奨テンプレート取得: {len(recommended)}件")
            return recommended
            
        except Exception as e:
            logger.error(f"推奨テンプレート取得エラー: {str(e)}")
            return []

    async def customize_template(
        self,
        base_template_id: str,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        customization_options: Dict[str, Any] = None
    ) -> TemplateCustomization:
        """
        テンプレートカスタマイズ
        
        Args:
            base_template_id: ベーステンプレートID
            company_profile: 企業プロファイル
            project_info: プロジェクト情報
            customization_options: カスタマイズオプション
            
        Returns:
            TemplateCustomization: カスタマイズ結果
        """
        try:
            if base_template_id not in self.templates:
                raise ValueError(f"テンプレートが見つかりません: {base_template_id}")
            
            base_template = self.templates[base_template_id]
            customization_id = f"custom_{base_template_id}_{int(datetime.now().timestamp())}"
            
            # カスタマイズルール生成
            customization_rules = await self._generate_customization_rules(
                company_profile, project_info, customization_options or {}
            )
            
            # セクション別カスタマイズ
            customized_sections = {}
            for section, section_template in base_template.sections.items():
                customized_section = await self._customize_section_template(
                    section_template, customization_rules, company_profile, project_info
                )
                customized_sections[section] = customized_section
            
            # カスタマイズ作成
            customization = TemplateCustomization(
                base_template_id=base_template_id,
                customization_id=customization_id,
                company_profile=company_profile,
                customized_sections=customized_sections,
                customization_rules=customization_rules,
                created_at=datetime.now()
            )
            
            # カスタマイズ保存
            self.customizations[customization_id] = customization
            await self._save_customization(customization)
            
            logger.info(f"テンプレートカスタマイズ完了: {customization_id}")
            return customization
            
        except Exception as e:
            logger.error(f"テンプレートカスタマイズエラー: {str(e)}")
            raise

    async def get_template_content(
        self,
        template_id: str,
        section: ApplicationSection,
        context: Dict[str, Any],
        customization_id: Optional[str] = None
    ) -> str:
        """
        テンプレートコンテンツ取得
        
        Args:
            template_id: テンプレートID
            section: セクション
            context: コンテキスト変数
            customization_id: カスタマイズID
            
        Returns:
            str: 生成されたコンテンツ
        """
        try:
            # カスタマイズテンプレート優先
            if customization_id and customization_id in self.customizations:
                customization = self.customizations[customization_id]
                if section in customization.customized_sections:
                    section_template = customization.customized_sections[section]
                    return self._apply_template_context(section_template.content_template, context)
            
            # ベーステンプレート使用
            if template_id in self.templates:
                template = self.templates[template_id]
                if section in template.sections:
                    section_template = template.sections[section]
                    return self._apply_template_context(section_template.content_template, context)
            
            raise ValueError(f"テンプレートまたはセクションが見つかりません: {template_id}, {section}")
            
        except Exception as e:
            logger.error(f"テンプレートコンテンツ取得エラー: {str(e)}")
            raise

    async def update_template_success_rate(
        self,
        template_id: str,
        was_successful: bool,
        quality_score: Optional[float] = None
    ):
        """
        テンプレート成功率更新
        
        Args:
            template_id: テンプレートID
            was_successful: 成功フラグ
            quality_score: 品質スコア
        """
        try:
            if template_id not in self.usage_stats:
                self.usage_stats[template_id] = TemplateUsageStats(template_id=template_id)
            
            stats = self.usage_stats[template_id]
            stats.total_usage += 1
            
            if was_successful:
                stats.successful_applications += 1
            
            if quality_score is not None:
                # 移動平均で品質スコア更新
                if stats.average_quality_score == 0:
                    stats.average_quality_score = quality_score
                else:
                    stats.average_quality_score = (
                        stats.average_quality_score * 0.9 + quality_score * 0.1
                    )
            
            stats.last_used = datetime.now()
            
            # テンプレート成功率更新
            if template_id in self.templates:
                template = self.templates[template_id]
                template.success_rate = stats.successful_applications / stats.total_usage
                template.usage_count = stats.total_usage
                template.updated_at = datetime.now()
                
                await self._save_template(template)
            
            await self._save_usage_stats()
            
        except Exception as e:
            logger.error(f"テンプレート成功率更新エラー: {str(e)}")

    async def get_template_analytics(
        self,
        time_range: timedelta = timedelta(days=30)
    ) -> Dict[str, Any]:
        """
        テンプレート分析情報取得
        
        Args:
            time_range: 分析期間
            
        Returns:
            Dict: 分析結果
        """
        try:
            cutoff_date = datetime.now() - time_range
            
            # 全体統計
            total_templates = len(self.templates)
            active_templates = len([t for t in self.templates.values() if t.status == TemplateStatus.ACTIVE])
            
            # 使用統計
            total_usage = sum(stats.total_usage for stats in self.usage_stats.values())
            avg_success_rate = sum(t.success_rate for t in self.templates.values()) / total_templates if total_templates > 0 else 0
            
            # トップパフォーマー
            top_templates = sorted(
                [(tid, t.success_rate, t.usage_count) for tid, t in self.templates.items()],
                key=lambda x: x[1] * x[2],  # 成功率 × 使用回数
                reverse=True
            )[:10]
            
            # カテゴリ別統計
            category_stats = {}
            for category in TemplateCategory:
                category_templates = [
                    t for t in self.templates.values() 
                    if t.category == category
                ]
                if category_templates:
                    category_stats[category.value] = {
                        "count": len(category_templates),
                        "avg_success_rate": sum(t.success_rate for t in category_templates) / len(category_templates),
                        "total_usage": sum(t.usage_count for t in category_templates)
                    }
            
            # 補助金タイプ別統計
            subsidy_stats = {}
            for subsidy_type, template_ids in self.subsidy_index.items():
                templates = [self.templates[tid] for tid in template_ids if tid in self.templates]
                if templates:
                    subsidy_stats[subsidy_type] = {
                        "count": len(templates),
                        "avg_success_rate": sum(t.success_rate for t in templates) / len(templates),
                        "total_usage": sum(t.usage_count for t in templates)
                    }
            
            # 改善提案
            improvement_opportunities = await self._identify_improvement_opportunities()
            
            return {
                "overview": {
                    "total_templates": total_templates,
                    "active_templates": active_templates,
                    "total_usage": total_usage,
                    "average_success_rate": round(avg_success_rate, 3)
                },
                "top_performers": [
                    {
                        "template_id": tid,
                        "name": self.templates[tid].name,
                        "success_rate": rate,
                        "usage_count": usage,
                        "score": rate * usage
                    }
                    for tid, rate, usage in top_templates
                ],
                "category_breakdown": category_stats,
                "subsidy_type_breakdown": subsidy_stats,
                "improvement_opportunities": improvement_opportunities
            }
            
        except Exception as e:
            logger.error(f"テンプレート分析取得エラー: {str(e)}")
            return {"error": str(e)}

    async def clone_template(
        self,
        source_template_id: str,
        new_name: str,
        modifications: Dict[str, Any] = None
    ) -> str:
        """
        テンプレート複製
        
        Args:
            source_template_id: ソーステンプレートID
            new_name: 新テンプレート名
            modifications: 変更内容
            
        Returns:
            str: 新テンプレートID
        """
        try:
            if source_template_id not in self.templates:
                raise ValueError(f"ソーステンプレートが見つかりません: {source_template_id}")
            
            source_template = self.templates[source_template_id]
            new_template_id = f"tpl_clone_{int(datetime.now().timestamp())}"
            
            # テンプレート複製
            cloned_template = copy.deepcopy(source_template)
            cloned_template.template_id = new_template_id
            cloned_template.name = new_name
            cloned_template.version = "1.0.0"
            cloned_template.created_at = datetime.now()
            cloned_template.updated_at = datetime.now()
            cloned_template.usage_count = 0
            cloned_template.success_rate = 0.0
            cloned_template.status = TemplateStatus.DRAFT
            
            # 変更適用
            if modifications:
                cloned_template = await self._apply_modifications(cloned_template, modifications)
            
            # 保存・インデックス更新
            self.templates[new_template_id] = cloned_template
            await self._save_template(cloned_template)
            self._update_indexes(cloned_template)
            
            # 使用統計初期化
            self.usage_stats[new_template_id] = TemplateUsageStats(template_id=new_template_id)
            
            logger.info(f"テンプレート複製完了: {new_template_id}")
            return new_template_id
            
        except Exception as e:
            logger.error(f"テンプレート複製エラー: {str(e)}")
            raise

    # 内部メソッド

    async def _create_section_template(
        self,
        section: ApplicationSection,
        config: Dict[str, Any],
        template_id: str
    ) -> SectionTemplate:
        """セクションテンプレート作成"""
        
        section_template_id = f"{template_id}_{section.value}"
        
        # デフォルト設定
        default_templates = self._get_default_section_templates()
        default_content = default_templates.get(section, "")
        
        return SectionTemplate(
            section=section,
            template_id=section_template_id,
            title=config.get("title", self._get_default_section_title(section)),
            content_template=config.get("content_template", default_content),
            variables=config.get("variables", []),
            requirements=SectionRequirements(
                section=section,
                min_length=config.get("min_length", 200),
                max_length=config.get("max_length", 600),
                required_elements=config.get("required_elements", []),
                style=WritingStyle(config.get("writing_style", "formal_business")),
                keywords=config.get("keywords", [])
            ),
            examples=config.get("examples", []),
            tips=config.get("tips", []),
            common_mistakes=config.get("common_mistakes", []),
            success_patterns=config.get("success_patterns", []),
            metadata=config.get("metadata", {})
        )

    async def _calculate_template_score(
        self,
        template: ApplicationTemplate,
        subsidy_type: str,
        company_profile: Dict[str, Any],
        project_info: Optional[Dict[str, Any]]
    ) -> float:
        """テンプレートスコア計算"""
        
        score = 0.0
        
        # 1. 補助金タイプ一致度 (40%)
        if template.subsidy_type == subsidy_type:
            score += 40
        elif subsidy_type in template.subsidy_type:  # 部分一致
            score += 20
        
        # 2. 業界一致度 (25%)
        company_industry = company_profile.get("industry", "")
        if template.target_industry == company_industry:
            score += 25
        elif template.target_industry is None:  # 汎用
            score += 15
        
        # 3. 企業規模一致度 (15%)
        company_size = self._determine_company_size(company_profile)
        if template.target_company_size == company_size:
            score += 15
        elif template.target_company_size is None:  # 汎用
            score += 10
        
        # 4. 成功率・使用実績 (20%)
        success_score = template.success_rate * 10  # 最大10点
        usage_score = min(template.usage_count / 10, 10)  # 最大10点
        score += success_score + usage_score
        
        return score

    async def _generate_customization_rules(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        customization_options: Dict[str, Any]
    ) -> Dict[str, Any]:
        """カスタマイズルール生成"""
        
        rules = {
            "company_focus": {
                "industry": company_profile.get("industry", ""),
                "size": self._determine_company_size(company_profile),
                "strengths": company_profile.get("strengths", []),
                "experience": company_profile.get("experience", [])
            },
            "project_focus": {
                "innovation_level": project_info.get("innovation_level", "medium"),
                "technical_complexity": project_info.get("technical_complexity", "medium"),
                "market_focus": project_info.get("market_focus", "domestic"),
                "timeline": project_info.get("timeline", "medium")
            },
            "writing_preferences": {
                "style": customization_options.get("writing_style", "formal_business"),
                "tone": customization_options.get("tone", "professional"),
                "detail_level": customization_options.get("detail_level", "medium"),
                "technical_depth": customization_options.get("technical_depth", "medium")
            }
        }
        
        return rules

    async def _customize_section_template(
        self,
        section_template: SectionTemplate,
        customization_rules: Dict[str, Any],
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any]
    ) -> SectionTemplate:
        """セクションテンプレートカスタマイズ"""
        
        # ベーステンプレートをコピー
        customized = copy.deepcopy(section_template)
        
        # 企業特化カスタマイズ
        company_focus = customization_rules.get("company_focus", {})
        industry = company_focus.get("industry", "")
        
        # 業界特化キーワード追加
        if industry:
            industry_keywords = self._get_industry_keywords(industry)
            customized.requirements.keywords.extend(industry_keywords)
            customized.requirements.keywords = list(set(customized.requirements.keywords))
        
        # コンテンツテンプレートの業界特化
        if industry and "{industry_specific}" in customized.content_template:
            industry_content = self._get_industry_specific_content(industry, section_template.section)
            customized.content_template = customized.content_template.replace(
                "{industry_specific}", industry_content
            )
        
        # プロジェクト特化カスタマイズ
        project_focus = customization_rules.get("project_focus", {})
        innovation_level = project_focus.get("innovation_level", "medium")
        
        # 革新性レベルに応じた調整
        if innovation_level == "high":
            if "革新" not in customized.requirements.keywords:
                customized.requirements.keywords.append("革新")
            customized.requirements.focus_points.append("技術的革新性の強調")
        
        # 文章スタイルカスタマイズ
        writing_prefs = customization_rules.get("writing_preferences", {})
        style = writing_prefs.get("style", "formal_business")
        customized.requirements.style = WritingStyle(style)
        
        # メタデータ更新
        customized.metadata.update({
            "customized": True,
            "customization_rules": customization_rules,
            "customized_at": datetime.now().isoformat()
        })
        
        return customized

    def _apply_template_context(self, template: str, context: Dict[str, Any]) -> str:
        """テンプレートコンテキスト適用"""
        try:
            return template.format(**context)
        except KeyError as e:
            logger.warning(f"テンプレート変数不足: {e}")
            return template
        except Exception as e:
            logger.error(f"テンプレート適用エラー: {str(e)}")
            return template

    def _determine_company_size(self, company_profile: Dict[str, Any]) -> str:
        """企業規模判定"""
        employee_count = company_profile.get("employee_count", 0)
        
        if employee_count < 10:
            return "small"
        elif employee_count < 100:
            return "medium"
        elif employee_count < 1000:
            return "large"
        else:
            return "enterprise"

    def _extract_template_requirements(self, sections_config: Dict[ApplicationSection, Dict[str, Any]]) -> Dict[str, Any]:
        """テンプレート要件抽出"""
        requirements = {
            "total_sections": len(sections_config),
            "required_sections": list(sections_config.keys()),
            "min_total_length": sum(config.get("min_length", 200) for config in sections_config.values()),
            "max_total_length": sum(config.get("max_length", 600) for config in sections_config.values()),
            "common_keywords": []
        }
        
        # 共通キーワード抽出
        all_keywords = []
        for config in sections_config.values():
            all_keywords.extend(config.get("keywords", []))
        
        # 複数セクションで使用されるキーワード
        keyword_counts = defaultdict(int)
        for keyword in all_keywords:
            keyword_counts[keyword] += 1
        
        requirements["common_keywords"] = [
            keyword for keyword, count in keyword_counts.items() 
            if count >= 2
        ]
        
        return requirements

    def _update_indexes(self, template: ApplicationTemplate):
        """インデックス更新"""
        template_id = template.template_id
        
        # カテゴリ別インデックス
        self.category_index[template.category].append(template_id)
        
        # 補助金タイプ別インデックス
        self.subsidy_index[template.subsidy_type].append(template_id)
        
        # 業界別インデックス
        if template.target_industry:
            self.industry_index[template.target_industry].append(template_id)

    async def _identify_improvement_opportunities(self) -> List[Dict[str, Any]]:
        """改善機会特定"""
        opportunities = []
        
        for template_id, template in self.templates.items():
            stats = self.usage_stats.get(template_id)
            
            if not stats or stats.total_usage < 5:
                continue
            
            # 成功率が低いテンプレート
            if template.success_rate < 0.6:
                opportunities.append({
                    "template_id": template_id,
                    "template_name": template.name,
                    "issue": "low_success_rate",
                    "current_value": template.success_rate,
                    "recommendation": "テンプレート内容の見直しが必要",
                    "priority": "high"
                })
            
            # 品質スコアが低いテンプレート
            if stats.average_quality_score < 70:
                opportunities.append({
                    "template_id": template_id,
                    "template_name": template.name,
                    "issue": "low_quality_score",
                    "current_value": stats.average_quality_score,
                    "recommendation": "コンテンツの質向上が必要",
                    "priority": "medium"
                })
            
            # 使用頻度が低いテンプレート
            if stats.total_usage < 10 and (datetime.now() - template.created_at).days > 30:
                opportunities.append({
                    "template_id": template_id,
                    "template_name": template.name,
                    "issue": "low_usage",
                    "current_value": stats.total_usage,
                    "recommendation": "プロモーションまたは改善が必要",
                    "priority": "low"
                })
        
        return opportunities[:10]  # 上位10件

    async def _apply_modifications(
        self,
        template: ApplicationTemplate,
        modifications: Dict[str, Any]
    ) -> ApplicationTemplate:
        """テンプレート変更適用"""
        
        if "name" in modifications:
            template.name = modifications["name"]
        
        if "description" in modifications:
            template.description = modifications["description"]
        
        if "target_industry" in modifications:
            template.target_industry = modifications["target_industry"]
        
        if "target_company_size" in modifications:
            template.target_company_size = modifications["target_company_size"]
        
        if "sections" in modifications:
            for section, section_mods in modifications["sections"].items():
                if section in template.sections:
                    section_template = template.sections[section]
                    
                    if "content_template" in section_mods:
                        section_template.content_template = section_mods["content_template"]
                    
                    if "requirements" in section_mods:
                        req_mods = section_mods["requirements"]
                        if "keywords" in req_mods:
                            section_template.requirements.keywords = req_mods["keywords"]
                        if "min_length" in req_mods:
                            section_template.requirements.min_length = req_mods["min_length"]
                        if "max_length" in req_mods:
                            section_template.requirements.max_length = req_mods["max_length"]
        
        template.updated_at = datetime.now()
        return template

    # デフォルトデータ・設定

    def _get_default_section_templates(self) -> Dict[ApplicationSection, str]:
        """デフォルトセクションテンプレート取得"""
        return {
            ApplicationSection.COMPANY_OVERVIEW: """
{company_name}は、{founded_year}年に設立された{industry}分野の専門企業です。
{employee_count}名の従業員を擁し、{business_description}を主要事業として展開しています。

【主な実績・強み】
{achievements}

【事業の特徴】
弊社は{industry}分野において{competitive_advantages}を持ち、
お客様のニーズに応える高品質な製品・サービスを提供してまいりました。

{industry_specific}

今回の事業を通じて、さらなる技術革新と事業拡大を目指してまいります。
            """.strip(),
            
            ApplicationSection.PROJECT_SUMMARY: """
本事業は、{subsidy_type}を活用した{project_title}です。

【事業の目的】
{project_objectives}

【事業の概要】
{project_description}

【革新性・独自性】
{innovation_aspects}

【期待される効果】
{expected_impact}

本事業により、{industry}分野における新たな価値創造と社会課題の解決を目指します。
            """.strip(),
            
            ApplicationSection.CURRENT_SITUATION: """
現在、{industry}業界では以下のような課題が存在しています。

【市場環境の課題】
{market_issues}

【当社における課題】
{current_challenges}

【解決の必要性】
{urgency_factors}

これらの課題に対応するため、本事業の実施が急務となっています。
            """.strip(),
            
            ApplicationSection.PROJECT_DESCRIPTION: """
【事業内容】
{detailed_description}

【技術的アプローチ】
{technical_approach}

【実施方法】
{methodology}

【主要技術・手法】
{key_technologies}

【開発フェーズ】
{development_phases}

【成果物・提供価値】
{deliverables}

本事業により、{success_criteria}を達成いたします。
            """.strip(),
            
            ApplicationSection.IMPLEMENTATION_PLAN: """
【実施体制】
{team_structure}

【プロジェクト期間】
{project_duration}

【実施スケジュール】
{milestone_schedule}

【品質管理体制】
{quality_control}

【リスク管理】
{risk_mitigation}

【進捗管理】
{management_approach}

確実な事業実施のため、上記の体制で綿密な管理を行います。
            """.strip(),
            
            ApplicationSection.EXPECTED_OUTCOMES: """
【定量的効果】
{quantitative_goals}

【定性的効果】
{qualitative_goals}

【ビジネス・インパクト】
{business_impact}

【社会的意義】
{social_impact}

【効果測定】
{measurement_methods}

【長期的効果】
{long_term_benefits}

本事業により、持続的な成長と競争力強化を実現いたします。
            """.strip()
        }

    def _get_default_section_title(self, section: ApplicationSection) -> str:
        """デフォルトセクションタイトル取得"""
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

    def _get_industry_keywords(self, industry: str) -> List[str]:
        """業界キーワード取得"""
        keywords_map = {
            "IT": ["DX", "デジタル化", "システム", "効率化", "自動化"],
            "製造業": ["生産性", "品質向上", "IoT", "スマート工場", "技術革新"],
            "サービス業": ["顧客満足", "サービス向上", "業務効率", "付加価値"],
            "医療・介護": ["QOL", "安全性", "効率化", "品質向上", "働き方改革"],
            "教育": ["教育効果", "学習支援", "効率化", "デジタル化", "個別対応"]
        }
        return keywords_map.get(industry, [])

    def _get_industry_specific_content(self, industry: str, section: ApplicationSection) -> str:
        """業界特化コンテンツ取得"""
        content_map = {
            ("IT", ApplicationSection.COMPANY_OVERVIEW): "デジタル技術を活用したソリューション提供により、企業のDX推進に貢献しています。",
            ("製造業", ApplicationSection.COMPANY_OVERVIEW): "製造技術の革新と品質向上に取り組み、競争力ある製品を提供しています。",
            ("サービス業", ApplicationSection.COMPANY_OVERVIEW): "顧客満足度向上を第一に、付加価値の高いサービスを提供しています。"
        }
        return content_map.get((industry, section), "")

    def _initialize_default_templates(self):
        """デフォルトテンプレート初期化"""
        # 代表的な補助金タイプのデフォルトテンプレート作成
        default_configs = [
            {
                "name": "IT導入補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "IT導入補助金",
                "description": "IT導入補助金申請用の標準テンプレート"
            },
            {
                "name": "ものづくり補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "ものづくり補助金",
                "description": "ものづくり補助金申請用の標準テンプレート"
            },
            {
                "name": "小規模事業者持続化補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "小規模事業者持続化補助金",
                "description": "小規模事業者持続化補助金申請用の標準テンプレート"
            },
            {
                "name": "事業再構築補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "事業再構築補助金",
                "description": "事業再構築補助金申請用の標準テンプレート"
            },
            {
                "name": "創業補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "創業補助金",
                "description": "創業補助金申請用の標準テンプレート"
            },
            {
                "name": "雇用関係助成金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "雇用関係助成金",
                "description": "キャリアアップ助成金等申請用の標準テンプレート"
            },
            {
                "name": "省エネ補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "省エネ補助金",
                "description": "省エネルギー投資促進支援事業費補助金申請用の標準テンプレート"
            },
            {
                "name": "研究開発助成金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "研究開発助成金",
                "description": "SBIR等研究開発助成金申請用の標準テンプレート"
            },
            {
                "name": "海外展開支援補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "海外展開支援補助金",
                "description": "JAPANブランド育成支援等事業申請用の標準テンプレート"
            },
            {
                "name": "事業承継補助金 標準テンプレート",
                "category": TemplateCategory.SUBSIDY_SPECIFIC,
                "subsidy_type": "事業承継補助金",
                "description": "事業承継・引継ぎ補助金申請用の標準テンプレート"
            },
            {
                "name": "汎用申請書テンプレート",
                "category": TemplateCategory.GENERIC,
                "subsidy_type": "汎用",
                "description": "各種補助金に対応可能な汎用テンプレート"
            }
        ]
        
        for config in default_configs:
            if not any(t.name == config["name"] for t in self.templates.values()):
                # デフォルトセクション設定
                sections_config = self._get_default_sections_config(config["subsidy_type"])
                
                try:
                    asyncio.create_task(self.create_template(
                        name=config["name"],
                        category=config["category"],
                        subsidy_type=config["subsidy_type"],
                        sections_config=sections_config,
                        description=config["description"]
                    ))
                except Exception as e:
                    logger.error(f"デフォルトテンプレート作成エラー {config['name']}: {str(e)}")

    def _get_default_sections_config(self, subsidy_type: str) -> Dict[ApplicationSection, Dict[str, Any]]:
        """デフォルトセクション設定取得"""
        base_config = {
            ApplicationSection.COMPANY_OVERVIEW: {
                "min_length": 200,
                "max_length": 400,
                "keywords": ["企業", "実績", "強み"],
                "required_elements": ["企業概要", "事業内容", "実績"]
            },
            ApplicationSection.PROJECT_SUMMARY: {
                "min_length": 300,
                "max_length": 500,
                "keywords": ["事業", "目的", "効果"],
                "required_elements": ["事業概要", "目的", "期待効果"]
            },
            ApplicationSection.CURRENT_SITUATION: {
                "min_length": 250,
                "max_length": 400,
                "keywords": ["課題", "必要性", "背景"],
                "required_elements": ["現状", "課題", "必要性"]
            },
            ApplicationSection.PROJECT_DESCRIPTION: {
                "min_length": 400,
                "max_length": 700,
                "keywords": ["技術", "手法", "実施"],
                "required_elements": ["事業内容", "技術", "実施方法"]
            },
            ApplicationSection.IMPLEMENTATION_PLAN: {
                "min_length": 300,
                "max_length": 500,
                "keywords": ["実施", "体制", "管理"],
                "required_elements": ["実施体制", "スケジュール", "管理方法"]
            },
            ApplicationSection.EXPECTED_OUTCOMES: {
                "min_length": 250,
                "max_length": 400,
                "keywords": ["効果", "成果", "向上"],
                "required_elements": ["期待効果", "成果指標", "測定方法"]
            }
        }
        
        # 補助金タイプ別カスタマイズ
        if subsidy_type == "IT導入補助金":
            base_config[ApplicationSection.PROJECT_SUMMARY]["keywords"].extend(["IT", "DX", "デジタル"])
            base_config[ApplicationSection.PROJECT_DESCRIPTION]["keywords"].extend(["システム", "効率化"])
        elif subsidy_type == "ものづくり補助金":
            base_config[ApplicationSection.PROJECT_SUMMARY]["keywords"].extend(["製造", "技術革新"])
            base_config[ApplicationSection.PROJECT_DESCRIPTION]["keywords"].extend(["設備", "生産性"])
        elif subsidy_type == "小規模事業者持続化補助金":
            base_config[ApplicationSection.PROJECT_SUMMARY]["keywords"].extend(["販路開拓", "地域貢献"])
            base_config[ApplicationSection.BUSINESS_MODEL] = {
                "min_length": 300,
                "max_length": 500,
                "keywords": ["販路", "顧客", "市場"],
                "required_elements": ["ビジネスモデル", "販売戦略"]
            }
        elif subsidy_type == "事業再構築補助金":
            base_config[ApplicationSection.CURRENT_SITUATION]["keywords"].extend(["売上減少", "事業転換"])
            base_config[ApplicationSection.PROJECT_DESCRIPTION]["keywords"].extend(["新分野", "業態転換"])
            base_config[ApplicationSection.MARKET_ANALYSIS] = {
                "min_length": 400,
                "max_length": 600,
                "keywords": ["市場", "競合", "需要"],
                "required_elements": ["市場分析", "競合状況", "成長性"]
            }
        elif subsidy_type == "創業補助金":
            base_config[ApplicationSection.BUSINESS_MODEL] = {
                "min_length": 400,
                "max_length": 600,
                "keywords": ["ビジネスモデル", "収益", "顧客"],
                "required_elements": ["事業モデル", "収益計画", "顧客獲得"]
            }
            base_config[ApplicationSection.MARKET_ANALYSIS]["keywords"].extend(["ターゲット", "ニーズ"])
        elif subsidy_type == "雇用関係助成金":
            base_config[ApplicationSection.IMPLEMENTATION_PLAN]["keywords"].extend(["雇用", "教育", "キャリア"])
            base_config[ApplicationSection.EXPECTED_OUTCOMES]["keywords"].extend(["定着率", "スキル向上"])
        elif subsidy_type == "省エネ補助金":
            base_config[ApplicationSection.PROJECT_DESCRIPTION]["keywords"].extend(["省エネ", "CO2削減", "効率"])
            base_config[ApplicationSection.EXPECTED_OUTCOMES]["keywords"].extend(["エネルギー削減", "投資回収"])
        elif subsidy_type == "研究開発助成金":
            base_config[ApplicationSection.INNOVATION_TECHNOLOGY] = {
                "min_length": 500,
                "max_length": 800,
                "keywords": ["技術", "革新", "研究"],
                "required_elements": ["技術説明", "新規性", "優位性"]
            }
            base_config[ApplicationSection.PROJECT_DESCRIPTION]["keywords"].extend(["研究", "開発", "実験"])
        elif subsidy_type == "海外展開支援補助金":
            base_config[ApplicationSection.MARKET_ANALYSIS]["keywords"].extend(["海外市場", "輸出", "現地"])
            base_config[ApplicationSection.BUSINESS_MODEL]["keywords"].extend(["海外展開", "パートナー"])
        elif subsidy_type == "事業承継補助金":
            base_config[ApplicationSection.COMPANY_OVERVIEW]["keywords"].extend(["承継", "後継者", "事業継続"])
            base_config[ApplicationSection.PROJECT_DESCRIPTION]["keywords"].extend(["経営革新", "承継計画"])
        
        return base_config

    # データ永続化

    async def _save_template(self, template: ApplicationTemplate):
        """テンプレート保存"""
        try:
            file_path = os.path.join(self.storage_path, f"template_{template.template_id}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(asdict(template), f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            logger.error(f"テンプレート保存エラー: {str(e)}")

    async def _save_customization(self, customization: TemplateCustomization):
        """カスタマイズ保存"""
        try:
            file_path = os.path.join(self.storage_path, f"custom_{customization.customization_id}.json")
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(asdict(customization), f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            logger.error(f"カスタマイズ保存エラー: {str(e)}")

    async def _save_usage_stats(self):
        """使用統計保存"""
        try:
            file_path = os.path.join(self.storage_path, "usage_stats.json")
            stats_data = {tid: asdict(stats) for tid, stats in self.usage_stats.items()}
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(stats_data, f, ensure_ascii=False, indent=2, default=str)
        except Exception as e:
            logger.error(f"使用統計保存エラー: {str(e)}")

    def _load_templates(self):
        """テンプレート読み込み"""
        try:
            for filename in os.listdir(self.storage_path):
                if filename.startswith("template_") and filename.endswith(".json"):
                    file_path = os.path.join(self.storage_path, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        # データクラス復元（簡易版）
                        template_id = data["template_id"]
                        self.templates[template_id] = ApplicationTemplate(**data)
                        self._update_indexes(self.templates[template_id])
        except Exception as e:
            logger.error(f"テンプレート読み込みエラー: {str(e)}")

    def _load_usage_stats(self):
        """使用統計読み込み"""
        try:
            file_path = os.path.join(self.storage_path, "usage_stats.json")
            if os.path.exists(file_path):
                with open(file_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for tid, stats_data in data.items():
                        self.usage_stats[tid] = TemplateUsageStats(**stats_data)
        except Exception as e:
            logger.error(f"使用統計読み込みエラー: {str(e)}")