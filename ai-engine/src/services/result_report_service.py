"""
結果レポートサービス
補助金プロジェクトの成果・実績レポート生成機能
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
import asyncio
import logging
import json
from decimal import Decimal
import statistics

logger = logging.getLogger(__name__)


class ReportType(Enum):
    """レポートタイプ"""
    INTERIM = "interim"          # 中間報告
    FINAL = "final"              # 最終報告
    QUARTERLY = "quarterly"      # 四半期報告
    MONTHLY = "monthly"          # 月次報告
    AD_HOC = "ad_hoc"           # 臨時報告


class MetricType(Enum):
    """指標タイプ"""
    FINANCIAL = "financial"     # 財務指標
    OPERATIONAL = "operational" # 運営指標
    QUALITY = "quality"         # 品質指標
    CUSTOMER = "customer"       # 顧客指標
    PROCESS = "process"         # プロセス指標


class AchievementLevel(Enum):
    """達成レベル"""
    EXCEEDED = "exceeded"       # 目標超過
    ACHIEVED = "achieved"       # 目標達成
    PARTIAL = "partial"         # 部分達成
    NOT_ACHIEVED = "not_achieved"  # 未達成
    PENDING = "pending"         # 評価中


@dataclass
class MetricResult:
    """指標結果"""
    metric_id: str
    name: str
    metric_type: MetricType
    target_value: float
    actual_value: float
    unit: str
    achievement_rate: float
    achievement_level: AchievementLevel
    measurement_period: str
    measurement_date: datetime
    notes: Optional[str] = None
    supporting_data: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class BudgetResult:
    """予算実績"""
    category: str
    planned_amount: Decimal
    actual_amount: Decimal
    variance: Decimal
    variance_percentage: float
    variance_reason: Optional[str] = None
    supporting_documents: List[str] = field(default_factory=list)


@dataclass
class ActivityResult:
    """活動実績"""
    activity_id: str
    activity_name: str
    planned_completion_date: datetime
    actual_completion_date: Optional[datetime]
    completion_status: str
    output_description: str
    outcome_description: str
    impact_description: str
    challenges_faced: List[str] = field(default_factory=list)
    lessons_learned: List[str] = field(default_factory=list)


@dataclass
class RiskIssueResult:
    """リスク・課題結果"""
    risk_id: str
    description: str
    impact_level: str  # "high", "medium", "low"
    probability: str   # "high", "medium", "low"
    mitigation_actions: List[str]
    current_status: str
    resolution_date: Optional[datetime] = None


@dataclass
class StakeholderFeedback:
    """ステークホルダーフィードバック"""
    stakeholder_type: str  # "customer", "partner", "team", "management"
    feedback_content: str
    sentiment: str  # "positive", "neutral", "negative"
    actionable_items: List[str] = field(default_factory=list)
    received_date: datetime = field(default_factory=datetime.now)


@dataclass
class ProjectReport:
    """プロジェクトレポート"""
    report_id: str
    project_id: str
    project_name: str
    report_type: ReportType
    reporting_period_start: datetime
    reporting_period_end: datetime
    generated_date: datetime
    
    # エグゼクティブサマリー
    executive_summary: str
    
    # 主要成果
    key_achievements: List[str]
    
    # 指標結果
    metric_results: List[MetricResult]
    
    # 予算実績
    budget_results: List[BudgetResult]
    
    # 活動実績
    activity_results: List[ActivityResult]
    
    # リスク・課題
    risk_issues: List[RiskIssueResult]
    
    # ステークホルダーフィードバック
    stakeholder_feedback: List[StakeholderFeedback]
    
    # 次期計画
    next_period_plans: List[str]
    
    # 添付資料
    attachments: List[str] = field(default_factory=list)
    
    # 承認状況
    approval_status: str = "draft"
    approved_by: Optional[str] = None
    approved_date: Optional[datetime] = None


@dataclass
class ReportTemplate:
    """レポートテンプレート"""
    template_id: str
    name: str
    report_type: ReportType
    required_sections: List[str]
    metric_definitions: List[Dict[str, Any]]
    format_guidelines: Dict[str, Any]


@dataclass
class PerformanceAnalysis:
    """パフォーマンス分析"""
    trend_analysis: Dict[str, List[float]]
    variance_analysis: Dict[str, Dict[str, float]]
    benchmark_comparison: Dict[str, Dict[str, float]]
    forecast: Dict[str, List[float]]
    recommendations: List[str]


class ResultReportService:
    """結果レポートサービス"""
    
    def __init__(self):
        self.report_templates = {}
        self.reports = {}
        self.metric_definitions = {}
        self._initialize_templates()
    
    
    def _initialize_templates(self):
        """レポートテンプレートの初期化"""
        
        # 持続化補助金最終報告テンプレート
        jizokuka_final_template = ReportTemplate(
            template_id="jizokuka_final",
            name="持続化補助金最終報告書",
            report_type=ReportType.FINAL,
            required_sections=[
                "executive_summary",
                "project_overview", 
                "achievements",
                "financial_results",
                "operational_results",
                "impact_assessment",
                "lessons_learned",
                "sustainability_plan"
            ],
            metric_definitions=[
                {
                    "metric_id": "sales_growth",
                    "name": "売上高成長率",
                    "type": MetricType.FINANCIAL,
                    "unit": "%",
                    "calculation": "((新売上 - 旧売上) / 旧売上) * 100"
                },
                {
                    "metric_id": "customer_acquisition",
                    "name": "新規顧客獲得数",
                    "type": MetricType.CUSTOMER,
                    "unit": "件",
                    "calculation": "期間中の新規顧客数"
                },
                {
                    "metric_id": "productivity_improvement",
                    "name": "生産性向上率",
                    "type": MetricType.OPERATIONAL,
                    "unit": "%",
                    "calculation": "作業効率の改善度"
                }
            ],
            format_guidelines={
                "page_limit": 20,
                "chart_requirements": ["売上推移", "顧客数推移", "効果測定"],
                "evidence_requirements": ["売上実績", "顧客リスト", "効果測定データ"]
            }
        )
        
        # 中間報告テンプレート
        jizokuka_interim_template = ReportTemplate(
            template_id="jizokuka_interim",
            name="持続化補助金中間報告書",
            report_type=ReportType.INTERIM,
            required_sections=[
                "progress_summary",
                "current_achievements",
                "budget_status",
                "challenges",
                "next_steps"
            ],
            metric_definitions=[
                {
                    "metric_id": "progress_rate",
                    "name": "進捗率",
                    "type": MetricType.PROCESS,
                    "unit": "%",
                    "calculation": "完了タスク数 / 全タスク数 * 100"
                },
                {
                    "metric_id": "budget_consumption",
                    "name": "予算消化率",
                    "type": MetricType.FINANCIAL,
                    "unit": "%",
                    "calculation": "使用予算 / 計画予算 * 100"
                }
            ],
            format_guidelines={
                "page_limit": 10,
                "chart_requirements": ["進捗状況", "予算消化"],
                "update_frequency": "monthly"
            }
        )
        
        self.report_templates = {
            "jizokuka_final": jizokuka_final_template,
            "jizokuka_interim": jizokuka_interim_template
        }
    
    
    async def generate_project_report(
        self,
        project_id: str,
        template_id: str,
        reporting_period_start: datetime,
        reporting_period_end: datetime,
        additional_data: Optional[Dict[str, Any]] = None
    ) -> ProjectReport:
        """プロジェクトレポート生成"""
        
        if template_id not in self.report_templates:
            raise ValueError(f"レポートテンプレートが見つかりません: {template_id}")
        
        template = self.report_templates[template_id]
        report_id = f"report_{project_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        logger.info(f"レポート生成開始: {report_id}")
        
        # 指標結果の計算
        metric_results = await self._calculate_metric_results(
            project_id, template, reporting_period_start, reporting_period_end
        )
        
        # 予算実績の分析
        budget_results = await self._analyze_budget_results(
            project_id, reporting_period_start, reporting_period_end
        )
        
        # 活動実績の集計
        activity_results = await self._collect_activity_results(
            project_id, reporting_period_start, reporting_period_end
        )
        
        # エグゼクティブサマリーの生成
        executive_summary = await self._generate_executive_summary(
            project_id, metric_results, budget_results, activity_results
        )
        
        # 主要成果の抽出
        key_achievements = await self._extract_key_achievements(
            metric_results, activity_results
        )
        
        # リスク・課題の評価
        risk_issues = await self._assess_risks_issues(project_id)
        
        # ステークホルダーフィードバックの収集
        stakeholder_feedback = await self._collect_stakeholder_feedback(project_id)
        
        # 次期計画の策定
        next_period_plans = await self._develop_next_period_plans(
            project_id, metric_results, risk_issues
        )
        
        report = ProjectReport(
            report_id=report_id,
            project_id=project_id,
            project_name=additional_data.get("project_name", f"Project {project_id}"),
            report_type=template.report_type,
            reporting_period_start=reporting_period_start,
            reporting_period_end=reporting_period_end,
            generated_date=datetime.now(),
            executive_summary=executive_summary,
            key_achievements=key_achievements,
            metric_results=metric_results,
            budget_results=budget_results,
            activity_results=activity_results,
            risk_issues=risk_issues,
            stakeholder_feedback=stakeholder_feedback,
            next_period_plans=next_period_plans
        )
        
        self.reports[report_id] = report
        
        logger.info(f"レポート生成完了: {report_id}")
        return report
    
    
    async def _calculate_metric_results(
        self,
        project_id: str,
        template: ReportTemplate,
        period_start: datetime,
        period_end: datetime
    ) -> List[MetricResult]:
        """指標結果の計算"""
        
        metric_results = []
        
        for metric_def in template.metric_definitions:
            # 実際のデータ取得（ここではモックデータを使用）
            actual_value = await self._get_metric_actual_value(
                project_id, metric_def["metric_id"], period_start, period_end
            )
            
            # 目標値の取得
            target_value = await self._get_metric_target_value(
                project_id, metric_def["metric_id"]
            )
            
            # 達成率の計算
            achievement_rate = (actual_value / target_value * 100) if target_value > 0 else 0
            
            # 達成レベルの判定
            achievement_level = self._determine_achievement_level(achievement_rate)
            
            metric_result = MetricResult(
                metric_id=metric_def["metric_id"],
                name=metric_def["name"],
                metric_type=MetricType(metric_def["type"]),
                target_value=target_value,
                actual_value=actual_value,
                unit=metric_def["unit"],
                achievement_rate=achievement_rate,
                achievement_level=achievement_level,
                measurement_period=f"{period_start.strftime('%Y-%m-%d')} - {period_end.strftime('%Y-%m-%d')}",
                measurement_date=period_end
            )
            
            metric_results.append(metric_result)
        
        return metric_results
    
    
    async def _get_metric_actual_value(
        self,
        project_id: str,
        metric_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> float:
        """指標実績値の取得（モック実装）"""
        
        # 実際の実装では、データベースや外部システムから取得
        mock_data = {
            "sales_growth": 15.5,
            "customer_acquisition": 25,
            "productivity_improvement": 12.3,
            "progress_rate": 85.0,
            "budget_consumption": 78.5
        }
        
        return mock_data.get(metric_id, 0.0)
    
    
    async def _get_metric_target_value(
        self,
        project_id: str,
        metric_id: str
    ) -> float:
        """指標目標値の取得（モック実装）"""
        
        # 実際の実装では、プロジェクト設定から取得
        mock_targets = {
            "sales_growth": 10.0,
            "customer_acquisition": 20,
            "productivity_improvement": 15.0,
            "progress_rate": 90.0,
            "budget_consumption": 95.0
        }
        
        return mock_targets.get(metric_id, 100.0)
    
    
    def _determine_achievement_level(self, achievement_rate: float) -> AchievementLevel:
        """達成レベルの判定"""
        
        if achievement_rate >= 110:
            return AchievementLevel.EXCEEDED
        elif achievement_rate >= 100:
            return AchievementLevel.ACHIEVED
        elif achievement_rate >= 80:
            return AchievementLevel.PARTIAL
        else:
            return AchievementLevel.NOT_ACHIEVED
    
    
    async def _analyze_budget_results(
        self,
        project_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> List[BudgetResult]:
        """予算実績の分析"""
        
        # モック予算データ
        budget_categories = [
            {
                "category": "広告宣伝費",
                "planned": 500000,
                "actual": 480000,
                "reason": "効率的な広告運用により予算内で目標達成"
            },
            {
                "category": "システム開発費",
                "planned": 800000,
                "actual": 820000,
                "reason": "追加機能要件により若干の予算オーバー"
            },
            {
                "category": "人件費",
                "planned": 300000,
                "actual": 285000,
                "reason": "作業効率向上により予定より少ない工数で完了"
            }
        ]
        
        budget_results = []
        
        for budget_item in budget_categories:
            planned = Decimal(str(budget_item["planned"]))
            actual = Decimal(str(budget_item["actual"]))
            variance = actual - planned
            variance_percentage = float(variance / planned * 100)
            
            budget_result = BudgetResult(
                category=budget_item["category"],
                planned_amount=planned,
                actual_amount=actual,
                variance=variance,
                variance_percentage=variance_percentage,
                variance_reason=budget_item.get("reason")
            )
            
            budget_results.append(budget_result)
        
        return budget_results
    
    
    async def _collect_activity_results(
        self,
        project_id: str,
        period_start: datetime,
        period_end: datetime
    ) -> List[ActivityResult]:
        """活動実績の集計"""
        
        # モック活動データ
        activities = [
            {
                "id": "act_001",
                "name": "Webサイトリニューアル",
                "planned_date": period_start + timedelta(days=30),
                "actual_date": period_start + timedelta(days=28),
                "status": "completed",
                "output": "新Webサイトの公開",
                "outcome": "アクセス数30%向上",
                "impact": "問い合わせ数20%増加",
                "challenges": ["デザイン調整に予想以上の時間"],
                "lessons": ["早期のユーザーテストが重要"]
            },
            {
                "id": "act_002",
                "name": "販路開拓営業",
                "planned_date": period_start + timedelta(days=60),
                "actual_date": period_start + timedelta(days=55),
                "status": "completed",
                "output": "新規取引先5社との契約締結",
                "outcome": "売上高15%向上",
                "impact": "事業の安定性向上",
                "challenges": ["競合他社との差別化"],
                "lessons": ["既存顧客からの紹介が最も効果的"]
            }
        ]
        
        activity_results = []
        
        for activity in activities:
            activity_result = ActivityResult(
                activity_id=activity["id"],
                activity_name=activity["name"],
                planned_completion_date=activity["planned_date"],
                actual_completion_date=activity.get("actual_date"),
                completion_status=activity["status"],
                output_description=activity["output"],
                outcome_description=activity["outcome"],
                impact_description=activity["impact"],
                challenges_faced=activity.get("challenges", []),
                lessons_learned=activity.get("lessons", [])
            )
            
            activity_results.append(activity_result)
        
        return activity_results
    
    
    async def _generate_executive_summary(
        self,
        project_id: str,
        metric_results: List[MetricResult],
        budget_results: List[BudgetResult],
        activity_results: List[ActivityResult]
    ) -> str:
        """エグゼクティブサマリーの生成"""
        
        # 主要指標の達成状況
        achieved_metrics = [m for m in metric_results if m.achievement_level in [AchievementLevel.ACHIEVED, AchievementLevel.EXCEEDED]]
        achievement_rate = len(achieved_metrics) / len(metric_results) * 100 if metric_results else 0
        
        # 予算状況
        total_planned = sum(b.planned_amount for b in budget_results)
        total_actual = sum(b.actual_amount for b in budget_results)
        budget_efficiency = float(total_planned / total_actual * 100) if total_actual > 0 else 100
        
        # 完了活動数
        completed_activities = len([a for a in activity_results if a.completion_status == "completed"])
        
        summary = f"""
        【エグゼクティブサマリー】
        
        本報告期間において、プロジェクトは順調に進展し、設定された目標の{achievement_rate:.1f}%を達成しました。
        
        ■ 主要成果
        - 目標達成率: {achievement_rate:.1f}%（{len(achieved_metrics)}/{len(metric_results)}指標）
        - 予算効率: {budget_efficiency:.1f}%
        - 完了活動: {completed_activities}件
        
        ■ 特筆すべき成果
        """
        
        # 特に優秀な指標を追加
        for metric in metric_results:
            if metric.achievement_level == AchievementLevel.EXCEEDED:
                summary += f"- {metric.name}: {metric.actual_value}{metric.unit}（目標の{metric.achievement_rate:.1f}%達成）\n"
        
        summary += """
        ■ 今後の取り組み
        継続的な改善により、さらなる成果の向上を目指します。
        """
        
        return summary.strip()
    
    
    async def _extract_key_achievements(
        self,
        metric_results: List[MetricResult],
        activity_results: List[ActivityResult]
    ) -> List[str]:
        """主要成果の抽出"""
        
        achievements = []
        
        # 目標超過した指標
        for metric in metric_results:
            if metric.achievement_level == AchievementLevel.EXCEEDED:
                achievements.append(
                    f"{metric.name}で目標を大幅に上回る{metric.actual_value}{metric.unit}を達成"
                )
        
        # 完了した活動の成果
        for activity in activity_results:
            if activity.completion_status == "completed":
                achievements.append(
                    f"{activity.activity_name}完了: {activity.impact_description}"
                )
        
        return achievements
    
    
    async def _assess_risks_issues(self, project_id: str) -> List[RiskIssueResult]:
        """リスク・課題の評価"""
        
        # モックリスクデータ
        risks = [
            {
                "id": "risk_001",
                "description": "競合他社の新商品投入による市場競争激化",
                "impact": "medium",
                "probability": "high",
                "mitigation": ["差別化戦略の強化", "顧客満足度向上施策"],
                "status": "monitoring"
            },
            {
                "id": "risk_002",
                "description": "原材料価格の上昇によるコスト増",
                "impact": "high",
                "probability": "medium",
                "mitigation": ["代替材料の検討", "サプライヤーとの価格交渉"],
                "status": "mitigation_in_progress"
            }
        ]
        
        risk_results = []
        
        for risk in risks:
            risk_result = RiskIssueResult(
                risk_id=risk["id"],
                description=risk["description"],
                impact_level=risk["impact"],
                probability=risk["probability"],
                mitigation_actions=risk["mitigation"],
                current_status=risk["status"]
            )
            
            risk_results.append(risk_result)
        
        return risk_results
    
    
    async def _collect_stakeholder_feedback(
        self,
        project_id: str
    ) -> List[StakeholderFeedback]:
        """ステークホルダーフィードバックの収集"""
        
        # モックフィードバックデータ
        feedback_data = [
            {
                "type": "customer",
                "content": "新しいサービスの品質が向上し、非常に満足している",
                "sentiment": "positive",
                "actions": ["継続的な品質向上", "新機能の追加検討"]
            },
            {
                "type": "partner",
                "content": "連携がスムーズで、双方にメリットのある関係",
                "sentiment": "positive",
                "actions": ["パートナーシップの拡大検討"]
            },
            {
                "type": "team",
                "content": "プロジェクト管理ツールの導入で作業効率が向上",
                "sentiment": "positive",
                "actions": ["他部門への展開検討"]
            }
        ]
        
        feedback_results = []
        
        for feedback in feedback_data:
            feedback_result = StakeholderFeedback(
                stakeholder_type=feedback["type"],
                feedback_content=feedback["content"],
                sentiment=feedback["sentiment"],
                actionable_items=feedback["actions"]
            )
            
            feedback_results.append(feedback_result)
        
        return feedback_results
    
    
    async def _develop_next_period_plans(
        self,
        project_id: str,
        metric_results: List[MetricResult],
        risk_issues: List[RiskIssueResult]
    ) -> List[str]:
        """次期計画の策定"""
        
        plans = []
        
        # 未達成指標の改善計画
        for metric in metric_results:
            if metric.achievement_level == AchievementLevel.NOT_ACHIEVED:
                plans.append(f"{metric.name}の改善: 目標{metric.target_value}{metric.unit}達成に向けた取り組み強化")
        
        # リスク対応計画
        for risk in risk_issues:
            if risk.impact_level == "high":
                plans.append(f"リスク対応: {risk.description}への対策実施")
        
        # 一般的な改善計画
        plans.extend([
            "定期的な進捗レビューミーティングの実施",
            "ステークホルダーとのコミュニケーション強化",
            "品質管理プロセスの継続的改善"
        ])
        
        return plans
    
    
    async def analyze_performance_trends(
        self,
        project_id: str,
        metric_ids: List[str],
        analysis_periods: int = 6
    ) -> PerformanceAnalysis:
        """パフォーマンス傾向分析"""
        
        # モックトレンドデータ
        trend_data = {}
        variance_data = {}
        benchmark_data = {}
        forecast_data = {}
        
        for metric_id in metric_ids:
            # 過去のデータ点を生成（モック）
            historical_values = [
                float(100 + i * 5 + (i % 2) * 3) for i in range(analysis_periods)
            ]
            trend_data[metric_id] = historical_values
            
            # 分散分析
            if len(historical_values) > 1:
                mean_value = statistics.mean(historical_values)
                std_dev = statistics.stdev(historical_values)
                variance_data[metric_id] = {
                    "mean": mean_value,
                    "std_dev": std_dev,
                    "cv": std_dev / mean_value if mean_value != 0 else 0
                }
            
            # ベンチマーク比較（業界平均）
            benchmark_data[metric_id] = {
                "industry_average": 105.0,
                "top_quartile": 120.0,
                "median": 100.0
            }
            
            # 予測値（簡単な線形予測）
            if len(historical_values) >= 2:
                growth_rate = (historical_values[-1] - historical_values[0]) / len(historical_values)
                forecast_values = [
                    historical_values[-1] + growth_rate * (i + 1) for i in range(3)
                ]
                forecast_data[metric_id] = forecast_values
        
        # 推奨事項の生成
        recommendations = [
            "継続的な改善により安定した成長を維持",
            "業界ベンチマークを上回る成果の実現",
            "予測値に基づく事前の対策実施"
        ]
        
        analysis = PerformanceAnalysis(
            trend_analysis=trend_data,
            variance_analysis=variance_data,
            benchmark_comparison=benchmark_data,
            forecast=forecast_data,
            recommendations=recommendations
        )
        
        return analysis
    
    
    async def export_report_to_format(
        self,
        report_id: str,
        format_type: str = "json"
    ) -> Dict[str, Any]:
        """レポートのフォーマット出力"""
        
        if report_id not in self.reports:
            raise ValueError(f"レポートが見つかりません: {report_id}")
        
        report = self.reports[report_id]
        
        if format_type == "json":
            return self._export_to_json(report)
        elif format_type == "pdf":
            return await self._export_to_pdf(report)
        elif format_type == "excel":
            return await self._export_to_excel(report)
        else:
            raise ValueError(f"サポートされていないフォーマット: {format_type}")
    
    
    def _export_to_json(self, report: ProjectReport) -> Dict[str, Any]:
        """JSON形式でのエクスポート"""
        
        return {
            "report_info": {
                "id": report.report_id,
                "project_id": report.project_id,
                "project_name": report.project_name,
                "type": report.report_type.value,
                "period": {
                    "start": report.reporting_period_start.isoformat(),
                    "end": report.reporting_period_end.isoformat()
                },
                "generated": report.generated_date.isoformat()
            },
            "executive_summary": report.executive_summary,
            "key_achievements": report.key_achievements,
            "metrics": [
                {
                    "id": m.metric_id,
                    "name": m.name,
                    "type": m.metric_type.value,
                    "target": m.target_value,
                    "actual": m.actual_value,
                    "unit": m.unit,
                    "achievement_rate": m.achievement_rate,
                    "level": m.achievement_level.value
                }
                for m in report.metric_results
            ],
            "budget": [
                {
                    "category": b.category,
                    "planned": float(b.planned_amount),
                    "actual": float(b.actual_amount),
                    "variance": float(b.variance),
                    "variance_pct": b.variance_percentage
                }
                for b in report.budget_results
            ],
            "activities": [
                {
                    "id": a.activity_id,
                    "name": a.activity_name,
                    "status": a.completion_status,
                    "output": a.output_description,
                    "outcome": a.outcome_description,
                    "impact": a.impact_description
                }
                for a in report.activity_results
            ],
            "next_period_plans": report.next_period_plans
        }
    
    
    async def _export_to_pdf(self, report: ProjectReport) -> Dict[str, Any]:
        """PDF形式でのエクスポート"""
        
        # 実際の実装では PDF 生成ライブラリを使用
        return {
            "format": "pdf",
            "file_path": f"/tmp/{report.report_id}.pdf",
            "status": "generated",
            "page_count": 15
        }
    
    
    async def _export_to_excel(self, report: ProjectReport) -> Dict[str, Any]:
        """Excel形式でのエクスポート"""
        
        # 実際の実装では Excel 生成ライブラリを使用
        return {
            "format": "excel",
            "file_path": f"/tmp/{report.report_id}.xlsx",
            "status": "generated",
            "sheets": ["サマリー", "指標詳細", "予算実績", "活動実績"]
        }
    
    
    async def get_report_dashboard_data(
        self,
        project_ids: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """レポートダッシュボード用データ取得"""
        
        reports = list(self.reports.values())
        if project_ids:
            reports = [r for r in reports if r.project_id in project_ids]
        
        # 全体統計
        total_reports = len(reports)
        recent_reports = len([
            r for r in reports 
            if (datetime.now() - r.generated_date).days <= 30
        ])
        
        # 達成率統計
        all_achievements = []
        for report in reports:
            for metric in report.metric_results:
                all_achievements.append(metric.achievement_rate)
        
        avg_achievement = statistics.mean(all_achievements) if all_achievements else 0
        
        # レポートタイプ別統計
        type_stats = {}
        for report in reports:
            report_type = report.report_type.value
            if report_type not in type_stats:
                type_stats[report_type] = 0
            type_stats[report_type] += 1
        
        dashboard_data = {
            "summary": {
                "total_reports": total_reports,
                "recent_reports": recent_reports,
                "avg_achievement_rate": round(avg_achievement, 1),
                "report_types": type_stats
            },
            "recent_reports": [
                {
                    "id": r.report_id,
                    "project_name": r.project_name,
                    "type": r.report_type.value,
                    "generated": r.generated_date.isoformat(),
                    "overall_achievement": round(
                        statistics.mean([m.achievement_rate for m in r.metric_results])
                        if r.metric_results else 0, 1
                    )
                }
                for r in sorted(reports, key=lambda x: x.generated_date, reverse=True)[:5]
            ]
        }
        
        return dashboard_data