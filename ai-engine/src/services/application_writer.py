"""
申請書詳細文章作成サービス
セクション別自動文章生成・テンプレート管理・品質向上機能
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
import json
import asyncio
import logging
import re
from collections import defaultdict

# 内部サービス
from .enhanced_ai_service import EnhancedAIService, AIProvider, AIRequest, AIResponse
from .quality_evaluator import QualityEvaluator
from .document_analyzer import DocumentAnalyzer
from ..prompts.prompt_manager import PromptManager, PromptType

logger = logging.getLogger(__name__)


class ApplicationSection(Enum):
    """申請書セクション"""
    COMPANY_OVERVIEW = "company_overview"           # 企業概要
    PROJECT_SUMMARY = "project_summary"             # 事業概要
    CURRENT_SITUATION = "current_situation"         # 現状・課題
    PROJECT_DESCRIPTION = "project_description"     # 事業内容詳細
    INNOVATION_TECHNOLOGY = "innovation_technology" # 革新性・技術
    MARKET_ANALYSIS = "market_analysis"             # 市場分析
    BUSINESS_MODEL = "business_model"               # ビジネスモデル
    IMPLEMENTATION_PLAN = "implementation_plan"     # 実施計画・体制
    TIMELINE_SCHEDULE = "timeline_schedule"         # スケジュール
    BUDGET_PLAN = "budget_plan"                     # 事業費・予算
    EXPECTED_OUTCOMES = "expected_outcomes"         # 期待効果・成果
    RISK_MANAGEMENT = "risk_management"             # リスク管理
    SUSTAINABILITY = "sustainability"               # 持続性・将来性
    SOCIAL_IMPACT = "social_impact"                 # 社会的意義
    APPENDIX = "appendix"                           # 補足資料


class WritingStyle(Enum):
    """文章スタイル"""
    FORMAL_BUSINESS = "formal_business"      # 正式なビジネス文書
    TECHNICAL_DETAILED = "technical_detailed" # 技術的詳細重視
    PERSUASIVE_APPEAL = "persuasive_appeal"  # 説得力重視
    CONCISE_CLEAR = "concise_clear"          # 簡潔明瞭
    ACADEMIC_RESEARCH = "academic_research"   # 学術的・研究重視


@dataclass
class SectionRequirements:
    """セクション要件"""
    section: ApplicationSection
    min_length: int = 200           # 最小文字数
    max_length: int = 800           # 最大文字数
    required_elements: List[str] = field(default_factory=list)  # 必須要素
    style: WritingStyle = WritingStyle.FORMAL_BUSINESS
    tone: str = "professional"     # 文章トーン
    focus_points: List[str] = field(default_factory=list)      # 重点ポイント
    keywords: List[str] = field(default_factory=list)          # 重要キーワード


@dataclass
class GeneratedSection:
    """生成セクション"""
    section: ApplicationSection
    title: str
    content: str
    word_count: int
    quality_score: float
    compliance_score: float      # 要件適合度
    improvement_suggestions: List[str]
    metadata: Dict[str, Any]
    generated_at: datetime


@dataclass
class ApplicationDocument:
    """申請書文書"""
    document_id: str
    subsidy_type: str
    company_profile: Dict[str, Any]
    sections: Dict[ApplicationSection, GeneratedSection]
    overall_quality: float
    consistency_score: float     # 全体一貫性
    total_word_count: int
    completion_rate: float       # 完成度
    created_at: datetime
    updated_at: datetime


class ApplicationWriter:
    """申請書文章作成サービス"""
    
    def __init__(self):
        """初期化"""
        self.ai_service = EnhancedAIService()
        self.quality_evaluator = QualityEvaluator()
        self.document_analyzer = DocumentAnalyzer()
        self.prompt_manager = PromptManager()
        
        # セクション要件定義
        self.section_requirements = self._initialize_section_requirements()
        
        # 補助金タイプ別要件
        self.subsidy_requirements = self._load_subsidy_requirements()
        
        # 文章スタイル設定
        self.writing_styles = self._load_writing_styles()
        
        # テンプレート管理
        self.templates = {}
        self._load_section_templates()

    async def generate_section(
        self,
        section: ApplicationSection,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        custom_requirements: Optional[SectionRequirements] = None,
        reference_sections: Optional[Dict[ApplicationSection, str]] = None
    ) -> GeneratedSection:
        """
        セクション文章生成
        
        Args:
            section: 生成するセクション
            company_profile: 企業プロファイル
            project_info: プロジェクト情報
            subsidy_type: 補助金タイプ
            custom_requirements: カスタム要件
            reference_sections: 参照セクション（一貫性確保）
            
        Returns:
            GeneratedSection: 生成されたセクション
        """
        try:
            logger.info(f"セクション生成開始: {section.value}")
            
            # 要件取得
            requirements = custom_requirements or self.section_requirements.get(
                section, SectionRequirements(section)
            )
            
            # コンテキスト構築
            context = await self._build_section_context(
                section, company_profile, project_info, subsidy_type, 
                requirements, reference_sections
            )
            
            # プロンプト取得・最適化
            prompt, prompt_id = await self.prompt_manager.get_optimized_prompt(
                PromptType.CONTENT_GENERATION,
                context,
                user_segment="application_writer"
            )
            
            # 複数候補生成
            candidates = await self._generate_multiple_candidates(
                prompt, context, requirements, num_candidates=3
            )
            
            # 最良候補選択
            best_candidate = await self._select_best_candidate(
                candidates, requirements, reference_sections
            )
            
            # 品質向上処理
            improved_content = await self._improve_content_quality(
                best_candidate, requirements, context
            )
            
            # 要件適合性チェック
            compliance_score = await self._check_compliance(
                improved_content, requirements
            )
            
            # 品質評価
            quality_score = await self.quality_evaluator.evaluate_business_plan(
                improved_content, company_profile, subsidy_type
            )
            
            # 改善提案生成
            suggestions = await self._generate_improvement_suggestions(
                improved_content, requirements, quality_score
            )
            
            # セクション作成
            generated_section = GeneratedSection(
                section=section,
                title=self._generate_section_title(section, subsidy_type),
                content=improved_content,
                word_count=len(improved_content),
                quality_score=quality_score,
                compliance_score=compliance_score,
                improvement_suggestions=suggestions,
                metadata={
                    "prompt_id": prompt_id,
                    "generation_method": "ai_enhanced",
                    "style": requirements.style.value,
                    "subsidy_type": subsidy_type,
                    "candidates_generated": len(candidates)
                },
                generated_at=datetime.now()
            )
            
            logger.info(f"セクション生成完了: {section.value} (品質: {quality_score:.1f})")
            return generated_section
            
        except Exception as e:
            logger.error(f"セクション生成エラー: {str(e)}")
            return await self._fallback_section_generation(
                section, company_profile, project_info, subsidy_type
            )

    async def generate_complete_application(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        target_sections: Optional[List[ApplicationSection]] = None,
        custom_requirements: Optional[Dict[ApplicationSection, SectionRequirements]] = None
    ) -> ApplicationDocument:
        """
        完全な申請書生成
        
        Args:
            company_profile: 企業プロファイル
            project_info: プロジェクト情報
            subsidy_type: 補助金タイプ
            target_sections: 対象セクション（指定なしで全セクション）
            custom_requirements: セクション別カスタム要件
            
        Returns:
            ApplicationDocument: 完成申請書
        """
        try:
            logger.info(f"完全申請書生成開始: {subsidy_type}")
            
            # 対象セクション決定
            if target_sections is None:
                target_sections = self._get_required_sections(subsidy_type)
            
            # セクション生成順序最適化（依存関係考慮）
            generation_order = self._optimize_generation_order(target_sections)
            
            sections = {}
            reference_sections = {}
            
            # セクション順次生成
            for section in generation_order:
                requirements = None
                if custom_requirements and section in custom_requirements:
                    requirements = custom_requirements[section]
                
                generated_section = await self.generate_section(
                    section=section,
                    company_profile=company_profile,
                    project_info=project_info,
                    subsidy_type=subsidy_type,
                    custom_requirements=requirements,
                    reference_sections=reference_sections
                )
                
                sections[section] = generated_section
                reference_sections[section] = generated_section.content
                
                logger.info(f"セクション完了: {section.value}")
            
            # 全体一貫性チェック・調整
            sections = await self._ensure_consistency(sections, company_profile, subsidy_type)
            
            # 総合評価
            overall_quality = await self._calculate_overall_quality(sections)
            consistency_score = await self._calculate_consistency_score(sections)
            total_word_count = sum(s.word_count for s in sections.values())
            completion_rate = len(sections) / len(target_sections)
            
            # 申請書文書作成
            document = ApplicationDocument(
                document_id=f"app_{int(datetime.now().timestamp())}",
                subsidy_type=subsidy_type,
                company_profile=company_profile,
                sections=sections,
                overall_quality=overall_quality,
                consistency_score=consistency_score,
                total_word_count=total_word_count,
                completion_rate=completion_rate,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            logger.info(f"完全申請書生成完了: 品質 {overall_quality:.1f}, 一貫性 {consistency_score:.1f}")
            return document
            
        except Exception as e:
            logger.error(f"完全申請書生成エラー: {str(e)}")
            raise

    async def improve_existing_section(
        self,
        existing_content: str,
        section: ApplicationSection,
        company_profile: Dict[str, Any],
        improvement_focus: List[str] = None
    ) -> GeneratedSection:
        """
        既存セクション改善
        
        Args:
            existing_content: 既存コンテンツ
            section: セクション種別
            company_profile: 企業プロファイル
            improvement_focus: 改善フォーカス
            
        Returns:
            GeneratedSection: 改善されたセクション
        """
        try:
            # 現在の品質評価
            current_quality = await self.quality_evaluator.comprehensive_evaluation(
                existing_content, {"section": section.value}, "application_section"
            )
            
            # 改善ポイント特定
            improvement_points = improvement_focus or current_quality.weaknesses
            
            # 改善プロンプト構築
            improvement_context = {
                "existing_content": existing_content,
                "section_type": section.value,
                "company_name": company_profile.get("name", ""),
                "industry": company_profile.get("industry", ""),
                "improvement_points": improvement_points,
                "current_quality": current_quality.metrics.overall_score
            }
            
            # 改善文章生成
            improved_content = await self._generate_improved_content(
                improvement_context, current_quality
            )
            
            # 改善後品質評価
            new_quality = await self.quality_evaluator.evaluate_business_plan(
                improved_content, company_profile, "general"
            )
            
            return GeneratedSection(
                section=section,
                title=self._generate_section_title(section, "general"),
                content=improved_content,
                word_count=len(improved_content),
                quality_score=new_quality,
                compliance_score=0.85,  # 既存コンテンツベースのため高め
                improvement_suggestions=[],
                metadata={
                    "improvement_type": "content_enhancement",
                    "original_quality": current_quality.metrics.overall_score,
                    "quality_improvement": new_quality - current_quality.metrics.overall_score
                },
                generated_at=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"セクション改善エラー: {str(e)}")
            raise

    async def customize_for_subsidy_type(
        self,
        base_document: ApplicationDocument,
        new_subsidy_type: str
    ) -> ApplicationDocument:
        """
        補助金タイプ別カスタマイズ
        
        Args:
            base_document: ベース申請書
            new_subsidy_type: 新しい補助金タイプ
            
        Returns:
            ApplicationDocument: カスタマイズされた申請書
        """
        try:
            logger.info(f"補助金タイプ別カスタマイズ: {new_subsidy_type}")
            
            # 新しい要件取得
            new_requirements = self.subsidy_requirements.get(new_subsidy_type, {})
            
            customized_sections = {}
            
            for section_type, section in base_document.sections.items():
                # セクション別カスタマイズ
                customized_content = await self._customize_section_for_subsidy(
                    section, new_subsidy_type, new_requirements
                )
                
                customized_sections[section_type] = GeneratedSection(
                    section=section_type,
                    title=section.title,
                    content=customized_content,
                    word_count=len(customized_content),
                    quality_score=section.quality_score * 0.95,  # 若干下げる
                    compliance_score=section.compliance_score,
                    improvement_suggestions=section.improvement_suggestions,
                    metadata={
                        **section.metadata,
                        "customized_for": new_subsidy_type,
                        "original_subsidy": base_document.subsidy_type
                    },
                    generated_at=datetime.now()
                )
            
            # 新しい申請書作成
            customized_document = ApplicationDocument(
                document_id=f"app_custom_{int(datetime.now().timestamp())}",
                subsidy_type=new_subsidy_type,
                company_profile=base_document.company_profile,
                sections=customized_sections,
                overall_quality=base_document.overall_quality * 0.95,
                consistency_score=base_document.consistency_score,
                total_word_count=sum(s.word_count for s in customized_sections.values()),
                completion_rate=base_document.completion_rate,
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            return customized_document
            
        except Exception as e:
            logger.error(f"カスタマイズエラー: {str(e)}")
            raise

    # 内部メソッド

    async def _build_section_context(
        self,
        section: ApplicationSection,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        requirements: SectionRequirements,
        reference_sections: Optional[Dict[ApplicationSection, str]]
    ) -> Dict[str, Any]:
        """セクション生成コンテキスト構築"""
        
        context = {
            # 基本情報
            "section_type": section.value,
            "company_name": company_profile.get("name", ""),
            "industry": company_profile.get("industry", ""),
            "employee_count": company_profile.get("employee_count", 0),
            "company_description": company_profile.get("description", ""),
            "founded_year": company_profile.get("founded_year", ""),
            
            # プロジェクト情報
            "project_title": project_info.get("title", ""),
            "project_description": project_info.get("description", ""),
            "project_goals": project_info.get("goals", []),
            "budget_amount": project_info.get("budget", 0),
            "project_duration": project_info.get("duration", ""),
            
            # 補助金情報
            "subsidy_type": subsidy_type,
            "subsidy_requirements": self.subsidy_requirements.get(subsidy_type, {}),
            
            # セクション要件
            "min_length": requirements.min_length,
            "max_length": requirements.max_length,
            "required_elements": requirements.required_elements,
            "writing_style": requirements.style.value,
            "tone": requirements.tone,
            "focus_points": requirements.focus_points,
            "keywords": requirements.keywords,
            
            # 参照セクション（一貫性のため）
            "reference_sections": reference_sections or {}
        }
        
        return context

    async def _generate_multiple_candidates(
        self,
        prompt: str,
        context: Dict[str, Any],
        requirements: SectionRequirements,
        num_candidates: int = 3
    ) -> List[str]:
        """複数候補生成"""
        
        candidates = []
        
        # 異なるプロバイダー・設定で生成
        generation_configs = [
            {"provider": AIProvider.OPENAI, "temperature": 0.7},
            {"provider": AIProvider.ANTHROPIC, "temperature": 0.5},
            {"provider": AIProvider.HYBRID, "temperature": 0.6}
        ]
        
        for i in range(num_candidates):
            config = generation_configs[i % len(generation_configs)]
            
            try:
                # AI生成実行
                response = await self.ai_service.generate_business_plan(
                    company_data=context,
                    subsidy_type=context["subsidy_type"],
                    provider=config["provider"]
                )
                
                if response.success and response.content:
                    candidates.append(response.content)
                
            except Exception as e:
                logger.warning(f"候補生成失敗 {i+1}: {str(e)}")
                # フォールバック候補
                candidates.append(self._generate_fallback_content(context, requirements))
        
        return candidates

    async def _select_best_candidate(
        self,
        candidates: List[str],
        requirements: SectionRequirements,
        reference_sections: Optional[Dict[ApplicationSection, str]]
    ) -> str:
        """最良候補選択"""
        
        if not candidates:
            return self._generate_fallback_content({}, requirements)
        
        if len(candidates) == 1:
            return candidates[0]
        
        # 各候補を評価
        candidate_scores = []
        
        for candidate in candidates:
            # 長さ評価
            length_score = self._evaluate_length_compliance(candidate, requirements)
            
            # 要素含有評価
            element_score = self._evaluate_required_elements(candidate, requirements)
            
            # 一貫性評価
            consistency_score = 0.5
            if reference_sections:
                consistency_score = await self._evaluate_consistency_with_references(
                    candidate, reference_sections
                )
            
            total_score = (length_score * 0.3 + element_score * 0.4 + consistency_score * 0.3)
            candidate_scores.append(total_score)
        
        # 最高スコア候補を選択
        best_index = candidate_scores.index(max(candidate_scores))
        return candidates[best_index]

    async def _improve_content_quality(
        self,
        content: str,
        requirements: SectionRequirements,
        context: Dict[str, Any]
    ) -> str:
        """コンテンツ品質向上"""
        
        # 基本的な改善処理
        improved = content
        
        # 1. 長さ調整
        improved = self._adjust_content_length(improved, requirements)
        
        # 2. キーワード強化
        improved = self._enhance_keywords(improved, requirements.keywords)
        
        # 3. 文章構造改善
        improved = self._improve_structure(improved, requirements)
        
        # 4. 専門用語・表現改善
        improved = self._improve_terminology(improved, context)
        
        return improved

    async def _check_compliance(
        self,
        content: str,
        requirements: SectionRequirements
    ) -> float:
        """要件適合性チェック"""
        
        compliance_scores = []
        
        # 長さ要件
        length_compliance = self._evaluate_length_compliance(content, requirements)
        compliance_scores.append(length_compliance)
        
        # 必須要素要件
        element_compliance = self._evaluate_required_elements(content, requirements)
        compliance_scores.append(element_compliance)
        
        # キーワード要件
        keyword_compliance = self._evaluate_keyword_presence(content, requirements.keywords)
        compliance_scores.append(keyword_compliance)
        
        # 文体要件
        style_compliance = self._evaluate_writing_style(content, requirements.style)
        compliance_scores.append(style_compliance)
        
        return sum(compliance_scores) / len(compliance_scores)

    async def _generate_improvement_suggestions(
        self,
        content: str,
        requirements: SectionRequirements,
        quality_score: float
    ) -> List[str]:
        """改善提案生成"""
        
        suggestions = []
        
        if quality_score < 70:
            suggestions.append("内容の具体性と説得力を向上させてください")
        
        if len(content) < requirements.min_length:
            suggestions.append(f"文字数を{requirements.min_length}文字以上に増やしてください")
        
        if len(content) > requirements.max_length:
            suggestions.append(f"文字数を{requirements.max_length}文字以下に削減してください")
        
        missing_elements = [
            elem for elem in requirements.required_elements
            if elem not in content
        ]
        if missing_elements:
            suggestions.append(f"必須要素を追加してください: {', '.join(missing_elements)}")
        
        missing_keywords = [
            keyword for keyword in requirements.keywords
            if keyword not in content
        ]
        if missing_keywords:
            suggestions.append(f"重要キーワードを含めてください: {', '.join(missing_keywords)}")
        
        return suggestions

    def _evaluate_length_compliance(
        self,
        content: str,
        requirements: SectionRequirements
    ) -> float:
        """長さ要件評価"""
        
        length = len(content)
        min_len = requirements.min_length
        max_len = requirements.max_length
        
        if min_len <= length <= max_len:
            return 1.0
        elif length < min_len:
            return max(0.0, length / min_len)
        else:  # length > max_len
            return max(0.0, 1.0 - (length - max_len) / max_len)

    def _evaluate_required_elements(
        self,
        content: str,
        requirements: SectionRequirements
    ) -> float:
        """必須要素評価"""
        
        if not requirements.required_elements:
            return 1.0
        
        present_count = sum(
            1 for element in requirements.required_elements
            if element in content
        )
        
        return present_count / len(requirements.required_elements)

    def _evaluate_keyword_presence(
        self,
        content: str,
        keywords: List[str]
    ) -> float:
        """キーワード存在評価"""
        
        if not keywords:
            return 1.0
        
        present_count = sum(1 for keyword in keywords if keyword in content)
        return present_count / len(keywords)

    def _evaluate_writing_style(
        self,
        content: str,
        style: WritingStyle
    ) -> float:
        """文章スタイル評価"""
        
        style_indicators = self.writing_styles.get(style, {})
        
        if not style_indicators:
            return 0.7  # デフォルト
        
        # スタイル指標の存在をチェック
        positive_indicators = style_indicators.get("positive", [])
        negative_indicators = style_indicators.get("negative", [])
        
        positive_score = sum(1 for indicator in positive_indicators if indicator in content)
        negative_score = sum(1 for indicator in negative_indicators if indicator in content)
        
        # 正の指標は加点、負の指標は減点
        style_score = 0.5 + (positive_score * 0.1) - (negative_score * 0.05)
        
        return max(0.0, min(1.0, style_score))

    async def _evaluate_consistency_with_references(
        self,
        content: str,
        reference_sections: Dict[ApplicationSection, str]
    ) -> float:
        """参照セクションとの一貫性評価"""
        
        # 簡易一貫性評価（実際にはより高度な評価が必要）
        if not reference_sections:
            return 0.5
        
        # キーワード一致度で評価
        content_words = set(content.split())
        
        consistency_scores = []
        for ref_content in reference_sections.values():
            ref_words = set(ref_content.split())
            overlap = len(content_words & ref_words)
            total = len(content_words | ref_words)
            
            if total > 0:
                consistency_scores.append(overlap / total)
        
        return sum(consistency_scores) / len(consistency_scores) if consistency_scores else 0.5

    def _adjust_content_length(
        self,
        content: str,
        requirements: SectionRequirements
    ) -> str:
        """コンテンツ長さ調整"""
        
        current_length = len(content)
        min_length = requirements.min_length
        max_length = requirements.max_length
        
        if current_length < min_length:
            # 内容を拡張
            sentences = content.split('。')
            expanded_sentences = []
            
            for sentence in sentences:
                expanded_sentences.append(sentence)
                if len('。'.join(expanded_sentences)) < min_length:
                    # 文を詳細化
                    if '効果' in sentence:
                        expanded_sentences.append('具体的な効果測定指標を設定し、定期的に評価を行います')
                    elif '実施' in sentence:
                        expanded_sentences.append('実施にあたっては、段階的なアプローチを採用し、リスクを最小化します')
            
            return '。'.join(expanded_sentences)
        
        elif current_length > max_length:
            # 内容を短縮
            sentences = content.split('。')
            # 重要度の低い文を除去
            important_sentences = []
            current_len = 0
            
            for sentence in sentences:
                if current_len + len(sentence) <= max_length:
                    important_sentences.append(sentence)
                    current_len += len(sentence)
                else:
                    break
            
            return '。'.join(important_sentences)
        
        return content

    def _enhance_keywords(self, content: str, keywords: List[str]) -> str:
        """キーワード強化"""
        enhanced = content
        
        for keyword in keywords:
            if keyword not in enhanced:
                # 適切な位置にキーワードを挿入
                sentences = enhanced.split('。')
                if len(sentences) > 1:
                    # 最初の文に挿入
                    first_sentence = sentences[0]
                    if '技術' in keyword or 'AI' in keyword:
                        first_sentence += f'、特に{keyword}を重視します'
                    else:
                        first_sentence += f'、{keyword}に焦点を当てます'
                    sentences[0] = first_sentence
                    enhanced = '。'.join(sentences)
        
        return enhanced

    def _improve_structure(
        self,
        content: str,
        requirements: SectionRequirements
    ) -> str:
        """文章構造改善"""
        
        # 段落分けの改善
        sentences = content.split('。')
        
        if len(sentences) <= 3:
            return content
        
        # 論理的な構造に再編成
        structured_content = []
        
        # 導入部
        if sentences:
            structured_content.append(sentences[0])
        
        # 本文（複数段落に分割）
        main_sentences = sentences[1:-1] if len(sentences) > 2 else []
        if main_sentences:
            mid_point = len(main_sentences) // 2
            structured_content.append('\n\n' + '。'.join(main_sentences[:mid_point]))
            if mid_point < len(main_sentences):
                structured_content.append('\n\n' + '。'.join(main_sentences[mid_point:]))
        
        # 結論部
        if len(sentences) > 1:
            structured_content.append('\n\n' + sentences[-1])
        
        return '。'.join(structured_content)

    def _improve_terminology(
        self,
        content: str,
        context: Dict[str, Any]
    ) -> str:
        """専門用語・表現改善"""
        
        # 業界特化用語への置換
        industry = context.get("industry", "")
        
        terminology_map = {
            "IT": {
                "システム": "ITシステム",
                "効率化": "DX推進による効率化",
                "導入": "システム導入"
            },
            "製造業": {
                "システム": "製造管理システム",
                "効率化": "生産性向上",
                "技術": "製造技術"
            }
        }
        
        improved = content
        
        if industry in terminology_map:
            for original, replacement in terminology_map[industry].items():
                improved = improved.replace(original, replacement)
        
        return improved

    def _generate_fallback_content(
        self,
        context: Dict[str, Any],
        requirements: SectionRequirements
    ) -> str:
        """フォールバックコンテンツ生成"""
        
        section = requirements.section
        
        fallback_templates = {
            ApplicationSection.COMPANY_OVERVIEW: """
