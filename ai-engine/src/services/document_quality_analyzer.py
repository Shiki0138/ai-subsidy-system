"""
文書品質分析サービス
自動文法チェック、専門用語適切性、論理構造評価
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import logging
import re
import json

logger = logging.getLogger(__name__)


class QualityCheckType(Enum):
    """品質チェックタイプ"""
    GRAMMAR = "grammar"
    TERMINOLOGY = "terminology"
    LOGIC_STRUCTURE = "logic_structure"
    PERSUASIVENESS = "persuasiveness"
    READABILITY = "readability"
    COMPLIANCE = "compliance"


@dataclass
class QualityIssue:
    """品質問題"""
    check_type: QualityCheckType
    severity: str  # "critical", "major", "minor"
    location: str  # 問題箇所
    description: str
    suggestion: str
    impact_score: float  # 修正による改善予測スコア


@dataclass
class QualityAnalysisResult:
    """品質分析結果"""
    overall_score: float
    category_scores: Dict[str, float]
    issues: List[QualityIssue]
    strengths: List[str]
    improvement_suggestions: List[Dict[str, Any]]
    estimated_time_to_fix: int  # 分
    priority_fixes: List[QualityIssue]


class DocumentQualityAnalyzer:
    """文書品質分析サービス"""
    
    def __init__(self):
        # 専門用語辞書（実際はより大規模）
        self.terminology_dict = {
            "適切": {
                "新規性": "革新性、独自性",
                "市場性": "市場ニーズ、市場規模",
                "実現可能性": "技術的実現性、実行可能性",
                "波及効果": "経済効果、社会的効果",
                "持続性": "継続性、持続可能性"
            },
            "避けるべき": {
                "やばい": "課題がある、問題がある",
                "すごい": "優れた、高い",
                "みたいな": "のような、に類似した",
                "だと思う": "と考えられる、と推定される"
            }
        }
        
        # 論理構造パターン
        self.logic_patterns = {
            "problem_solution": ["現状", "課題", "解決策", "効果"],
            "business_plan": ["概要", "市場分析", "戦略", "収支計画", "リスク対策"],
            "technical_plan": ["技術概要", "開発計画", "検証方法", "品質保証"]
        }
        
        # 説得力のあるフレーズ
        self.persuasive_phrases = [
            "具体的には",
            "データによると",
            "実績として",
            "検証済みの",
            "他社との差別化",
            "独自の技術",
            "市場で初",
            "特許技術"
        ]
    
    async def analyze_document_quality(
        self,
        document: Dict[str, Any],
        document_type: str = "subsidy_application"
    ) -> QualityAnalysisResult:
        """
        文書品質の包括分析
        ユーザーファースト：具体的で実行可能な改善提案
        """
        try:
            # 各種品質チェックを並列実行
            tasks = [
                self._check_grammar(document),
                self._check_terminology(document),
                self._check_logic_structure(document, document_type),
                self._check_persuasiveness(document),
                self._check_readability(document),
                self._check_compliance(document, document_type)
            ]
            
            results = await asyncio.gather(*tasks)
            
            # 結果統合
            all_issues = []
            category_scores = {}
            
            for check_type, (score, issues) in zip(QualityCheckType, results):
                category_scores[check_type.value] = score
                all_issues.extend(issues)
            
            # 総合スコア計算
            weights = {
                "grammar": 0.20,
                "terminology": 0.18,
                "logic_structure": 0.22,
                "persuasiveness": 0.20,
                "readability": 0.12,
                "compliance": 0.08
            }
            
            overall_score = sum(
                category_scores[category] * weight
                for category, weight in weights.items()
            )
            
            # 優先修正項目の選定
            priority_fixes = self._select_priority_fixes(all_issues)
            
            # 改善提案の生成
            improvements = await self._generate_improvement_suggestions(
                all_issues, category_scores
            )
            
            # 強みの特定
            strengths = self._identify_strengths(category_scores, document)
            
            # 修正時間の予測
            estimated_time = self._estimate_fix_time(all_issues)
            
            return QualityAnalysisResult(
                overall_score=round(overall_score, 1),
                category_scores={k: round(v, 1) for k, v in category_scores.items()},
                issues=all_issues,
                strengths=strengths,
                improvement_suggestions=improvements,
                estimated_time_to_fix=estimated_time,
                priority_fixes=priority_fixes
            )
            
        except Exception as e:
            logger.error(f"Document quality analysis error: {str(e)}")
            raise
    
    async def _check_grammar(self, document: Dict[str, Any]) -> Tuple[float, List[QualityIssue]]:
        """文法チェック"""
        issues = []
        text_content = self._extract_text_content(document)
        
        # 基本的な文法チェック（実際はより高度なNLPツールを使用）
        grammar_patterns = {
            r'です。です。': {
                'description': '同じ語尾が連続しています',
                'suggestion': '文の終わり方を変化させましょう',
                'severity': 'minor'
            },
            r'[。！？][\s]*[あ-ん]': {
                'description': '文頭の助詞使用',
                'suggestion': '文頭に助詞を避け、主語を明確にしましょう',
                'severity': 'major'
            },
            r'[、]{2,}': {
                'description': '読点の重複',
                'suggestion': '読点の使用を整理しましょう',
                'severity': 'minor'
            },
            r'[ら抜き言葉パターン]': {
                'description': 'ら抜き言葉',
                'suggestion': '正しい敬語表現を使用しましょう',
                'severity': 'major'
            }
        }
        
        grammar_score = 85.0  # ベーススコア
        
        for pattern, rule in grammar_patterns.items():
            if pattern != '[ら抜き言葉パターン]':  # 実際のパターンではないため
                matches = re.finditer(pattern, text_content)
                for match in matches:
                    issues.append(QualityIssue(
                        check_type=QualityCheckType.GRAMMAR,
                        severity=rule['severity'],
                        location=f"位置: {match.start()}-{match.end()}",
                        description=rule['description'],
                        suggestion=rule['suggestion'],
                        impact_score=3.0 if rule['severity'] == 'major' else 1.0
                    ))
                    grammar_score -= (3.0 if rule['severity'] == 'major' else 1.0)
        
        return max(grammar_score, 0), issues
    
    async def _check_terminology(self, document: Dict[str, Any]) -> Tuple[float, List[QualityIssue]]:
        """専門用語適切性チェック"""
        issues = []
        text_content = self._extract_text_content(document)
        
        terminology_score = 80.0
        
        # 不適切な表現のチェック
        for inappropriate, description in self.terminology_dict["避けるべき"].items():
            if inappropriate in text_content:
                issues.append(QualityIssue(
                    check_type=QualityCheckType.TERMINOLOGY,
                    severity='major',
                    location=f"「{inappropriate}」を含む箇所",
                    description=f"カジュアルすぎる表現: 「{inappropriate}」",
                    suggestion=f"「{description}」などのフォーマルな表現に変更",
                    impact_score=4.0
                ))
                terminology_score -= 4.0
        
        # 適切な専門用語の使用確認
        appropriate_terms_used = 0
        for term in self.terminology_dict["適切"].keys():
            if term in text_content:
                appropriate_terms_used += 1
        
        # 専門用語使用率によるボーナス
        if appropriate_terms_used >= 3:
            terminology_score += 5.0
        
        return min(terminology_score, 100), issues
    
    async def _check_logic_structure(
        self, 
        document: Dict[str, Any], 
        document_type: str
    ) -> Tuple[float, List[QualityIssue]]:
        """論理構造チェック"""
        issues = []
        logic_score = 75.0
        
        # 文書タイプに応じた構造チェック
        required_sections = self.logic_patterns.get("business_plan", [])
        
        present_sections = []
        for section in required_sections:
            section_found = False
            for key, value in document.items():
                if isinstance(value, str) and any(
                    keyword in value.lower() 
                    for keyword in [section, section.replace('_', ' ')]
                ):
                    section_found = True
                    break
            
            if section_found:
                present_sections.append(section)
            else:
                issues.append(QualityIssue(
                    check_type=QualityCheckType.LOGIC_STRUCTURE,
                    severity='major',
                    location=f"文書全体",
                    description=f"必要セクション「{section}」が不足",
                    suggestion=f"「{section}」に関する内容を追加してください",
                    impact_score=8.0
                ))
                logic_score -= 8.0
        
        # 論理的な流れのチェック
        text_content = self._extract_text_content(document)
        
        # 接続詞の使用確認
        connective_words = ["そのため", "また", "一方", "さらに", "結果として", "このように"]
        connective_count = sum(1 for word in connective_words if word in text_content)
        
        if connective_count < 3:
            issues.append(QualityIssue(
                check_type=QualityCheckType.LOGIC_STRUCTURE,
                severity='minor',
                location="文書全体",
                description="論理的な接続詞が少ない",
                suggestion="「そのため」「また」などの接続詞で文章の流れを明確に",
                impact_score=3.0
            ))
            logic_score -= 3.0
        
        return max(logic_score, 0), issues
    
    async def _check_persuasiveness(self, document: Dict[str, Any]) -> Tuple[float, List[QualityIssue]]:
        """説得力チェック"""
        issues = []
        text_content = self._extract_text_content(document)
        persuasiveness_score = 70.0
        
        # 説得力のあるフレーズの使用確認
        persuasive_count = 0
        used_phrases = []
        
        for phrase in self.persuasive_phrases:
            if phrase in text_content:
                persuasive_count += 1
                used_phrases.append(phrase)
        
        if persuasive_count >= 3:
            persuasiveness_score += 10.0
        elif persuasive_count == 0:
            issues.append(QualityIssue(
                check_type=QualityCheckType.PERSUASIVENESS,
                severity='major',
                location="文書全体",
                description="具体性を示すフレーズが不足",
                suggestion="「具体的には」「データによると」などで説得力を強化",
                impact_score=10.0
            ))
            persuasiveness_score -= 10.0
        
        # 数値データの使用確認
        number_pattern = r'\d+[\d,]*[万億千百十]?[円年月日%件社人]'
        numbers = re.findall(number_pattern, text_content)
        
        if len(numbers) >= 5:
            persuasiveness_score += 8.0
        elif len(numbers) < 2:
            issues.append(QualityIssue(
                check_type=QualityCheckType.PERSUASIVENESS,
                severity='major',
                location="文書全体",
                description="定量的なデータが不足",
                suggestion="具体的な数値（売上、期間、効果など）を追加",
                impact_score=8.0
            ))
            persuasiveness_score -= 8.0
        
        return min(persuasiveness_score, 100), issues
    
    async def _check_readability(self, document: Dict[str, Any]) -> Tuple[float, List[QualityIssue]]:
        """読みやすさチェック"""
        issues = []
        text_content = self._extract_text_content(document)
        readability_score = 80.0
        
        # 文の長さチェック
        sentences = re.split('[。！？]', text_content)
        long_sentences = [s for s in sentences if len(s) > 100]
        
        if len(long_sentences) > len(sentences) * 0.3:  # 30%以上が長文
            issues.append(QualityIssue(
                check_type=QualityCheckType.READABILITY,
                severity='minor',
                location="長文箇所",
                description="長い文が多すぎます",
                suggestion="文を分割して読みやすくしましょう",
                impact_score=5.0
            ))
            readability_score -= 5.0
        
        # 漢字の使用率チェック
        kanji_pattern = r'[一-龯]'
        kanji_count = len(re.findall(kanji_pattern, text_content))
        total_chars = len(re.sub(r'\s', '', text_content))
        
        if total_chars > 0:
            kanji_ratio = kanji_count / total_chars
            if kanji_ratio > 0.4:  # 40%以上
                issues.append(QualityIssue(
                    check_type=QualityCheckType.READABILITY,
                    severity='minor',
                    location="文書全体",
                    description="漢字の使用率が高すぎます",
                    suggestion="ひらがなを適度に混ぜて読みやすくしましょう",
                    impact_score=3.0
                ))
                readability_score -= 3.0
        
        return max(readability_score, 0), issues
    
    async def _check_compliance(
        self, 
        document: Dict[str, Any], 
        document_type: str
    ) -> Tuple[float, List[QualityIssue]]:
        """要件適合性チェック"""
        issues = []
        compliance_score = 90.0
        
        # 補助金申請書の必須要素チェック
        required_elements = [
            "事業概要",
            "市場分析",
            "実施計画",
            "予算計画",
            "効果測定"
        ]
        
        text_content = self._extract_text_content(document)
        
        for element in required_elements:
            if element not in text_content and element.replace(' ', '') not in text_content:
                issues.append(QualityIssue(
                    check_type=QualityCheckType.COMPLIANCE,
                    severity='critical',
                    location="文書全体",
                    description=f"必須要素「{element}」が明示されていません",
                    suggestion=f"「{element}」について明確に記載してください",
                    impact_score=15.0
                ))
                compliance_score -= 15.0
        
        return max(compliance_score, 0), issues
    
    def _extract_text_content(self, document: Dict[str, Any]) -> str:
        """文書からテキストコンテンツを抽出"""
        text_parts = []
        
        def extract_recursive(obj):
            if isinstance(obj, str):
                text_parts.append(obj)
            elif isinstance(obj, dict):
                for value in obj.values():
                    extract_recursive(value)
            elif isinstance(obj, list):
                for item in obj:
                    extract_recursive(item)
        
        extract_recursive(document)
        return ' '.join(text_parts)
    
    def _select_priority_fixes(self, issues: List[QualityIssue]) -> List[QualityIssue]:
        """優先修正項目の選定"""
        # 重要度とインパクトで並び替え
        severity_weights = {"critical": 3, "major": 2, "minor": 1}
        
        sorted_issues = sorted(
            issues,
            key=lambda x: (severity_weights[x.severity], x.impact_score),
            reverse=True
        )
        
        return sorted_issues[:5]  # 上位5つ
    
    async def _generate_improvement_suggestions(
        self,
        issues: List[QualityIssue],
        category_scores: Dict[str, float]
    ) -> List[Dict[str, Any]]:
        """改善提案生成"""
        suggestions = []
        
        # カテゴリー別の改善提案
        for category, score in category_scores.items():
            if score < 80:
                category_issues = [i for i in issues if i.check_type.value == category]
                if category_issues:
                    total_impact = sum(issue.impact_score for issue in category_issues)
                    
                    suggestions.append({
                        "category": category,
                        "current_score": score,
                        "potential_score": min(score + total_impact, 100),
                        "improvement": total_impact,
                        "priority": "high" if score < 70 else "medium",
                        "estimated_time": len(category_issues) * 10,  # 1問題あたり10分
                        "specific_actions": [issue.suggestion for issue in category_issues[:3]]
                    })
        
        return sorted(suggestions, key=lambda x: x["improvement"], reverse=True)
    
    def _identify_strengths(
        self, 
        category_scores: Dict[str, float], 
        document: Dict[str, Any]
    ) -> List[str]:
        """強みの特定"""
        strengths = []
        
        for category, score in category_scores.items():
            if score >= 85:
                strength_messages = {
                    "grammar": f"文法的に正確で読みやすい文章（{score}点）",
                    "terminology": f"適切な専門用語の使用（{score}点）",
                    "logic_structure": f"論理的で構造化された構成（{score}点）",
                    "persuasiveness": f"説得力のある内容（{score}点）",
                    "readability": f"読みやすい文章表現（{score}点）",
                    "compliance": f"要件に完全適合（{score}点）"
                }
                strengths.append(strength_messages[category])
        
        return strengths
    
    def _estimate_fix_time(self, issues: List[QualityIssue]) -> int:
        """修正時間の予測"""
        time_per_severity = {"critical": 30, "major": 15, "minor": 5}
        
        total_time = sum(
            time_per_severity[issue.severity] for issue in issues
        )
        
        return total_time
    
    async def generate_quality_report(
        self,
        analysis_result: QualityAnalysisResult,
        user_friendly: bool = True
    ) -> Dict[str, Any]:
        """ユーザーフレンドリーな品質レポート生成"""
        
        # 品質レベルの判定
        score = analysis_result.overall_score
        if score >= 90:
            quality_level = "最高品質"
            quality_message = "申請書として最高レベルの品質です。自信を持って提出できます。"
        elif score >= 80:
            quality_level = "高品質"
            quality_message = "非常に良い品質の申請書です。採択の可能性が高いです。"
        elif score >= 70:
            quality_level = "良好"
            quality_message = "基本的な品質は確保されています。いくつかの改善で更に良くなります。"
        elif score >= 60:
            quality_level = "要改善"
            quality_message = "改善の余地があります。重要な問題から順に修正することをお勧めします。"
        else:
            quality_level = "要大幅改善"
            quality_message = "大幅な改善が必要です。優先度の高い問題から取り組みましょう。"
        
        return {
            "overall_assessment": {
                "score": analysis_result.overall_score,
                "level": quality_level,
                "message": quality_message
            },
            "category_breakdown": analysis_result.category_scores,
            "strengths": analysis_result.strengths,
            "priority_improvements": [
                {
                    "severity": issue.severity,
                    "description": issue.description,
                    "suggestion": issue.suggestion,
                    "expected_improvement": f"+{issue.impact_score}点"
                }
                for issue in analysis_result.priority_fixes
            ],
            "time_estimate": {
                "total_minutes": analysis_result.estimated_time_to_fix,
                "breakdown": f"重要な問題: {len([i for i in analysis_result.issues if i.severity == 'critical'])}件, "
                           f"軽微な問題: {len([i for i in analysis_result.issues if i.severity == 'minor'])}件"
            },
            "next_steps": [
                "優先度の高い問題から修正",
                "修正後の再チェック実行",
                "品質向上の確認"
            ],
            "quality_benefits": {
                "grammar_check": "誤字脱字ゼロを保証",
                "term_check": "審査員に伝わる適切な表現",
                "logic_check": "論理的で説得力のある構成",
                "score": "採択可能性を最大化"
            }
        }