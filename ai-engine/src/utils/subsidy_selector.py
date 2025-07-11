"""
補助金選択ユーティリティ
企業プロファイルとプロジェクト情報から最適な補助金を推奨
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from datetime import datetime
import logging

from ..config.subsidy_types import (
    SubsidyType, SubsidyCategory, subsidy_registry,
    get_eligible_subsidies
)

logger = logging.getLogger(__name__)


@dataclass
class SubsidyRecommendation:
    """補助金推奨結果"""
    subsidy: SubsidyType
    match_score: float
    reasons: List[str]
    warnings: List[str]
    estimated_amount: int
    success_probability: float


class SubsidySelector:
    """補助金選択・推奨システム"""
    
    def __init__(self):
        """初期化"""
        self.registry = subsidy_registry
    
    def recommend_subsidies(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        preferences: Optional[Dict[str, Any]] = None
    ) -> List[SubsidyRecommendation]:
        """
        補助金推奨
        
        Args:
            company_profile: 企業プロファイル
            project_info: プロジェクト情報
            preferences: 優先条件
            
        Returns:
            List[SubsidyRecommendation]: 推奨補助金リスト
        """
        try:
            # 適格な補助金を取得
            eligible_subsidies = get_eligible_subsidies(company_profile)
            
            if not eligible_subsidies:
                logger.warning("適格な補助金が見つかりません")
                return []
            
            # 各補助金のマッチングスコア計算
            recommendations = []
            
            for subsidy in eligible_subsidies:
                recommendation = self._evaluate_subsidy(
                    subsidy, company_profile, project_info, preferences
                )
                
                if recommendation.match_score > 0.3:  # 閾値
                    recommendations.append(recommendation)
            
            # スコア順にソート
            recommendations.sort(key=lambda x: x.match_score, reverse=True)
            
            return recommendations[:10]  # 上位10件
            
        except Exception as e:
            logger.error(f"補助金推奨エラー: {str(e)}")
            return []
    
    def _evaluate_subsidy(
        self,
        subsidy: SubsidyType,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        preferences: Optional[Dict[str, Any]] = None
    ) -> SubsidyRecommendation:
        """補助金評価"""
        
        match_score = 0.0
        reasons = []
        warnings = []
        
        # 1. カテゴリ適合性評価（20%）
        category_score = self._evaluate_category_match(
            subsidy.category, company_profile, project_info
        )
        match_score += category_score * 0.2
        
        if category_score > 0.7:
            reasons.append(f"{subsidy.category.value}分野に適合")
        
        # 2. 金額適合性評価（15%）
        budget = project_info.get("budget", 0)
        if budget > 0:
            amount_score = self._evaluate_amount_match(
                subsidy.max_amount, subsidy.subsidy_rate, budget
            )
            match_score += amount_score * 0.15
            
            if amount_score > 0.8:
                reasons.append("予算規模に適合")
            elif amount_score < 0.3:
                warnings.append("予算規模が補助金に対して小さい可能性")
        
        # 3. 業界適合性評価（15%）
        industry = company_profile.get("industry", "")
        industry_score = self._evaluate_industry_match(
            subsidy, industry, company_profile
        )
        match_score += industry_score * 0.15
        
        # 4. プロジェクト内容適合性（25%）
        project_score = self._evaluate_project_match(
            subsidy, project_info
        )
        match_score += project_score * 0.25
        
        if project_score > 0.7:
            reasons.append("プロジェクト内容が補助対象に適合")
        
        # 5. 成功可能性評価（15%）
        success_score = self._evaluate_success_probability(
            subsidy, company_profile, project_info
        )
        match_score += success_score * 0.15
        
        # 6. タイミング評価（10%）
        timing_score = self._evaluate_timing(subsidy)
        match_score += timing_score * 0.1
        
        if timing_score < 0.5:
            warnings.append("申請時期に注意が必要")
        
        # 推定補助金額計算
        estimated_amount = self._calculate_estimated_amount(
            subsidy, project_info.get("budget", 0)
        )
        
        # 成功確率推定
        success_probability = self._estimate_success_probability(
            subsidy, company_profile, project_info, match_score
        )
        
        return SubsidyRecommendation(
            subsidy=subsidy,
            match_score=match_score,
            reasons=reasons,
            warnings=warnings,
            estimated_amount=estimated_amount,
            success_probability=success_probability
        )
    
    def _evaluate_category_match(
        self,
        category: SubsidyCategory,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any]
    ) -> float:
        """カテゴリ適合性評価"""
        
        score = 0.5  # 基本スコア
        
        # プロジェクトタイプによる評価
        project_type = project_info.get("type", "")
        project_keywords = project_info.get("keywords", [])
        
        category_keywords = {
            SubsidyCategory.DIGITALIZATION: ["IT", "DX", "デジタル", "システム", "クラウド"],
            SubsidyCategory.MANUFACTURING: ["製造", "生産", "設備", "工場", "ものづくり"],
            SubsidyCategory.INNOVATION: ["革新", "新規事業", "転換", "イノベーション"],
            SubsidyCategory.STARTUP: ["創業", "起業", "新規開業", "スタートアップ"],
            SubsidyCategory.EMPLOYMENT: ["雇用", "人材", "教育", "キャリア", "正社員化"],
            SubsidyCategory.REGIONAL: ["地域", "地方", "商店街", "観光"],
            SubsidyCategory.ENVIRONMENT: ["環境", "省エネ", "CO2", "エネルギー"],
            SubsidyCategory.RESEARCH: ["研究", "開発", "R&D", "技術開発"],
            SubsidyCategory.EXPORT: ["海外", "輸出", "グローバル", "国際"],
            SubsidyCategory.SUCCESSION: ["承継", "M&A", "後継者", "事業継続"]
        }
        
        # キーワードマッチング
        if category in category_keywords:
            keywords = category_keywords[category]
            for keyword in keywords:
                if keyword in project_type or keyword in str(project_keywords):
                    score += 0.1
        
        # 業界による追加評価
        industry = company_profile.get("industry", "")
        if category == SubsidyCategory.MANUFACTURING and "製造" in industry:
            score += 0.2
        elif category == SubsidyCategory.DIGITALIZATION and "IT" in industry:
            score += 0.2
        
        return min(1.0, score)
    
    def _evaluate_amount_match(
        self,
        max_amount: int,
        subsidy_rate: float,
        project_budget: int
    ) -> float:
        """金額適合性評価"""
        
        if project_budget == 0:
            return 0.5
        
        # 補助金額の推定
        estimated_subsidy = min(project_budget * subsidy_rate, max_amount)
        
        # 予算に対する補助金の割合
        subsidy_ratio = estimated_subsidy / project_budget
        
        # 理想的な範囲は30-70%
        if 0.3 <= subsidy_ratio <= 0.7:
            return 1.0
        elif subsidy_ratio < 0.2:
            return 0.3  # 補助金額が小さすぎる
        elif subsidy_ratio > 0.8:
            return 0.7  # 自己負担が少なすぎる（審査で不利の可能性）
        else:
            return 0.6
    
    def _evaluate_industry_match(
        self,
        subsidy: SubsidyType,
        industry: str,
        company_profile: Dict[str, Any]
    ) -> float:
        """業界適合性評価"""
        
        req = subsidy.requirements
        
        # 対象業界チェック
        if req.target_industries:
            if industry in req.target_industries:
                return 1.0
            else:
                return 0.2
        
        # 除外業界チェック
        if req.excluded_industries:
            if industry in req.excluded_industries:
                return 0.0
        
        # 特定補助金の業界親和性
        industry_affinity = {
            "it_subsidy": ["IT", "情報通信", "ソフトウェア"],
            "monozukuri_subsidy": ["製造業", "ものづくり"],
            "shoene_subsidy": ["製造業", "エネルギー"],
            "kaigai_subsidy": ["製造業", "卸売業", "小売業"]
        }
        
        if subsidy.id in industry_affinity:
            if any(ind in industry for ind in industry_affinity[subsidy.id]):
                return 0.9
        
        return 0.7  # デフォルト
    
    def _evaluate_project_match(
        self,
        subsidy: SubsidyType,
        project_info: Dict[str, Any]
    ) -> float:
        """プロジェクト内容適合性評価"""
        
        score = 0.5
        
        # 対象経費との一致度
        project_expenses = project_info.get("expense_types", [])
        if project_expenses:
            matching_expenses = [
                exp for exp in project_expenses 
                if any(target in exp for target in subsidy.target_expenses)
            ]
            if matching_expenses:
                score += 0.3 * (len(matching_expenses) / len(project_expenses))
        
        # 評価基準との一致度
        project_strengths = project_info.get("strengths", [])
        evaluation_keywords = {
            "生産性向上": ["効率", "生産性", "自動化"],
            "革新性": ["革新", "新規", "独自"],
            "事業化可能性": ["市場", "収益", "ビジネス"],
            "地域貢献": ["地域", "雇用", "社会"]
        }
        
        for criteria in subsidy.evaluation_criteria:
            for key, keywords in evaluation_keywords.items():
                if key in criteria:
                    if any(kw in str(project_strengths) for kw in keywords):
                        score += 0.05
        
        return min(1.0, score)
    
    def _evaluate_success_probability(
        self,
        subsidy: SubsidyType,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any]
    ) -> float:
        """成功可能性評価"""
        
        base_rate = subsidy.success_rate
        
        # 企業規模による調整
        employees = company_profile.get("employee_count", 0)
        if employees > 100:
            base_rate *= 0.9  # 大企業は若干不利
        elif employees < 20:
            base_rate *= 1.1  # 小規模企業は優遇される傾向
        
        # 過去実績による調整
        past_subsidies = company_profile.get("past_subsidies", [])
        if past_subsidies:
            base_rate *= 1.2  # 実績があると有利
        
        return min(1.0, base_rate)
    
    def _evaluate_timing(self, subsidy: SubsidyType) -> float:
        """タイミング評価"""
        
        # 簡易実装：通年申請可能なものは高スコア
        if "通年" in subsidy.application_period:
            return 1.0
        elif "随時" in subsidy.application_period:
            return 0.9
        else:
            return 0.7  # 年数回の公募
    
    def _calculate_estimated_amount(
        self,
        subsidy: SubsidyType,
        project_budget: int
    ) -> int:
        """推定補助金額計算"""
        
        if project_budget == 0:
            return 0
        
        return min(
            int(project_budget * subsidy.subsidy_rate),
            subsidy.max_amount
        )
    
    def _estimate_success_probability(
        self,
        subsidy: SubsidyType,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        match_score: float
    ) -> float:
        """成功確率推定"""
        
        # 基本成功率
        base_probability = subsidy.success_rate
        
        # マッチスコアによる調整
        adjusted_probability = base_probability * (0.5 + match_score * 0.5)
        
        # 企業属性による調整
        if company_profile.get("certifications"):
            adjusted_probability *= 1.05  # 認証取得企業は有利
        
        if project_info.get("innovation_level") == "high":
            adjusted_probability *= 1.1  # 革新性が高いと有利
        
        return min(0.95, adjusted_probability)  # 最大95%


def recommend_best_subsidies(
    company_profile: Dict[str, Any],
    project_info: Dict[str, Any],
    top_n: int = 5
) -> List[SubsidyRecommendation]:
    """
    最適な補助金を推奨
    
    Args:
        company_profile: 企業プロファイル
        project_info: プロジェクト情報
        top_n: 推奨数
        
    Returns:
        List[SubsidyRecommendation]: 推奨補助金リスト
    """
    selector = SubsidySelector()
    return selector.recommend_subsidies(company_profile, project_info)[:top_n]