弊社は{industry}分野において、{company_description}を主要事業として展開している企業です。
設立以来、{industry}業界における課題解決に取り組み、お客様のニーズに応える製品・サービスを提供してまいりました。
今回の事業を通じて、さらなる事業拡大と社会貢献を目指してまいります。
            """,
            ApplicationSection.PROJECT_SUMMARY: """
本事業は、{project_description}を目的とした革新的な取り組みです。
{subsidy_type}を活用し、{industry}業界における課題解決と事業成長を同時に実現します。
プロジェクトの実施により、業務効率の向上と競争力強化を図ります。
            """,
            ApplicationSection.IMPLEMENTATION_PLAN: """
本事業の実施にあたっては、段階的なアプローチを採用し、リスクを最小化しながら確実な成果を目指します。
第一段階では基盤整備を行い、第二段階で本格的な展開を実施します。
各段階において、適切な評価・改善を行い、計画の実効性を確保いたします。
            """
        }
        
        template = fallback_templates.get(section, "本セクションの詳細内容を記載いたします。")
        
        # コンテキスト変数の置換
        try:
            return template.format(**context)
        except KeyError:
            return template

    async def _fallback_section_generation(
        self,
        section: ApplicationSection,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str
    ) -> GeneratedSection:
        """フォールバックセクション生成"""
        
        requirements = SectionRequirements(section)
        context = {
            "industry": company_profile.get("industry", ""),
            "company_description": company_profile.get("description", ""),
            "project_description": project_info.get("description", ""),
            "subsidy_type": subsidy_type
        }
        
        fallback_content = self._generate_fallback_content(context, requirements)
        
        return GeneratedSection(
            section=section,
            title=self._generate_section_title(section, subsidy_type),
            content=fallback_content,
            word_count=len(fallback_content),
            quality_score=60.0,  # フォールバック品質
            compliance_score=0.7,
            improvement_suggestions=["詳細な内容の追加が必要です"],
            metadata={"generation_method": "fallback"},
            generated_at=datetime.now()
        )

    # データ初期化・設定メソッド

    def _initialize_section_requirements(self) -> Dict[ApplicationSection, SectionRequirements]:
        """セクション要件初期化"""
        return {
            ApplicationSection.COMPANY_OVERVIEW: SectionRequirements(
                section=ApplicationSection.COMPANY_OVERVIEW,
                min_length=200, max_length=500,
                required_elements=["企業概要", "事業内容", "実績"],
                keywords=["企業", "事業", "実績", "強み"]
            ),
            ApplicationSection.PROJECT_SUMMARY: SectionRequirements(
                section=ApplicationSection.PROJECT_SUMMARY,
                min_length=300, max_length=600,
                required_elements=["事業概要", "目的", "効果"],
                keywords=["事業", "目的", "効果", "革新"]
            ),
            ApplicationSection.CURRENT_SITUATION: SectionRequirements(
                section=ApplicationSection.CURRENT_SITUATION,
                min_length=250, max_length=500,
                required_elements=["現状", "課題", "必要性"],
                keywords=["課題", "問題", "必要性", "改善"]
            ),
            ApplicationSection.PROJECT_DESCRIPTION: SectionRequirements(
                section=ApplicationSection.PROJECT_DESCRIPTION,
                min_length=400, max_length=800,
                required_elements=["事業内容", "手法", "技術", "特徴"],
                keywords=["技術", "手法", "特徴", "優位性"]
            ),
            ApplicationSection.IMPLEMENTATION_PLAN: SectionRequirements(
                section=ApplicationSection.IMPLEMENTATION_PLAN,
                min_length=300, max_length=600,
                required_elements=["実施体制", "スケジュール", "管理方法"],
                keywords=["実施", "体制", "管理", "計画"]
            ),
            ApplicationSection.EXPECTED_OUTCOMES: SectionRequirements(
                section=ApplicationSection.EXPECTED_OUTCOMES,
                min_length=250, max_length=500,
                required_elements=["期待効果", "成果指標", "測定方法"],
                keywords=["効果", "成果", "向上", "削減"]
            )
        }

    def _load_subsidy_requirements(self) -> Dict[str, Dict[str, Any]]:
        """補助金タイプ別要件読み込み"""
        return {
            "IT導入補助金": {
                "focus_keywords": ["IT", "デジタル化", "DX", "効率化", "生産性"],
                "required_elements": ["IT導入", "効果測定", "計画性"],
                "writing_style": WritingStyle.TECHNICAL_DETAILED
            },
            "ものづくり補助金": {
                "focus_keywords": ["製造", "技術革新", "生産性", "設備", "開発"],
                "required_elements": ["技術性", "市場性", "実現性"],
                "writing_style": WritingStyle.FORMAL_BUSINESS
            },
            "事業再構築補助金": {
                "focus_keywords": ["事業転換", "新分野", "成長", "変革", "持続性"],
                "required_elements": ["再構築", "市場分析", "成長性"],
                "writing_style": WritingStyle.PERSUASIVE_APPEAL
            }
        }

    def _load_writing_styles(self) -> Dict[WritingStyle, Dict[str, List[str]]]:
        """文章スタイル設定読み込み"""
        return {
            WritingStyle.FORMAL_BUSINESS: {
                "positive": ["により", "について", "に関して", "実施", "展開"],
                "negative": ["だと思う", "かもしれない", "～的な"]
            },
            WritingStyle.TECHNICAL_DETAILED: {
                "positive": ["技術", "システム", "仕様", "詳細", "具体的"],
                "negative": ["感覚的", "抽象的"]
            },
            WritingStyle.PERSUASIVE_APPEAL: {
                "positive": ["効果的", "革新的", "優秀", "画期的", "飛躍的"],
                "negative": ["通常", "一般的", "普通"]
            }
        }

    def _load_section_templates(self):
        """セクションテンプレート読み込み"""
        # プロンプトマネージャーとの連携でテンプレート管理
        pass

    def _generate_section_title(self, section: ApplicationSection, subsidy_type: str) -> str:
        """セクションタイトル生成"""
        title_map = {
            ApplicationSection.COMPANY_OVERVIEW: "企業概要",
            ApplicationSection.PROJECT_SUMMARY: "事業概要", 
            ApplicationSection.CURRENT_SITUATION: "現状と課題",
            ApplicationSection.PROJECT_DESCRIPTION: "事業内容詳細",
            ApplicationSection.INNOVATION_TECHNOLOGY: "技術的革新性",
            ApplicationSection.MARKET_ANALYSIS: "市場分析",
            ApplicationSection.IMPLEMENTATION_PLAN: "実施計画・体制",
            ApplicationSection.TIMELINE_SCHEDULE: "実施スケジュール",
            ApplicationSection.BUDGET_PLAN: "事業費・予算計画",
            ApplicationSection.EXPECTED_OUTCOMES: "期待される効果・成果",
            ApplicationSection.RISK_MANAGEMENT: "リスク管理",
            ApplicationSection.SUSTAINABILITY: "持続性・将来性"
        }
        
        return title_map.get(section, section.value)

    def _get_required_sections(self, subsidy_type: str) -> List[ApplicationSection]:
        """補助金タイプ別必須セクション取得"""
        base_sections = [
            ApplicationSection.COMPANY_OVERVIEW,
            ApplicationSection.PROJECT_SUMMARY,
            ApplicationSection.CURRENT_SITUATION,
            ApplicationSection.PROJECT_DESCRIPTION,
            ApplicationSection.IMPLEMENTATION_PLAN,
            ApplicationSection.EXPECTED_OUTCOMES
        ]
        
        # 補助金タイプ別追加セクション
        additional_sections = {
            "IT導入補助金": [ApplicationSection.INNOVATION_TECHNOLOGY],
            "ものづくり補助金": [ApplicationSection.MARKET_ANALYSIS, ApplicationSection.BUDGET_PLAN],
            "事業再構築補助金": [ApplicationSection.MARKET_ANALYSIS, ApplicationSection.SUSTAINABILITY]
        }
        
        sections = base_sections[:]
        if subsidy_type in additional_sections:
            sections.extend(additional_sections[subsidy_type])
        
        return sections

    def _optimize_generation_order(
        self, 
        sections: List[ApplicationSection]
    ) -> List[ApplicationSection]:
        """生成順序最適化（依存関係考慮）"""
        
        # 依存関係定義
        dependencies = {
            ApplicationSection.PROJECT_DESCRIPTION: [ApplicationSection.COMPANY_OVERVIEW],
            ApplicationSection.IMPLEMENTATION_PLAN: [ApplicationSection.PROJECT_DESCRIPTION],
            ApplicationSection.EXPECTED_OUTCOMES: [ApplicationSection.PROJECT_DESCRIPTION],
            ApplicationSection.BUDGET_PLAN: [ApplicationSection.PROJECT_DESCRIPTION]
        }
        
        # トポロジカルソート風の順序決定
        ordered = []
        remaining = sections[:]
        
        while remaining:
            # 依存関係のないセクションを先に処理
            for section in remaining[:]:
                deps = dependencies.get(section, [])
                if all(dep in ordered for dep in deps):
                    ordered.append(section)
                    remaining.remove(section)
                    break
            else:
                # 循環依存の場合は残りをそのまま追加
                ordered.extend(remaining)
                break
        
        return ordered

    async def _ensure_consistency(
        self,
        sections: Dict[ApplicationSection, GeneratedSection],
        company_profile: Dict[str, Any],
        subsidy_type: str
    ) -> Dict[ApplicationSection, GeneratedSection]:
        """全体一貫性確保"""
        
        # 企業名・業界の一貫性チェック
        company_name = company_profile.get("name", "")
        industry = company_profile.get("industry", "")
        
        for section_type, section in sections.items():
            content = section.content
            
            # 企業名の統一
            if company_name and company_name not in content:
                if "弊社" in content:
                    content = content.replace("弊社", f"{company_name}（弊社）", 1)
            
            # 業界用語の統一
            # （必要に応じて業界特化の一貫性調整）
            
            # 更新
            sections[section_type] = GeneratedSection(
                section=section.section,
                title=section.title,
                content=content,
                word_count=len(content),
                quality_score=section.quality_score,
                compliance_score=section.compliance_score,
                improvement_suggestions=section.improvement_suggestions,
                metadata=section.metadata,
                generated_at=section.generated_at
            )
        
        return sections

    async def _calculate_overall_quality(
        self,
        sections: Dict[ApplicationSection, GeneratedSection]
    ) -> float:
        """全体品質計算"""
        if not sections:
            return 0.0
        
        quality_scores = [section.quality_score for section in sections.values()]
        return sum(quality_scores) / len(quality_scores)

    async def _calculate_consistency_score(
        self,
        sections: Dict[ApplicationSection, GeneratedSection]
    ) -> float:
        """一貫性スコア計算"""
        if len(sections) < 2:
            return 1.0
        
        # セクション間のキーワード重複度で一貫性を評価
        all_words = []
        section_words = []
        
        for section in sections.values():
            words = set(section.content.split())
            section_words.append(words)
            all_words.extend(words)
        
        # 共通キーワードの割合
        common_words = set(all_words)
        for words in section_words:
            common_words &= words
        
        total_unique_words = len(set(all_words))
        if total_unique_words == 0:
            return 0.0
        
        consistency = len(common_words) / total_unique_words
        return min(consistency * 2, 1.0)  # 2倍して正規化

    async def _generate_improved_content(
        self,
        improvement_context: Dict[str, Any],
        current_quality: Any
    ) -> str:
        """改善コンテンツ生成"""
        
        # 改善プロンプト構築
        improvement_prompt = f"""
