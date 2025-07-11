"""
文章品質向上・校正サービス
申請書文章の品質向上・誤字脱字チェック・文体統一・内容最適化
"""

from typing import Dict, List, Optional, Any, Tuple, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import logging
import re
import json
from collections import defaultdict, Counter

from .enhanced_ai_service import EnhancedAIService, AIProvider
from .application_writer import ApplicationSection, ApplicationDocument, GeneratedSection
from .quality_evaluator import QualityEvaluator
from ..prompts.prompt_manager import PromptManager

logger = logging.getLogger(__name__)


class IssueType(Enum):
    """校正問題タイプ"""
    GRAMMAR = "grammar"                    # 文法エラー
    SPELLING = "spelling"                  # 誤字脱字
    STYLE_INCONSISTENCY = "style_inconsistency"  # 文体不統一
    TERMINOLOGY = "terminology"            # 用語統一
    TONE = "tone"                         # トーン調整
    CLARITY = "clarity"                   # 明瞭性
    REDUNDANCY = "redundancy"             # 冗長性
    COHERENCE = "coherence"               # 一貫性
    FORMAL_LANGUAGE = "formal_language"   # 敬語・丁寧語
    TECHNICAL_ACCURACY = "technical_accuracy"  # 技術的正確性


class Severity(Enum):
    """重要度レベル"""
    CRITICAL = "critical"    # 致命的
    HIGH = "high"           # 高
    MEDIUM = "medium"       # 中
    LOW = "low"            # 低
    SUGGESTION = "suggestion"  # 提案


@dataclass
class ProofreadingIssue:
    """校正問題"""
    issue_id: str
    issue_type: IssueType
    severity: Severity
    location: Dict[str, Any]  # セクション、段落、文番号など
    original_text: str
    suggested_text: str
    explanation: str
    confidence: float = 0.8
    auto_fixable: bool = False
    context: Dict[str, Any] = field(default_factory=dict)


@dataclass 
class ProofreadingResult:
    """校正結果"""
    document_id: str
    total_issues: int
    issues_by_severity: Dict[Severity, int]
    issues_by_type: Dict[IssueType, int]
    issues: List[ProofreadingIssue]
    overall_quality_score: float
    readability_score: float
    consistency_score: float
    improved_content: Dict[ApplicationSection, str]
    processing_time: float
    suggestions: List[str]
    generated_at: datetime


@dataclass
class StyleGuide:
    """文体ガイド"""
    tone: str = "formal"                    # formal, casual, technical
    point_of_view: str = "third_person"     # first_person, third_person
    voice: str = "active"                   # active, passive
    tense: str = "present"                  # present, past, future
    honorific_level: str = "respectful"     # casual, polite, respectful
    technical_terms: Dict[str, str] = field(default_factory=dict)
    forbidden_words: List[str] = field(default_factory=list)
    preferred_expressions: Dict[str, str] = field(default_factory=dict)


