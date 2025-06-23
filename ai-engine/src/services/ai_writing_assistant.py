"""
AI文章作成アシスタント
リアルタイム改善提案とインテリジェント文章生成
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import asyncio
import logging
import re

logger = logging.getLogger(__name__)


class WritingAssistanceType(Enum):
    """文章支援タイプ"""
    GRAMMAR_FIX = "grammar_fix"
    STYLE_IMPROVE = "style_improve"
    CONTENT_EXPAND = "content_expand"
    LOGIC_STRUCTURE = "logic_structure"
    PERSUASIVENESS = "persuasiveness"
    TECHNICAL_ACCURACY = "technical_accuracy"


@dataclass
class WritingSuggestion:
    """文章改善提案"""
    suggestion_type: WritingAssistanceType
    original_text: str
    improved_text: str
    explanation: str
    confidence: float  # 0.0-1.0
    impact_level: str  # "high", "medium", "low"


@dataclass
class RealTimeFeedback:
    """リアルタイムフィードバック"""
    current_score: float
    suggestions: List[WritingSuggestion]
    writing_tips: List[str]
    next_focus_areas: List[str]


class AIWritingAssistant:
    """AI文章作成アシスタント"""
    
    def __init__(self):
        # 文章パターンライブラリ
        self.writing_patterns = {
            "introduction": [
                "本事業では、{目的}を実現するため、{手段}を実施いたします。",
                "{課題}を解決するために、弊社は{解決策}を提案いたします。",
                "市場の{ニーズ}に応えるべく、{新規性}を特徴とする{事業内容}を展開します。"
            ],
            "market_analysis": [
                "対象市場は{市場規模}の規模を持ち、年平均{成長率}%の成長が見込まれています。",
                "主要顧客層である{顧客層}のニーズは{ニーズ内容}であり、当社の{強み}が競争優位性となります。",
                "競合他社との差別化ポイントは{差別化要因}であり、{具体的な優位性}を実現できます。"
            ],
            "technical_explanation": [
                "本技術の特徴は{技術特徴}であり、従来技術と比較して{改善点}を実現します。",
                "開発アプローチとして{開発手法}を採用し、{期間}での実用化を目指します。",
                "品質保証については{品質管理手法}により、{品質基準}を満たす製品を提供します。"
            ]
        }
        
        # 改善フレーズライブラリ
        self.improvement_phrases = {
            "強調": ["特に", "重要なことは", "注目すべきは", "最も重要な点は"],
            "根拠": ["データによると", "調査結果から", "実績として", "検証により"],
            "効果": ["その結果", "これにより", "効果として", "成果として"],
            "将来性": ["今後", "将来的には", "長期的には", "発展的には"]
        }
    
    async def provide_realtime_feedback(
        self,
        current_text: str,
        document_section: str,
        user_context: Dict[str, Any] = None
    ) -> RealTimeFeedback:
        """
        リアルタイムフィードバック提供
        ユーザーファースト：書きながら改善できる支援
        """
        try:
            # 現在のテキストを分析
            current_score = await self._calculate_writing_score(current_text)
            
            # 改善提案を生成
            suggestions = await self._generate_writing_suggestions(
                current_text, document_section
            )
            
            # 文章作成のヒント
            writing_tips = self._get_contextual_tips(
                current_text, document_section, user_context
            )
            
            # 次の重点領域
            next_focus_areas = self._identify_next_focus_areas(
                current_text, suggestions
            )
            
            return RealTimeFeedback(
                current_score=current_score,
                suggestions=suggestions,
                writing_tips=writing_tips,
                next_focus_areas=next_focus_areas
            )
            
        except Exception as e:
            logger.error(f"Real-time feedback error: {str(e)}")
            return self._get_fallback_feedback()
    
    async def generate_section_content(
        self,
        section_type: str,
        context_data: Dict[str, Any],
        quality_target: float = 80.0
    ) -> Dict[str, Any]:
        """
        セクション別コンテンツ生成
        ユーザーの入力を基に高品質な文章を自動生成
        """
        try:
            # セクションタイプ別のテンプレート選択
            templates = self.writing_patterns.get(section_type, [])
            
            if not templates:
                return await self._generate_generic_content(context_data)
            
            # コンテキストデータから最適テンプレートを選択
            best_template = self._select_best_template(templates, context_data)
            
            # テンプレートにデータを適用
            generated_content = self._apply_template(best_template, context_data)
            
            # 品質向上のための追加処理
            enhanced_content = await self._enhance_content_quality(
                generated_content, quality_target
            )
            
            # 品質チェック
            quality_score = await self._calculate_writing_score(enhanced_content)
            
            return {
                "content": enhanced_content,
                "quality_score": quality_score,
                "template_used": best_template,
                "enhancement_applied": quality_score >= quality_target,
                "suggestions": await self._generate_writing_suggestions(
                    enhanced_content, section_type
                ) if quality_score < quality_target else []
            }
            
        except Exception as e:
            logger.error(f"Content generation error: {str(e)}")
            return {"content": "", "quality_score": 0, "error": str(e)}
    
    async def improve_existing_text(
        self,
        original_text: str,
        improvement_focus: List[str] = None
    ) -> Dict[str, Any]:
        """
        既存テキストの改善
        具体的で実行しやすい改善提案
        """
        try:
            if improvement_focus is None:
                improvement_focus = ["grammar", "clarity", "persuasiveness"]
            
            improvements = {}
            
            for focus in improvement_focus:
                if focus == "grammar":
                    improvements["grammar"] = await self._improve_grammar(original_text)
                elif focus == "clarity":
                    improvements["clarity"] = await self._improve_clarity(original_text)
                elif focus == "persuasiveness":
                    improvements["persuasiveness"] = await self._improve_persuasiveness(original_text)
                elif focus == "structure":
                    improvements["structure"] = await self._improve_structure(original_text)
            
            # 最終的な改善版を生成
            final_improved = await self._combine_improvements(original_text, improvements)
            
            # 改善効果の測定
            original_score = await self._calculate_writing_score(original_text)
            improved_score = await self._calculate_writing_score(final_improved)
            
            return {
                "original_text": original_text,
                "improved_text": final_improved,
                "original_score": original_score,
                "improved_score": improved_score,
                "improvement_delta": improved_score - original_score,
                "specific_improvements": improvements,
                "change_summary": self._generate_change_summary(improvements)
            }
            
        except Exception as e:
            logger.error(f"Text improvement error: {str(e)}")
            return {"error": str(e)}
    
    async def _calculate_writing_score(self, text: str) -> float:
        """文章スコア計算"""
        if not text.strip():
            return 0.0
        
        scores = []
        
        # 1. 文章の長さ（適切な長さかどうか）
        length_score = min(len(text) / 500 * 20, 20)  # 500文字で20点満点
        scores.append(length_score)
        
        # 2. 文法的正確性（簡易版）
        grammar_score = 20  # ベーススコア
        # 基本的な文法エラーをチェック
        if re.search(r'です。です。', text):
            grammar_score -= 5
        if re.search(r'[、]{2,}', text):
            grammar_score -= 3
        scores.append(max(grammar_score, 0))
        
        # 3. 専門性（専門用語の使用）
        professional_terms = ["実現", "効果", "向上", "開発", "導入", "活用", "対策"]
        term_count = sum(1 for term in professional_terms if term in text)
        professional_score = min(term_count * 3, 20)
        scores.append(professional_score)
        
        # 4. 説得力（数値や具体例の使用）
        numbers = re.findall(r'\d+', text)
        concrete_phrases = ["具体的", "実際に", "例えば", "データ", "実績"]
        concrete_count = sum(1 for phrase in concrete_phrases if phrase in text)
        
        persuasiveness_score = min((len(numbers) + concrete_count) * 2, 20)
        scores.append(persuasiveness_score)
        
        # 5. 読みやすさ
        sentences = re.split('[。！？]', text)
        avg_sentence_length = sum(len(s) for s in sentences) / max(len(sentences), 1)
        readability_score = 20 - max(0, (avg_sentence_length - 50) * 0.2)
        scores.append(max(readability_score, 0))
        
        return sum(scores)
    
    async def _generate_writing_suggestions(
        self,
        text: str,
        section_type: str
    ) -> List[WritingSuggestion]:
        """文章改善提案生成"""
        suggestions = []
        
        # 文法チェック
        if re.search(r'です。です。', text):
            suggestions.append(WritingSuggestion(
                suggestion_type=WritingAssistanceType.GRAMMAR_FIX,
                original_text="です。です。",
                improved_text="です。ます。",
                explanation="同じ語尾が連続しています。語尾を変化させると読みやすくなります。",
                confidence=0.9,
                impact_level="medium"
            ))
        
        # 説得力向上の提案
        if "データ" not in text and "実績" not in text:
            suggestions.append(WritingSuggestion(
                suggestion_type=WritingAssistanceType.PERSUASIVENESS,
                original_text=text,
                improved_text=f"データによると、{text}",
                explanation="具体的なデータや実績を示すことで説得力が向上します。",
                confidence=0.8,
                impact_level="high"
            ))
        
        # 論理構造の改善
        if "そのため" not in text and "したがって" not in text and len(text) > 100:
            suggestions.append(WritingSuggestion(
                suggestion_type=WritingAssistanceType.LOGIC_STRUCTURE,
                original_text=text,
                improved_text=text.replace("。", "。そのため、", 1),
                explanation="論理的な接続詞を使用することで文章の流れが明確になります。",
                confidence=0.7,
                impact_level="medium"
            ))
        
        return suggestions[:3]  # 上位3つの提案
    
    def _get_contextual_tips(
        self,
        current_text: str,
        section_type: str,
        user_context: Dict[str, Any] = None
    ) -> List[str]:
        """コンテキスト別の文章作成ヒント"""
        tips = []
        
        # セクション別のヒント
        if section_type == "market_analysis":
            tips.extend([
                "市場規模は具体的な数値で示しましょう",
                "競合他社との差別化ポイントを明確に",
                "ターゲット顧客のニーズを具体的に記述"
            ])
        elif section_type == "technical_explanation":
            tips.extend([
                "技術的な特徴を分かりやすく説明",
                "従来技術との比較を含める",
                "実現可能性を具体的に示す"
            ])
        elif section_type == "business_plan":
            tips.extend([
                "収益性を数値で示す",
                "実施スケジュールを明確に",
                "リスク対策も含める"
            ])
        
        # 文章の状態に基づくヒント
        if len(current_text) < 100:
            tips.append("内容をもう少し詳しく説明してみましょう")
        
        if "効果" not in current_text:
            tips.append("期待される効果を具体的に記述してください")
        
        if not re.search(r'\d+', current_text):
            tips.append("具体的な数値を含めると説得力が向上します")
        
        return tips[:4]  # 最大4つのヒント
    
    def _identify_next_focus_areas(
        self,
        current_text: str,
        suggestions: List[WritingSuggestion]
    ) -> List[str]:
        """次の重点改善領域を特定"""
        focus_areas = []
        
        # 提案に基づく重点領域
        for suggestion in suggestions:
            if suggestion.impact_level == "high":
                if suggestion.suggestion_type == WritingAssistanceType.PERSUASIVENESS:
                    focus_areas.append("説得力の強化")
                elif suggestion.suggestion_type == WritingAssistanceType.LOGIC_STRUCTURE:
                    focus_areas.append("論理構造の改善")
                elif suggestion.suggestion_type == WritingAssistanceType.TECHNICAL_ACCURACY:
                    focus_areas.append("技術的正確性の向上")
        
        # テキストの状態に基づく追加領域
        if len(current_text) < 200:
            focus_areas.append("内容の充実")
        
        if not re.search(r'[具体的|実際|例えば]', current_text):
            focus_areas.append("具体性の向上")
        
        return list(set(focus_areas))[:3]  # 重複除去し最大3つ
    
    def _select_best_template(
        self,
        templates: List[str],
        context_data: Dict[str, Any]
    ) -> str:
        """最適テンプレートの選択"""
        # コンテキストデータのキーと一致する変数が多いテンプレートを選択
        best_template = templates[0]
        best_match_count = 0
        
        for template in templates:
            # テンプレート内の変数を抽出
            variables = re.findall(r'\{([^}]+)\}', template)
            match_count = sum(1 for var in variables if var in context_data)
            
            if match_count > best_match_count:
                best_match_count = match_count
                best_template = template
        
        return best_template
    
    def _apply_template(self, template: str, context_data: Dict[str, Any]) -> str:
        """テンプレートにデータを適用"""
        result = template
        
        # 変数を実際の値に置換
        for key, value in context_data.items():
            placeholder = f"{{{key}}}"
            if placeholder in result:
                result = result.replace(placeholder, str(value))
        
        # 未置換の変数をデフォルト値に置換
        remaining_vars = re.findall(r'\{([^}]+)\}', result)
        for var in remaining_vars:
            result = result.replace(f"{{{var}}}", f"[{var}を入力]")
        
        return result
    
    async def _enhance_content_quality(
        self,
        content: str,
        target_score: float
    ) -> str:
        """コンテンツ品質の向上"""
        enhanced = content
        
        # 説得力のあるフレーズを追加
        if "具体的" not in enhanced:
            enhanced = enhanced.replace("。", "。具体的には、", 1)
        
        # 接続詞を追加して論理性を向上
        if "そのため" not in enhanced and "したがって" not in enhanced:
            sentences = enhanced.split("。")
            if len(sentences) >= 2:
                sentences[1] = "そのため、" + sentences[1]
                enhanced = "。".join(sentences)
        
        return enhanced
    
    async def _improve_grammar(self, text: str) -> Dict[str, Any]:
        """文法改善"""
        improved = text
        changes = []
        
        # 重複語尾の修正
        if re.search(r'です。です。', text):
            improved = re.sub(r'です。です。', 'です。ます。', improved)
            changes.append("重複語尾を修正")
        
        # 読点の整理
        improved = re.sub(r'[、]{2,}', '、', improved)
        if improved != text:
            changes.append("読点を整理")
        
        return {"text": improved, "changes": changes}
    
    async def _improve_clarity(self, text: str) -> Dict[str, Any]:
        """明確性改善"""
        improved = text
        changes = []
        
        # 長すぎる文の分割提案
        sentences = re.split('[。！？]', text)
        long_sentences = [s for s in sentences if len(s) > 80]
        
        if long_sentences:
            changes.append("長い文の分割を検討")
        
        # 専門用語の説明追加提案
        if "AI" in text and "人工知能" not in text:
            improved = text.replace("AI", "AI（人工知能）", 1)
            changes.append("専門用語に説明を追加")
        
        return {"text": improved, "changes": changes}
    
    async def _improve_persuasiveness(self, text: str) -> Dict[str, Any]:
        """説得力改善"""
        improved = text
        changes = []
        
        # データ・実績の強調
        if re.search(r'\d+', text) and "データによると" not in text:
            # 最初の数値の前に「データによると」を追加
            improved = re.sub(r'(\d+)', r'データによると\1', improved, count=1)
            changes.append("データを強調")
        
        # 具体例の追加提案
        if "例えば" not in text and "具体的" not in text:
            improved = "具体的には、" + improved
            changes.append("具体性を追加")
        
        return {"text": improved, "changes": changes}
    
    async def _improve_structure(self, text: str) -> Dict[str, Any]:
        """構造改善"""
        improved = text
        changes = []
        
        # 接続詞の追加
        sentences = text.split("。")
        if len(sentences) >= 2 and not any(
            conn in text for conn in ["そのため", "また", "さらに", "したがって"]
        ):
            if len(sentences) > 1:
                sentences[1] = "そのため、" + sentences[1].strip()
                improved = "。".join(sentences)
                changes.append("論理的接続詞を追加")
        
        return {"text": improved, "changes": changes}
    
    async def _combine_improvements(
        self,
        original_text: str,
        improvements: Dict[str, Dict[str, Any]]
    ) -> str:
        """改善を統合"""
        result = original_text
        
        # 各改善を順次適用
        for improvement_type, improvement_data in improvements.items():
            if "text" in improvement_data:
                result = improvement_data["text"]
        
        return result
    
    def _generate_change_summary(self, improvements: Dict[str, Dict[str, Any]]) -> List[str]:
        """変更サマリー生成"""
        summary = []
        
        for improvement_type, improvement_data in improvements.items():
            if "changes" in improvement_data:
                for change in improvement_data["changes"]:
                    summary.append(f"{improvement_type}: {change}")
        
        return summary
    
    def _get_fallback_feedback(self) -> RealTimeFeedback:
        """フォールバック用フィードバック"""
        return RealTimeFeedback(
            current_score=70.0,
            suggestions=[],
            writing_tips=[
                "具体的な数値を含めましょう",
                "論理的な構成を心がけましょう",
                "読みやすい文章長を保ちましょう"
            ],
            next_focus_areas=["内容の充実"]
        )
    
    async def _generate_generic_content(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """汎用コンテンツ生成"""
        generic_content = "本事業について説明いたします。"
        
        if "purpose" in context_data:
            generic_content = f"本事業では、{context_data['purpose']}を目的として実施いたします。"
        
        return {
            "content": generic_content,
            "quality_score": 60.0,
            "template_used": "generic",
            "enhancement_applied": False,
            "suggestions": []
        }