以下のコンテンツを改善してください。

【現在のコンテンツ】
{improvement_context['existing_content']}

【改善ポイント】
{', '.join(improvement_context['improvement_points'])}

【要求事項】
- より具体的で説得力のある内容にしてください
- 専門性を高めつつ読みやすさを保ってください
- 数値や根拠を可能な限り含めてください

改善されたコンテンツを出力してください。
"""
        
        # AI生成実行
        response = await self.ai_service.generate_business_plan(
            company_data=improvement_context,
            subsidy_type="general",
            provider=AIProvider.HYBRID
        )
        
        if response.success and response.content:
            return response.content
        else:
            # フォールバック改善
            return self._basic_content_improvement(improvement_context['existing_content'])

    def _basic_content_improvement(self, content: str) -> str:
        """基本的コンテンツ改善"""
        improved = content
        
        # 具体性向上
        improved = improved.replace("効果があります", "大幅な効果を期待できます")
        improved = improved.replace("実施します", "積極的に実施いたします")
        improved = improved.replace("向上", "大幅な向上")
        
        # 数値表現追加
        if "効率" in improved and "%" not in improved:
            improved = improved.replace("効率向上", "効率30%向上")
        
        return improved

    async def _customize_section_for_subsidy(
        self,
        section: GeneratedSection,
        new_subsidy_type: str,
        new_requirements: Dict[str, Any]
    ) -> str:
        """補助金タイプ別セクションカスタマイズ"""
        
        content = section.content
        
        # 補助金タイプ特化キーワードの置換・追加
        focus_keywords = new_requirements.get("focus_keywords", [])
        
        for keyword in focus_keywords:
            if keyword not in content:
                # 適切な位置にキーワードを挿入
                sentences = content.split('。')
                if sentences:
                    first_sentence = sentences[0]
                    first_sentence += f"、特に{keyword}に注力します"
                    sentences[0] = first_sentence
                    content = '。'.join(sentences)
                break
        
        # 補助金名の更新
        content = re.sub(r'[^。]*補助金', new_subsidy_type, content)
        
        return content