class DocumentProofreader:
    """文章品質向上・校正サービス"""
    
    def __init__(self):
        """初期化"""
        self.ai_service = EnhancedAIService()
        self.quality_evaluator = QualityEvaluator()
        self.prompt_manager = PromptManager()
        
        # 校正ルールとパターン
        self.grammar_patterns = self._initialize_grammar_patterns()
        self.spelling_dictionary = self._load_spelling_dictionary()
        self.terminology_map = self._load_terminology_map()
        
        # デフォルト文体ガイド
        self.default_style_guide = StyleGuide(
            tone="formal",
            point_of_view="third_person", 
            voice="active",
            tense="present",
            honorific_level="respectful",
            technical_terms={
                "AI": "人工知能（AI）",
                "DX": "デジタルトランスフォーメーション（DX）",
                "IoT": "モノのインターネット（IoT）"
            },
            forbidden_words=["やばい", "すごい", "微妙"],
            preferred_expressions={
                "すること": "行うこと",
                "やること": "実施すること",
                "作る": "作成する",
                "使う": "活用する"
            }
        )

    async def proofread_document(
        self,
        document: ApplicationDocument,
        style_guide: Optional[StyleGuide] = None,
        focus_areas: Optional[List[IssueType]] = None,
        auto_fix: bool = True
    ) -> ProofreadingResult:
        """
        文書校正実行
        
        Args:
            document: 対象文書
            style_guide: 文体ガイド
            focus_areas: 重点校正エリア
            auto_fix: 自動修正フラグ
            
        Returns:
            ProofreadingResult: 校正結果
        """
        try:
            start_time = datetime.now()
            
            if style_guide is None:
                style_guide = self.default_style_guide
            
            logger.info(f"文書校正開始: {document.document_id}")
            
            # 全体的な品質評価
            overall_quality = await self._evaluate_overall_quality(document)
            
            # セクション別校正
            all_issues = []
            improved_content = {}
            
            for section, generated_section in document.sections.items():
                section_issues = await self._proofread_section(
                    section, generated_section, style_guide, focus_areas
                )
                all_issues.extend(section_issues)
                
                # 自動修正適用
                if auto_fix:
                    improved_text = await self._apply_auto_fixes(
                        generated_section.content, section_issues, style_guide
                    )
                    improved_content[section] = improved_text
                else:
                    improved_content[section] = generated_section.content
            
            # 文書間一貫性チェック
            consistency_issues = await self._check_document_consistency(
                document, style_guide
            )
            all_issues.extend(consistency_issues)
            
            # 結果集計
            processing_time = (datetime.now() - start_time).total_seconds()
            
            result = await self._compile_proofreading_result(
                document.document_id,
                all_issues,
                improved_content,
                overall_quality,
                processing_time
            )
            
            logger.info(f"文書校正完了: {document.document_id}, 問題数: {result.total_issues}")
            return result
            
        except Exception as e:
            logger.error(f"文書校正エラー: {str(e)}")
            raise

    async def proofread_text(
        self,
        text: str,
        section_type: ApplicationSection,
        context: Dict[str, Any] = None,
        style_guide: Optional[StyleGuide] = None
    ) -> List[ProofreadingIssue]:
        """
        テキスト校正
        
        Args:
            text: 対象テキスト
            section_type: セクションタイプ
            context: コンテキスト情報
            style_guide: 文体ガイド
            
        Returns:
            List[ProofreadingIssue]: 検出された問題リスト
        """
        try:
            if style_guide is None:
                style_guide = self.default_style_guide
            
            issues = []
            
            # 基本校正チェック
            issues.extend(await self._check_grammar(text, section_type))
            issues.extend(await self._check_spelling(text, section_type))
            issues.extend(await self._check_style_consistency(text, style_guide))
            issues.extend(await self._check_terminology(text, style_guide))
            issues.extend(await self._check_tone(text, style_guide))
            issues.extend(await self._check_clarity(text, section_type))
            issues.extend(await self._check_redundancy(text))
            issues.extend(await self._check_formal_language(text, style_guide))
            
            # AIベース校正
            ai_issues = await self._ai_based_proofreading(text, section_type, context)
            issues.extend(ai_issues)
            
            return issues
            
        except Exception as e:
            logger.error(f"テキスト校正エラー: {str(e)}")
            return []

    async def improve_readability(
        self,
        text: str,
        target_audience: str = "general",
        complexity_level: str = "medium"
    ) -> Dict[str, Any]:
        """
        可読性向上
        
        Args:
            text: 対象テキスト
            target_audience: 対象読者層
            complexity_level: 複雑度レベル
            
        Returns:
            Dict: 改善結果
        """
        try:
            # 現在の可読性分析
            current_readability = await self._analyze_readability(text)
            
            # 改善提案生成
            improvement_suggestions = await self._generate_readability_improvements(
                text, target_audience, complexity_level, current_readability
            )
            
            # 改善版テキスト生成
            improved_text = await self._generate_improved_text(
                text, improvement_suggestions
            )
            
            # 改善後可読性評価
            improved_readability = await self._analyze_readability(improved_text)
            
            return {
                "original_text": text,
                "improved_text": improved_text,
                "original_readability": current_readability,
                "improved_readability": improved_readability,
                "improvements": improvement_suggestions,
                "improvement_score": improved_readability["score"] - current_readability["score"]
            }
            
        except Exception as e:
            logger.error(f"可読性向上エラー: {str(e)}")
            return {"error": str(e)}

    async def ensure_document_consistency(
        self,
        document: ApplicationDocument,
        consistency_rules: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        文書一貫性確保
        
        Args:
            document: 対象文書
            consistency_rules: 一貫性ルール
            
        Returns:
            Dict: 一貫性チェック結果
        """
        try:
            if consistency_rules is None:
                consistency_rules = self._get_default_consistency_rules()
            
            consistency_issues = []
            
            # 用語統一チェック
            terminology_issues = await self._check_terminology_consistency(document)
            consistency_issues.extend(terminology_issues)
            
            # 数値表記統一チェック
            numeric_issues = await self._check_numeric_consistency(document)
            consistency_issues.extend(numeric_issues)
            
            # 文体統一チェック
            style_issues = await self._check_style_consistency_across_sections(document)
            consistency_issues.extend(style_issues)
            
            # 構成一貫性チェック
            structure_issues = await self._check_structural_consistency(document)
            consistency_issues.extend(structure_issues)
            
            # 一貫性スコア計算
            consistency_score = await self._calculate_consistency_score(
                document, consistency_issues
            )
            
            return {
                "consistency_score": consistency_score,
                "total_issues": len(consistency_issues),
                "issues": consistency_issues,
                "recommendations": await self._generate_consistency_recommendations(
                    consistency_issues
                )
            }
            
        except Exception as e:
            logger.error(f"文書一貫性チェックエラー: {str(e)}")
            return {"error": str(e)}

    # 基本校正チェック関数

    async def _check_grammar(
        self,
        text: str,
        section_type: ApplicationSection
    ) -> List[ProofreadingIssue]:
        """文法チェック"""
        issues = []
        
        # ルールベース文法チェック
        for pattern, rule in self.grammar_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                issue = ProofreadingIssue(
                    issue_id=f"grammar_{match.start()}_{match.end()}",
                    issue_type=IssueType.GRAMMAR,
                    severity=rule["severity"],
                    location={
                        "start": match.start(),
                        "end": match.end(),
                        "section": section_type.value
                    },
                    original_text=match.group(0),
                    suggested_text=rule["suggestion"],
                    explanation=rule["explanation"],
                    auto_fixable=rule.get("auto_fixable", False)
                )
                issues.append(issue)
        
        # AIベース文法チェック
        ai_grammar_issues = await self._ai_grammar_check(text, section_type)
        issues.extend(ai_grammar_issues)
        
        return issues

    async def _check_spelling(
        self,
        text: str,
        section_type: ApplicationSection
    ) -> List[ProofreadingIssue]:
        """誤字脱字チェック"""
        issues = []
        
        # 辞書ベースチェック
        words = re.findall(r'\w+', text)
        for i, word in enumerate(words):
            if word in self.spelling_dictionary.get("common_mistakes", {}):
                correct_word = self.spelling_dictionary["common_mistakes"][word]
                
                # テキスト内の位置を特定
                pattern = rf'\b{re.escape(word)}\b'
                matches = list(re.finditer(pattern, text))
                
                for match in matches:
                    issue = ProofreadingIssue(
                        issue_id=f"spelling_{match.start()}_{match.end()}",
                        issue_type=IssueType.SPELLING,
                        severity=Severity.HIGH,
                        location={
                            "start": match.start(),
                            "end": match.end(),
                            "section": section_type.value
                        },
                        original_text=word,
                        suggested_text=correct_word,
                        explanation=f"「{word}」は「{correct_word}」の誤記の可能性があります",
                        auto_fixable=True
                    )
                    issues.append(issue)
        
        return issues

    async def _check_style_consistency(
        self,
        text: str,
        style_guide: StyleGuide
    ) -> List[ProofreadingIssue]:
        """文体一貫性チェック"""
        issues = []
        
        # 敬語レベルチェック
        if style_guide.honorific_level == "respectful":
            # 丁寧語不足をチェック
            casual_patterns = [r'する\.', r'だ\.', r'である\.']
            for pattern in casual_patterns:
                matches = re.finditer(pattern, text)
                for match in matches:
                    issue = ProofreadingIssue(
                        issue_id=f"style_{match.start()}_{match.end()}",
                        issue_type=IssueType.STYLE_INCONSISTENCY,
                        severity=Severity.MEDIUM,
                        location={
                            "start": match.start(),
                            "end": match.end()
                        },
                        original_text=match.group(0),
                        suggested_text=match.group(0).replace("する.", "いたします.").replace("だ.", "です.").replace("である.", "であります."),
                        explanation="敬語レベルを統一することを推奨します",
                        auto_fixable=True
                    )
                    issues.append(issue)
        
        # 禁止語句チェック
        for forbidden_word in style_guide.forbidden_words:
            pattern = rf'\b{re.escape(forbidden_word)}\b'
            matches = re.finditer(pattern, text)
            for match in matches:
                issue = ProofreadingIssue(
                    issue_id=f"forbidden_{match.start()}_{match.end()}",
                    issue_type=IssueType.STYLE_INCONSISTENCY,
                    severity=Severity.HIGH,
                    location={
                        "start": match.start(),
                        "end": match.end()
                    },
                    original_text=forbidden_word,
                    suggested_text="[より適切な表現に変更]",
                    explanation=f"「{forbidden_word}」は適切でない表現です",
                    auto_fixable=False
                )
                issues.append(issue)
        
        return issues

    async def _check_terminology(
        self,
        text: str,
        style_guide: StyleGuide
    ) -> List[ProofreadingIssue]:
        """用語統一チェック"""
        issues = []
        
        # 技術用語チェック
        for term, preferred_term in style_guide.technical_terms.items():
            if term in text and preferred_term not in text:
                pattern = rf'\b{re.escape(term)}\b'
                matches = re.finditer(pattern, text)
                for match in matches:
                    issue = ProofreadingIssue(
                        issue_id=f"terminology_{match.start()}_{match.end()}",
                        issue_type=IssueType.TERMINOLOGY,
                        severity=Severity.MEDIUM,
                        location={
                            "start": match.start(),
                            "end": match.end()
                        },
                        original_text=term,
                        suggested_text=preferred_term,
                        explanation=f"初出時は「{preferred_term}」と記載することを推奨します",
                        auto_fixable=True
                    )
                    issues.append(issue)
        
        # 表記ゆれチェック
        terminology_variations = await self._detect_terminology_variations(text)
        for variations in terminology_variations:
            if len(variations) > 1:
                # 最も頻出する表記を推奨
                most_common = max(variations, key=lambda x: x[1])
                for term, count in variations:
                    if term != most_common[0]:
                        pattern = rf'\b{re.escape(term)}\b'
                        matches = re.finditer(pattern, text)
                        for match in matches:
                            issue = ProofreadingIssue(
                                issue_id=f"variation_{match.start()}_{match.end()}",
                                issue_type=IssueType.TERMINOLOGY,
                                severity=Severity.LOW,
                                location={
                                    "start": match.start(),
                                    "end": match.end()
                                },
                                original_text=term,
                                suggested_text=most_common[0],
                                explanation=f"表記統一のため「{most_common[0]}」に統一することを推奨します",
                                auto_fixable=True
                            )
                            issues.append(issue)
        
        return issues

    async def _check_tone(
        self,
        text: str,
        style_guide: StyleGuide
    ) -> List[ProofreadingIssue]:
        """トーンチェック"""
        issues = []
        
        # フォーマルトーンの場合の口語表現チェック
        if style_guide.tone == "formal":
            informal_patterns = {
                r'ちょっと': 'やや',
                r'けっこう': 'かなり',
                r'すごく': '非常に',
                r'たくさん': '多数',
                r'いっぱい': '多数'
            }
            
            for pattern, suggestion in informal_patterns.items():
                matches = re.finditer(pattern, text)
                for match in matches:
                    issue = ProofreadingIssue(
                        issue_id=f"tone_{match.start()}_{match.end()}",
                        issue_type=IssueType.TONE,
                        severity=Severity.MEDIUM,
                        location={
                            "start": match.start(),
                            "end": match.end()
                        },
                        original_text=match.group(0),
                        suggested_text=suggestion,
                        explanation="よりフォーマルな表現を使用することを推奨します",
                        auto_fixable=True
                    )
                    issues.append(issue)
        
        return issues

    async def _check_clarity(
        self,
        text: str,
        section_type: ApplicationSection
    ) -> List[ProofreadingIssue]:
        """明瞭性チェック"""
        issues = []
        
        # 長すぎる文のチェック
        sentences = re.split(r'[。！？]', text)
        for i, sentence in enumerate(sentences):
            if len(sentence.strip()) > 100:  # 100文字以上
                issue = ProofreadingIssue(
                    issue_id=f"clarity_long_sentence_{i}",
                    issue_type=IssueType.CLARITY,
                    severity=Severity.LOW,
                    location={
                        "sentence_index": i,
                        "section": section_type.value
                    },
                    original_text=sentence.strip(),
                    suggested_text="[文を分割することを検討]",
                    explanation="文が長すぎるため、読みやすさのために分割を検討してください",
                    auto_fixable=False
                )
                issues.append(issue)
        
        # 受動態過多チェック
        passive_count = len(re.findall(r'れる|られる', text))
        total_sentences = len([s for s in sentences if s.strip()])
        
        if total_sentences > 0 and passive_count / total_sentences > 0.3:
            issue = ProofreadingIssue(
                issue_id="clarity_passive_voice",
                issue_type=IssueType.CLARITY,
                severity=Severity.SUGGESTION,
                location={"section": section_type.value},
                original_text="[文書全体]",
                suggested_text="[能動態への変更を検討]",
                explanation="受動態が多いため、能動態への変更で明瞭性を向上できます",
                auto_fixable=False
            )
            issues.append(issue)
        
        return issues

    async def _check_redundancy(self, text: str) -> List[ProofreadingIssue]:
        """冗長性チェック"""
        issues = []
        
        # 重複表現チェック
        redundant_patterns = {
            r'まず最初に': 'まず',
            r'一番最初': '最初',
            r'後で後から': '後で',
            r'将来的には': '将来は',
            r'現在のところ': '現在',
            r'今現在': '現在'
        }
        
        for pattern, suggestion in redundant_patterns.items():
            matches = re.finditer(pattern, text)
            for match in matches:
                issue = ProofreadingIssue(
                    issue_id=f"redundancy_{match.start()}_{match.end()}",
                    issue_type=IssueType.REDUNDANCY,
                    severity=Severity.LOW,
                    location={
                        "start": match.start(),
                        "end": match.end()
                    },
                    original_text=match.group(0),
                    suggested_text=suggestion,
                    explanation="冗長な表現を簡潔にすることを推奨します",
                    auto_fixable=True
                )
                issues.append(issue)
        
        return issues

    async def _check_formal_language(
        self,
        text: str,
        style_guide: StyleGuide
    ) -> List[ProofreadingIssue]:
        """敬語・丁寧語チェック"""
        issues = []
        
        if style_guide.honorific_level == "respectful":
            # 敬語表現の推奨
            improvements = {
                r'します': 'いたします',
                r'行います': '行わせていただきます',
                r'考えます': '考えております',
                r'思います': '考えております'
            }
            
            for pattern, suggestion in improvements.items():
                matches = re.finditer(pattern, text)
                for match in matches:
                    # 文脈に応じて判断（すでに敬語の場合は除外）
                    if not any(honor in text[max(0, match.start()-10):match.end()+10] 
                             for honor in ['いたし', 'させていただ', 'ております']):
                        issue = ProofreadingIssue(
                            issue_id=f"formal_{match.start()}_{match.end()}",
                            issue_type=IssueType.FORMAL_LANGUAGE,
                            severity=Severity.SUGGESTION,
                            location={
                                "start": match.start(),
                                "end": match.end()
                            },
                            original_text=match.group(0),
                            suggested_text=suggestion,
                            explanation="より丁寧な表現を使用することを推奨します",
                            auto_fixable=True
                        )
                        issues.append(issue)
        
        return issues

    # AI支援校正

    async def _ai_based_proofreading(
        self,
        text: str,
        section_type: ApplicationSection,
        context: Optional[Dict[str, Any]] = None
    ) -> List[ProofreadingIssue]:
        """AI支援校正"""
        try:
            # AI校正プロンプト構築
            proofreading_prompt = f"""
以下の{section_type.value}セクションの文章を校正してください。

【対象文章】
{text}

【校正観点】
1. 文法・語法の正確性
2. 表現の適切性
3. 論理的な流れ
4. ビジネス文書としての品質

【出力形式】
JSON形式で問題点を報告：
{{
    "issues": [
        {{
            "type": "grammar|style|clarity|content",
            "severity": "high|medium|low",
            "original": "問題のある箇所",
            "suggested": "修正案",
            "explanation": "問題の説明"
        }}
    ]
}}
            """
            
            ai_response = await self.ai_service.generate_text(
                prompt=proofreading_prompt,
                provider=AIProvider.ANTHROPIC,
                options={"temperature": 0.3}
            )
            
            if ai_response.success and ai_response.content:
                try:
                    ai_result = json.loads(ai_response.content)
                    issues = []
                    
                    for item in ai_result.get("issues", []):
                        # AIが検出した問題をProofreadingIssueに変換
                        issue_type = self._map_ai_issue_type(item.get("type", "grammar"))
                        severity = self._map_ai_severity(item.get("severity", "medium"))
                        
                        # 文章内の位置を特定
                        original_text = item.get("original", "")
                        if original_text and original_text in text:
                            start_pos = text.find(original_text)
                            end_pos = start_pos + len(original_text)
                            
                            issue = ProofreadingIssue(
                                issue_id=f"ai_{start_pos}_{end_pos}",
                                issue_type=issue_type,
                                severity=severity,
                                location={
                                    "start": start_pos,
                                    "end": end_pos,
                                    "section": section_type.value
                                },
                                original_text=original_text,
                                suggested_text=item.get("suggested", ""),
                                explanation=item.get("explanation", ""),
                                confidence=0.8,
                                auto_fixable=issue_type in [IssueType.GRAMMAR, IssueType.SPELLING]
                            )
                            issues.append(issue)
                    
                    return issues
                
                except json.JSONDecodeError:
                    logger.warning("AI校正結果のJSON解析に失敗")
                    return []
            
            return []
            
        except Exception as e:
            logger.error(f"AI校正エラー: {str(e)}")
            return []

    async def _ai_grammar_check(
        self,
        text: str,
        section_type: ApplicationSection
    ) -> List[ProofreadingIssue]:
        """AI文法チェック"""
        try:
            grammar_prompt = f"""
以下の文章の文法チェックを行い、問題がある箇所を指摘してください。

【文章】
{text}

【チェック項目】
- 助詞の誤用
- 語順の問題
- 修飾関係の曖昧性
- 呼応の不一致

JSON形式で結果を出力してください。
            """
            
            ai_response = await self.ai_service.generate_text(
                prompt=grammar_prompt,
                provider=AIProvider.ANTHROPIC,
                options={"temperature": 0.2}
            )
            
            # レスポンス処理とIssue変換
            # (省略 - 上記のai_based_proofreadingと同様の処理)
            
            return []
            
        except Exception as e:
            logger.error(f"AI文法チェックエラー: {str(e)}")
            return []

    # 修正適用

    async def _apply_auto_fixes(
        self,
        text: str,
        issues: List[ProofreadingIssue],
        style_guide: StyleGuide
    ) -> str:
        """自動修正適用"""
        try:
            fixed_text = text
            
            # 位置の逆順でソートして後ろから修正（位置ずれを防ぐ）
            auto_fixable_issues = [i for i in issues if i.auto_fixable]
            auto_fixable_issues.sort(key=lambda x: x.location.get("start", 0), reverse=True)
            
            for issue in auto_fixable_issues:
                start = issue.location.get("start", 0)
                end = issue.location.get("end", 0)
                
                if 0 <= start < end <= len(fixed_text):
                    # 修正適用
                    fixed_text = (
                        fixed_text[:start] + 
                        issue.suggested_text + 
                        fixed_text[end:]
                    )
            
            # 追加の一括修正
            fixed_text = await self._apply_style_guide_fixes(fixed_text, style_guide)
            
            return fixed_text
            
        except Exception as e:
            logger.error(f"自動修正適用エラー: {str(e)}")
            return text

    async def _apply_style_guide_fixes(
        self,
        text: str,
        style_guide: StyleGuide
    ) -> str:
        """文体ガイド修正適用"""
        fixed_text = text
        
        # 推奨表現への置換
        for old_expr, new_expr in style_guide.preferred_expressions.items():
            fixed_text = re.sub(rf'\b{re.escape(old_expr)}\b', new_expr, fixed_text)
        
        return fixed_text

    # 結果コンパイル

    async def _compile_proofreading_result(
        self,
        document_id: str,
        all_issues: List[ProofreadingIssue],
        improved_content: Dict[ApplicationSection, str],
        overall_quality: float,
        processing_time: float
    ) -> ProofreadingResult:
        """校正結果コンパイル"""
        
        # 重要度別集計
        issues_by_severity = defaultdict(int)
        for issue in all_issues:
            issues_by_severity[issue.severity] += 1
        
        # タイプ別集計
        issues_by_type = defaultdict(int) 
        for issue in all_issues:
            issues_by_type[issue.issue_type] += 1
        
        # 可読性スコア算出
        readability_score = await self._calculate_readability_score(improved_content)
        
        # 一貫性スコア算出
        consistency_score = await self._calculate_consistency_score_from_content(
            improved_content
        )
        
        # 改善提案生成
        suggestions = await self._generate_improvement_suggestions(all_issues)
        
        return ProofreadingResult(
            document_id=document_id,
            total_issues=len(all_issues),
            issues_by_severity=dict(issues_by_severity),
            issues_by_type=dict(issues_by_type),
            issues=all_issues,
            overall_quality_score=overall_quality,
            readability_score=readability_score,
            consistency_score=consistency_score,
            improved_content=improved_content,
            processing_time=processing_time,
            suggestions=suggestions,
            generated_at=datetime.now()
        )

    # ヘルパーメソッド

    def _initialize_grammar_patterns(self) -> Dict[str, Dict[str, Any]]:
        """文法パターン初期化"""
        return {
            r'(\w+)が(\w+)を(\w+)が': {
                "severity": Severity.HIGH,
                "suggestion": "主語の重複を修正してください",
                "explanation": "主語「が」が重複しています",
                "auto_fixable": False
            },
            r'ので、なので': {
                "severity": Severity.MEDIUM,
                "suggestion": "ので",
                "explanation": "「ので」の重複表現です",
                "auto_fixable": True
            },
            r'という事': {
                "severity": Severity.LOW,
                "suggestion": "ということ",
                "explanation": "「こと」は漢字ではなくひらがなが適切です",
                "auto_fixable": True
            }
        }

    def _load_spelling_dictionary(self) -> Dict[str, Dict[str, str]]:
        """誤字脱字辞書読み込み"""
        return {
            "common_mistakes": {
                "以外": "意外",  # 文脈による
                "制作": "製作",  # 文脈による
                "期待": "期待",
                "実績": "実績",
                "効果": "効果"
            }
        }

    def _load_terminology_map(self) -> Dict[str, str]:
        """用語マップ読み込み"""
        return {
            "AI": "人工知能（AI）",
            "IoT": "モノのインターネット（IoT）",
            "DX": "デジタルトランスフォーメーション（DX）"
        }

    def _map_ai_issue_type(self, ai_type: str) -> IssueType:
        """AI問題タイプマッピング"""
        mapping = {
            "grammar": IssueType.GRAMMAR,
            "style": IssueType.STYLE_INCONSISTENCY,
            "clarity": IssueType.CLARITY,
            "content": IssueType.COHERENCE
        }
        return mapping.get(ai_type, IssueType.GRAMMAR)

    def _map_ai_severity(self, ai_severity: str) -> Severity:
        """AI重要度マッピング"""
        mapping = {
            "high": Severity.HIGH,
            "medium": Severity.MEDIUM,
            "low": Severity.LOW
        }
        return mapping.get(ai_severity, Severity.MEDIUM)

    async def _detect_terminology_variations(self, text: str) -> List[List[Tuple[str, int]]]:
        """用語バリエーション検出"""
        # 簡易実装 - 実際はより高度な類似語検出を実装
        words = re.findall(r'\w+', text)
        word_counts = Counter(words)
        
        # 類似語グループ（例）
        similar_groups = [
            ["実施", "実行", "遂行"],
            ["効果", "効能", "成果"],
            ["検討", "検証", "確認"]
        ]
        
        variations = []
        for group in similar_groups:
            group_counts = [(word, word_counts.get(word, 0)) for word in group]
            group_counts = [(word, count) for word, count in group_counts if count > 0]
            if len(group_counts) > 1:
                variations.append(group_counts)
        
        return variations

    async def _calculate_readability_score(
        self,
        content: Dict[ApplicationSection, str]
    ) -> float:
        """可読性スコア計算"""
        try:
            total_score = 0
            section_count = 0
            
            for section, text in content.items():
                if text.strip():
                    section_score = await self._analyze_readability(text)
                    total_score += section_score.get("score", 70)
                    section_count += 1
            
            return total_score / section_count if section_count > 0 else 70.0
            
        except Exception as e:
            logger.error(f"可読性スコア計算エラー: {str(e)}")
            return 70.0

    async def _analyze_readability(self, text: str) -> Dict[str, Any]:
        """可読性分析"""
        try:
            # 基本統計
            sentences = len(re.split(r'[。！？]', text))
            words = len(re.findall(r'\w+', text))
            characters = len(text)
            
            # 平均文長
            avg_sentence_length = characters / sentences if sentences > 0 else 0
            
            # 難読語数（漢字3文字以上）
            difficult_words = len(re.findall(r'[\u4e00-\u9faf]{3,}', text))
            
            # 可読性スコア計算（簡易版）
            readability_score = 100
            
            # 文が長いほど減点
            if avg_sentence_length > 50:
                readability_score -= (avg_sentence_length - 50) * 0.5
            
            # 難読語が多いほど減点
            if words > 0:
                difficult_ratio = difficult_words / words
                readability_score -= difficult_ratio * 30
            
            readability_score = max(0, min(100, readability_score))
            
            return {
                "score": readability_score,
                "sentences": sentences,
                "words": words,
                "characters": characters,
                "avg_sentence_length": avg_sentence_length,
                "difficult_words": difficult_words
            }
            
        except Exception as e:
            logger.error(f"可読性分析エラー: {str(e)}")
            return {"score": 70, "error": str(e)}

    def _get_default_consistency_rules(self) -> Dict[str, Any]:
        """デフォルト一貫性ルール取得"""
        return {
            "terminology_consistency": True,
            "numeric_format_consistency": True,
            "style_consistency": True,
            "structure_consistency": True,
            "reference_consistency": True
        }

    async def _generate_improvement_suggestions(
        self,
        issues: List[ProofreadingIssue]
    ) -> List[str]:
        """改善提案生成"""
        suggestions = []
        
        # 重要度・頻度別提案
        critical_issues = [i for i in issues if i.severity == Severity.CRITICAL]
        if critical_issues:
            suggestions.append("致命的な問題があります。最優先で修正してください。")
        
        high_issues = [i for i in issues if i.severity == Severity.HIGH]
        if len(high_issues) > 5:
            suggestions.append("重要度の高い問題が多数あります。段階的に修正することを推奨します。")
        
        # タイプ別提案
        issue_types = Counter([i.issue_type for i in issues])
        
        if issue_types.get(IssueType.GRAMMAR, 0) > 3:
            suggestions.append("文法エラーが多いため、文章構造の見直しを推奨します。")
        
        if issue_types.get(IssueType.STYLE_INCONSISTENCY, 0) > 3:
            suggestions.append("文体の統一を図ることで、文書の品質が向上します。")
        
        if issue_types.get(IssueType.CLARITY, 0) > 3:
            suggestions.append("文章の明瞭性向上のため、簡潔な表現を心がけてください。")
        
        return suggestions[:5]  # 上位5件

    # 文書一貫性チェックメソッド

    async def _proofread_section(
        self,
        section: ApplicationSection,
        generated_section: GeneratedSection,
        style_guide: StyleGuide,
        focus_areas: Optional[List[IssueType]] = None
    ) -> List[ProofreadingIssue]:
        """セクション校正"""
        try:
            text = generated_section.content
            context = {
                "section_type": section,
                "quality_score": generated_section.quality_score,
                "word_count": generated_section.word_count
            }
            
            issues = await self.proofread_text(text, section, context, style_guide)
            
            # フォーカスエリアでフィルタリング
            if focus_areas:
                issues = [i for i in issues if i.issue_type in focus_areas]
            
            return issues
            
        except Exception as e:
            logger.error(f"セクション校正エラー: {str(e)}")
            return []

    async def _check_document_consistency(
        self,
        document: ApplicationDocument,
        style_guide: StyleGuide
    ) -> List[ProofreadingIssue]:
        """文書間一貫性チェック"""
        issues = []
        
        try:
            # セクション間の用語統一チェック
            terminology_issues = await self._check_terminology_consistency(document)
            issues.extend(terminology_issues)
            
            # 数値表記統一チェック
            numeric_issues = await self._check_numeric_consistency(document)
            issues.extend(numeric_issues)
            
            # 文体統一チェック
            style_issues = await self._check_style_consistency_across_sections(document)
            issues.extend(style_issues)
            
            return issues
            
        except Exception as e:
            logger.error(f"文書一貫性チェックエラー: {str(e)}")
            return []

    async def _check_terminology_consistency(
        self,
        document: ApplicationDocument
    ) -> List[ProofreadingIssue]:
        """用語一貫性チェック"""
        issues = []
        
        try:
            # 全セクションから用語を抽出
            all_terminology = {}
            
            for section, generated_section in document.sections.items():
                terms = re.findall(r'[\u4e00-\u9faf]{2,}', generated_section.content)
                for term in terms:
                    if term not in all_terminology:
                        all_terminology[term] = []
                    all_terminology[term].append(section)
            
            # 類似用語の検出と統一提案
            for term, sections in all_terminology.items():
                if len(sections) > 1:
                    # 同じ意味の異なる表記を検出（簡易版）
                    similar_terms = [t for t in all_terminology.keys() 
                                   if t != term and self._are_similar_terms(term, t)]
                    
                    if similar_terms:
                        # 最も使用頻度の高い表記を推奨
                        term_frequencies = {term: len(sections)}
                        for similar_term in similar_terms:
                            term_frequencies[similar_term] = len(all_terminology[similar_term])
                        
                        preferred_term = max(term_frequencies, key=term_frequencies.get)
                        
                        if term != preferred_term:
                            issue = ProofreadingIssue(
                                issue_id=f"terminology_consistency_{term}",
                                issue_type=IssueType.TERMINOLOGY,
                                severity=Severity.MEDIUM,
                                location={"sections": [s.value for s in sections]},
                                original_text=term,
                                suggested_text=preferred_term,
                                explanation=f"用語統一のため「{preferred_term}」に統一することを推奨します",
                                auto_fixable=True
                            )
                            issues.append(issue)
            
            return issues
            
        except Exception as e:
            logger.error(f"用語一貫性チェックエラー: {str(e)}")
            return []

    async def _check_numeric_consistency(
        self,
        document: ApplicationDocument
    ) -> List[ProofreadingIssue]:
        """数値表記一貫性チェック"""
        issues = []
        
        try:
            # 数値表記パターンを収集
            number_patterns = {
                "arabic": r'\d+',           # アラビア数字
                "kanji": r'[一二三四五六七八九十百千万億]+',  # 漢数字
                "percentage": r'\d+%',      # パーセンテージ
                "currency": r'\d+円'        # 通貨
            }
            
            pattern_usage = defaultdict(list)
            
            for section, generated_section in document.sections.items():
                text = generated_section.content
                
                for pattern_type, pattern in number_patterns.items():
                    matches = re.findall(pattern, text)
                    if matches:
                        pattern_usage[pattern_type].extend([(section, match) for match in matches])
            
            # 混在パターンをチェック
            for pattern_type, usage_list in pattern_usage.items():
                if len(usage_list) > 1:
                    # 同じタイプの数値表記が混在している場合の統一提案
                    sections_with_pattern = list(set([section for section, _ in usage_list]))
                    
                    if len(sections_with_pattern) > 1:
                        issue = ProofreadingIssue(
                            issue_id=f"numeric_consistency_{pattern_type}",
                            issue_type=IssueType.STYLE_INCONSISTENCY,
                            severity=Severity.LOW,
                            location={"sections": [s.value for s in sections_with_pattern]},
                            original_text=f"{pattern_type}表記",
                            suggested_text="統一した数値表記",
                            explanation=f"{pattern_type}の表記を文書全体で統一することを推奨します",
                            auto_fixable=False
                        )
                        issues.append(issue)
            
            return issues
            
        except Exception as e:
            logger.error(f"数値表記一貫性チェックエラー: {str(e)}")
            return []

    async def _check_style_consistency_across_sections(
        self,
        document: ApplicationDocument
    ) -> List[ProofreadingIssue]:
        """セクション間文体一貫性チェック"""
        issues = []
        
        try:
            # 各セクションの文体特徴を分析
            section_styles = {}
            
            for section, generated_section in document.sections.items():
                text = generated_section.content
                style_features = self._analyze_text_style(text)
                section_styles[section] = style_features
            
            # 文体の一貫性をチェック
            if len(section_styles) > 1:
                # 敬語レベルの一貫性
                honorific_levels = [features.get("honorific_level", 0) 
                                  for features in section_styles.values()]
                honorific_variance = max(honorific_levels) - min(honorific_levels)
                
                if honorific_variance > 2:  # 閾値
                    issue = ProofreadingIssue(
                        issue_id="style_consistency_honorific",
                        issue_type=IssueType.STYLE_INCONSISTENCY,
                        severity=Severity.MEDIUM,
                        location={"sections": [s.value for s in section_styles.keys()]},
                        original_text="敬語レベル",
                        suggested_text="統一された敬語レベル",
                        explanation="セクション間で敬語レベルを統一することを推奨します",
                        auto_fixable=False
                    )
                    issues.append(issue)
                
                # 文長の一貫性
                avg_sentence_lengths = [features.get("avg_sentence_length", 0) 
                                       for features in section_styles.values()]
                length_variance = max(avg_sentence_lengths) - min(avg_sentence_lengths)
                
                if length_variance > 30:  # 閾値
                    issue = ProofreadingIssue(
                        issue_id="style_consistency_sentence_length",
                        issue_type=IssueType.STYLE_INCONSISTENCY,
                        severity=Severity.LOW,
                        location={"sections": [s.value for s in section_styles.keys()]},
                        original_text="文長",
                        suggested_text="統一された文長",
                        explanation="セクション間で文長のバランスを統一することを推奨します",
                        auto_fixable=False
                    )
                    issues.append(issue)
            
            return issues
            
        except Exception as e:
            logger.error(f"セクション間文体一貫性チェックエラー: {str(e)}")
            return []

    async def _check_structural_consistency(
        self,
        document: ApplicationDocument
    ) -> List[ProofreadingIssue]:
        """構成一貫性チェック"""
        issues = []
        
        try:
            # セクション構成の一貫性をチェック
            required_sections = {
                ApplicationSection.COMPANY_OVERVIEW,
                ApplicationSection.PROJECT_SUMMARY,
                ApplicationSection.CURRENT_SITUATION,
                ApplicationSection.PROJECT_DESCRIPTION,
                ApplicationSection.EXPECTED_OUTCOMES
            }
            
            missing_sections = required_sections - set(document.sections.keys())
            
            if missing_sections:
                issue = ProofreadingIssue(
                    issue_id="structural_missing_sections",
                    issue_type=IssueType.COHERENCE,
                    severity=Severity.HIGH,
                    location={"missing_sections": [s.value for s in missing_sections]},
                    original_text="文書構成",
                    suggested_text="完全な文書構成",
                    explanation=f"必須セクションが不足しています: {', '.join([s.value for s in missing_sections])}",
                    auto_fixable=False
                )
                issues.append(issue)
            
            # セクション間の論理的つながりをチェック
            section_order = list(document.sections.keys())
            expected_order = [
                ApplicationSection.COMPANY_OVERVIEW,
                ApplicationSection.PROJECT_SUMMARY,
                ApplicationSection.CURRENT_SITUATION,
                ApplicationSection.PROJECT_DESCRIPTION,
                ApplicationSection.IMPLEMENTATION_PLAN,
                ApplicationSection.EXPECTED_OUTCOMES
            ]
            
            # 順序の問題をチェック（簡易版）
            actual_indices = []
            for section in section_order:
                if section in expected_order:
                    actual_indices.append(expected_order.index(section))
            
            if actual_indices != sorted(actual_indices):
                issue = ProofreadingIssue(
                    issue_id="structural_section_order",
                    issue_type=IssueType.COHERENCE,
                    severity=Severity.MEDIUM,
                    location={"section_order": [s.value for s in section_order]},
                    original_text="セクション順序",
                    suggested_text="推奨セクション順序",
                    explanation="セクションの順序を論理的な流れに沿って調整することを推奨します",
                    auto_fixable=False
                )
                issues.append(issue)
            
            return issues
            
        except Exception as e:
            logger.error(f"構成一貫性チェックエラー: {str(e)}")
            return []

    async def _evaluate_overall_quality(
        self,
        document: ApplicationDocument
    ) -> float:
        """文書全体品質評価"""
        try:
            quality_evaluator = self.quality_evaluator
            
            # 各セクションの品質スコア平均
            section_scores = [section.quality_score for section in document.sections.values()]
            avg_section_quality = sum(section_scores) / len(section_scores) if section_scores else 0
            
            # 文書全体の一貫性評価
            consistency_score = document.consistency_score if hasattr(document, 'consistency_score') else 75.0
            
            # 完成度評価
            completion_score = document.completion_rate if hasattr(document, 'completion_rate') else 80.0
            
            # 重み付き平均
            overall_score = (
                avg_section_quality * 0.5 +
                consistency_score * 0.3 +
                completion_score * 0.2
            )
            
            return min(100.0, max(0.0, overall_score))
            
        except Exception as e:
            logger.error(f"全体品質評価エラー: {str(e)}")
            return 70.0

    async def _calculate_consistency_score(
        self,
        document: ApplicationDocument,
        consistency_issues: List[ProofreadingIssue]
    ) -> float:
        """一貫性スコア計算"""
        try:
            base_score = 100.0
            
            # 問題の重要度に応じて減点
            for issue in consistency_issues:
                if issue.severity == Severity.CRITICAL:
                    base_score -= 15
                elif issue.severity == Severity.HIGH:
                    base_score -= 10
                elif issue.severity == Severity.MEDIUM:
                    base_score -= 5
                elif issue.severity == Severity.LOW:
                    base_score -= 2
            
            return max(0.0, base_score)
            
        except Exception as e:
            logger.error(f"一貫性スコア計算エラー: {str(e)}")
            return 70.0

    async def _calculate_consistency_score_from_content(
        self,
        content: Dict[ApplicationSection, str]
    ) -> float:
        """コンテンツから一貫性スコア計算"""
        try:
            if not content:
                return 70.0
            
            # 用語の一貫性
            all_terms = []
            for text in content.values():
                terms = re.findall(r'[\u4e00-\u9faf]{2,}', text)
                all_terms.extend(terms)
            
            unique_terms = set(all_terms)
            term_consistency = len(unique_terms) / len(all_terms) if all_terms else 1.0
            
            # 文体の一貫性
            style_scores = []
            for text in content.values():
                style_features = self._analyze_text_style(text)
                style_scores.append(style_features.get("consistency_score", 70))
            
            avg_style_consistency = sum(style_scores) / len(style_scores) if style_scores else 70
            
            # 総合一貫性スコア
            consistency_score = (term_consistency * 100 * 0.4 + avg_style_consistency * 0.6)
            
            return min(100.0, max(0.0, consistency_score))
            
        except Exception as e:
            logger.error(f"コンテンツ一貫性スコア計算エラー: {str(e)}")
            return 70.0

    async def _generate_consistency_recommendations(
        self,
        consistency_issues: List[ProofreadingIssue]
    ) -> List[str]:
        """一貫性改善推奨事項生成"""
        recommendations = []
        
        # 問題タイプ別の推奨事項
        issue_types = Counter([issue.issue_type for issue in consistency_issues])
        
        if issue_types.get(IssueType.TERMINOLOGY, 0) > 0:
            recommendations.append("用語集を作成し、文書全体で用語を統一してください")
        
        if issue_types.get(IssueType.STYLE_INCONSISTENCY, 0) > 0:
            recommendations.append("文体ガイドラインを作成し、一貫した文体を維持してください")
        
        if issue_types.get(IssueType.COHERENCE, 0) > 0:
            recommendations.append("セクション間の論理的つながりを強化してください")
        
        return recommendations

    async def _generate_readability_improvements(
        self,
        text: str,
        target_audience: str,
        complexity_level: str,
        current_readability: Dict[str, Any]
    ) -> List[str]:
        """可読性改善提案生成"""
        improvements = []
        
        current_score = current_readability.get("score", 70)
        avg_sentence_length = current_readability.get("avg_sentence_length", 30)
        
        if current_score < 70:
            improvements.append("全体的な可読性の向上が必要です")
        
        if avg_sentence_length > 50:
            improvements.append("文を短く分割して読みやすくしてください")
        
        if target_audience == "general" and complexity_level == "high":
            improvements.append("専門用語の説明を追加してください")
        
        return improvements

    async def _generate_improved_text(
        self,
        text: str,
        improvements: List[str]
    ) -> str:
        """改善版テキスト生成"""
        try:
            improvement_prompt = f"""
以下の文章を改善してください。

【元の文章】
{text}

【改善要求】
{chr(10).join(f"- {imp}" for imp in improvements)}

【出力】
改善された文章のみを出力してください。
            """
            
            ai_response = await self.ai_service.generate_text(
                prompt=improvement_prompt,
                provider=AIProvider.ANTHROPIC,
                options={"temperature": 0.3}
            )
            
            if ai_response.success and ai_response.content:
                return ai_response.content.strip()
            else:
                return text
                
        except Exception as e:
            logger.error(f"改善版テキスト生成エラー: {str(e)}")
            return text

    def _are_similar_terms(self, term1: str, term2: str) -> bool:
        """類似用語判定"""
        # 簡易的な類似度判定
        if len(term1) != len(term2):
            return False
        
        # 文字レベルの類似度
        common_chars = sum(1 for c1, c2 in zip(term1, term2) if c1 == c2)
        similarity = common_chars / len(term1)
        
        return similarity > 0.7

    def _analyze_text_style(self, text: str) -> Dict[str, Any]:
        """テキスト文体分析"""
        try:
            # 基本統計
            sentences = re.split(r'[。！？]', text)
            sentences = [s.strip() for s in sentences if s.strip()]
            
            # 平均文長
            avg_sentence_length = sum(len(s) for s in sentences) / len(sentences) if sentences else 0
            
            # 敬語レベル分析
            honorific_patterns = [r'です', r'ます', r'いたし', r'ござい']
            honorific_count = sum(len(re.findall(pattern, text)) for pattern in honorific_patterns)
            honorific_level = min(5, honorific_count / len(sentences)) if sentences else 0
            
            # 受動態使用率
            passive_count = len(re.findall(r'れる|られる', text))
            passive_ratio = passive_count / len(sentences) if sentences else 0
            
            # 一貫性スコア（簡易計算）
            consistency_score = 100 - (abs(avg_sentence_length - 40) * 0.5)
            consistency_score = max(0, min(100, consistency_score))
            
            return {
                "avg_sentence_length": avg_sentence_length,
                "honorific_level": honorific_level,
                "passive_ratio": passive_ratio,
                "consistency_score": consistency_score,
                "sentence_count": len(sentences)
            }
            
        except Exception as e:
            logger.error(f"文体分析エラー: {str(e)}")
            return {
                "avg_sentence_length": 30,
                "honorific_level": 2,
                "passive_ratio": 0.2,
                "consistency_score": 70,
                "sentence_count": 1
            }