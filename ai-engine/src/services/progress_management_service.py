"""
進捗管理サービス
補助金申請プロジェクトの進捗追跡・管理機能
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta, date
from enum import Enum
import asyncio
import logging
import json
from decimal import Decimal

logger = logging.getLogger(__name__)


class TaskStatus(Enum):
    """タスクステータス"""
    NOT_STARTED = "not_started"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    ON_HOLD = "on_hold"
    CANCELLED = "cancelled"
    OVERDUE = "overdue"


class TaskPriority(Enum):
    """タスク優先度"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class MilestoneType(Enum):
    """マイルストーンタイプ"""
    APPLICATION_SUBMIT = "application_submit"
    DOCUMENT_PREPARATION = "document_preparation"
    REVIEW_FEEDBACK = "review_feedback"
    FINAL_SUBMISSION = "final_submission"
    RESULT_NOTIFICATION = "result_notification"
    PROJECT_START = "project_start"
    PROJECT_END = "project_end"
    REPORT_SUBMISSION = "report_submission"


class ProjectPhase(Enum):
    """プロジェクトフェーズ"""
    PLANNING = "planning"
    APPLICATION = "application"
    REVIEW = "review"
    EXECUTION = "execution"
    REPORTING = "reporting"
    COMPLETED = "completed"


@dataclass
class Task:
    """タスク定義"""
    id: str
    title: str
    description: str
    status: TaskStatus
    priority: TaskPriority
    assigned_to: Optional[str] = None
    due_date: Optional[datetime] = None
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    estimated_hours: float = 0.0
    actual_hours: float = 0.0
    dependencies: List[str] = field(default_factory=list)
    attachments: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    completion_percentage: float = 0.0


@dataclass
class Milestone:
    """マイルストーン定義"""
    id: str
    name: str
    type: MilestoneType
    target_date: datetime
    phase: ProjectPhase
    tasks: List[str] = field(default_factory=list)
    is_completed: bool = False
    completed_date: Optional[datetime] = None
    deliverables: List[str] = field(default_factory=list)
    success_criteria: List[str] = field(default_factory=list)


@dataclass
class ProjectKPI:
    """プロジェクトKPI"""
    name: str
    current_value: float
    target_value: float
    unit: str
    trend: str  # "up", "down", "stable"
    last_updated: datetime = field(default_factory=datetime.now)


@dataclass
class BudgetStatus:
    """予算状況"""
    total_budget: Decimal
    allocated: Decimal
    spent: Decimal
    committed: Decimal
    available: Decimal
    burn_rate: float  # 月次消化率
    forecast_completion: Optional[datetime] = None


@dataclass
class ProjectProgress:
    """プロジェクト進捗"""
    project_id: str
    project_name: str
    current_phase: ProjectPhase
    overall_progress: float
    start_date: datetime
    target_end_date: datetime
    tasks: List[Task]
    milestones: List[Milestone]
    kpis: List[ProjectKPI]
    budget_status: Optional[BudgetStatus] = None
    team_members: List[Dict[str, Any]] = field(default_factory=list)
    risk_items: List[Dict[str, Any]] = field(default_factory=list)
    recent_activities: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class ProgressAlert:
    """進捗アラート"""
    id: str
    type: str  # "overdue", "milestone_approaching", "budget_overrun", etc.
    severity: str  # "info", "warning", "critical"
    title: str
    message: str
    related_items: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    is_read: bool = False


class ProgressManagementService:
    """進捗管理サービス"""
    
    def __init__(self):
        self.projects = {}
        self.task_templates = {}
        self.milestone_templates = {}
        self._initialize_templates()
    
    
    def _initialize_templates(self):
        """テンプレートの初期化"""
        
        # 持続化補助金申請タスクテンプレート
        self.task_templates["jizokuka_application"] = [
            {
                "title": "事業計画書作成",
                "description": "販路開拓・生産性向上の具体的計画を作成",
                "priority": TaskPriority.HIGH,
                "estimated_hours": 8.0,
                "tags": ["documents", "planning"]
            },
            {
                "title": "経営計画書作成",
                "description": "現状分析と将来ビジョンの明確化",
                "priority": TaskPriority.HIGH,
                "estimated_hours": 6.0,
                "tags": ["documents", "analysis"]
            },
            {
                "title": "補助対象経費の見積もり取得",
                "description": "必要な経費の見積書を業者から取得",
                "priority": TaskPriority.MEDIUM,
                "estimated_hours": 4.0,
                "tags": ["procurement", "budget"]
            },
            {
                "title": "決算書・確定申告書準備",
                "description": "過去2期分の財務書類を準備",
                "priority": TaskPriority.MEDIUM,
                "estimated_hours": 2.0,
                "tags": ["documents", "financial"]
            },
            {
                "title": "申請書類の最終確認",
                "description": "全書類の整合性と完全性をチェック",
                "priority": TaskPriority.CRITICAL,
                "estimated_hours": 3.0,
                "tags": ["review", "quality"]
            }
        ]
        
        # マイルストーンテンプレート
        self.milestone_templates["jizokuka_application"] = [
            {
                "name": "申請準備完了",
                "type": MilestoneType.DOCUMENT_PREPARATION,
                "phase": ProjectPhase.PLANNING,
                "days_from_start": 14,
                "success_criteria": [
                    "全ての必要書類が揃っている",
                    "事業計画の妥当性が確認されている",
                    "予算計画が適切に策定されている"
                ]
            },
            {
                "name": "申請書提出",
                "type": MilestoneType.APPLICATION_SUBMIT,
                "phase": ProjectPhase.APPLICATION,
                "days_from_start": 21,
                "success_criteria": [
                    "オンライン申請が完了している",
                    "受付番号を取得している",
                    "提出確認メールを受信している"
                ]
            },
            {
                "name": "採択通知",
                "type": MilestoneType.RESULT_NOTIFICATION,
                "phase": ProjectPhase.REVIEW,
                "days_from_start": 90,
                "success_criteria": [
                    "採択/不採択の通知を受領",
                    "採択の場合は交付決定通知書を受領"
                ]
            }
        ]
    
    
    async def create_project(
        self,
        project_name: str,
        subsidy_type: str,
        start_date: Optional[datetime] = None,
        target_end_date: Optional[datetime] = None,
        budget: Optional[Decimal] = None,
        team_members: Optional[List[Dict[str, Any]]] = None
    ) -> ProjectProgress:
        """新規プロジェクト作成"""
        
        project_id = f"proj_{datetime.now().strftime('%Y%m%d%H%M%S')}"
        start_date = start_date or datetime.now()
        
        # デフォルトの終了日設定（6ヶ月後）
        if not target_end_date:
            target_end_date = start_date + timedelta(days=180)
        
        # テンプレートからタスク生成
        tasks = await self._create_tasks_from_template(
            subsidy_type, project_id, start_date
        )
        
        # マイルストーン生成
        milestones = await self._create_milestones_from_template(
            subsidy_type, project_id, start_date
        )
        
        # 初期KPI設定
        kpis = self._create_initial_kpis(subsidy_type)
        
        # 予算状況初期化
        budget_status = None
        if budget:
            budget_status = BudgetStatus(
                total_budget=budget,
                allocated=Decimal(0),
                spent=Decimal(0),
                committed=Decimal(0),
                available=budget,
                burn_rate=0.0
            )
        
        project = ProjectProgress(
            project_id=project_id,
            project_name=project_name,
            current_phase=ProjectPhase.PLANNING,
            overall_progress=0.0,
            start_date=start_date,
            target_end_date=target_end_date,
            tasks=tasks,
            milestones=milestones,
            kpis=kpis,
            budget_status=budget_status,
            team_members=team_members or []
        )
        
        self.projects[project_id] = project
        
        logger.info(f"プロジェクト作成完了: {project_id} - {project_name}")
        return project
    
    
    async def _create_tasks_from_template(
        self,
        template_name: str,
        project_id: str,
        start_date: datetime
    ) -> List[Task]:
        """テンプレートからタスク生成"""
        
        template = self.task_templates.get(template_name, [])
        tasks = []
        
        for idx, task_template in enumerate(template):
            # 期限設定（順次実行を想定）
            days_offset = idx * 3  # 3日ごとにタスクを配置
            due_date = start_date + timedelta(days=days_offset + 3)
            
            task = Task(
                id=f"{project_id}_task_{idx+1:03d}",
                title=task_template["title"],
                description=task_template["description"],
                status=TaskStatus.NOT_STARTED,
                priority=task_template["priority"],
                due_date=due_date,
                estimated_hours=task_template["estimated_hours"],
                tags=task_template["tags"]
            )
            
            tasks.append(task)
        
        return tasks
    
    
    async def _create_milestones_from_template(
        self,
        template_name: str,
        project_id: str,
        start_date: datetime
    ) -> List[Milestone]:
        """テンプレートからマイルストーン生成"""
        
        template = self.milestone_templates.get(template_name, [])
        milestones = []
        
        for idx, milestone_template in enumerate(template):
            target_date = start_date + timedelta(
                days=milestone_template["days_from_start"]
            )
            
            milestone = Milestone(
                id=f"{project_id}_ms_{idx+1:03d}",
                name=milestone_template["name"],
                type=milestone_template["type"],
                target_date=target_date,
                phase=milestone_template["phase"],
                success_criteria=milestone_template["success_criteria"]
            )
            
            milestones.append(milestone)
        
        return milestones
    
    
    def _create_initial_kpis(self, subsidy_type: str) -> List[ProjectKPI]:
        """初期KPI設定"""
        
        kpis = [
            ProjectKPI(
                name="書類完成度",
                current_value=0.0,
                target_value=100.0,
                unit="%",
                trend="stable"
            ),
            ProjectKPI(
                name="品質スコア",
                current_value=0.0,
                target_value=85.0,
                unit="点",
                trend="stable"
            ),
            ProjectKPI(
                name="提出期限までの残日数",
                current_value=30.0,
                target_value=0.0,
                unit="日",
                trend="down"
            ),
            ProjectKPI(
                name="予算消化率",
                current_value=0.0,
                target_value=95.0,
                unit="%",
                trend="up"
            )
        ]
        
        return kpis
    
    
    async def update_task_status(
        self,
        project_id: str,
        task_id: str,
        new_status: TaskStatus,
        actual_hours: Optional[float] = None,
        completion_percentage: Optional[float] = None
    ) -> Task:
        """タスクステータス更新"""
        
        if project_id not in self.projects:
            raise ValueError(f"プロジェクトが見つかりません: {project_id}")
        
        project = self.projects[project_id]
        task = next((t for t in project.tasks if t.id == task_id), None)
        
        if not task:
            raise ValueError(f"タスクが見つかりません: {task_id}")
        
        # ステータス更新
        task.status = new_status
        task.updated_at = datetime.now()
        
        if new_status == TaskStatus.COMPLETED:
            task.completed_at = datetime.now()
            task.completion_percentage = 100.0
        
        if actual_hours is not None:
            task.actual_hours = actual_hours
        
        if completion_percentage is not None:
            task.completion_percentage = completion_percentage
        
        # プロジェクト全体の進捗更新
        await self._update_overall_progress(project_id)
        
        # アラート生成チェック
        await self._check_and_create_alerts(project_id)
        
        logger.info(f"タスクステータス更新: {task_id} -> {new_status.value}")
        return task
    
    
    async def _update_overall_progress(self, project_id: str):
        """プロジェクト全体の進捗更新"""
        
        project = self.projects[project_id]
        
        # タスクベースの進捗計算
        total_tasks = len(project.tasks)
        if total_tasks == 0:
            project.overall_progress = 0.0
            return
        
        completed_tasks = sum(
            1 for task in project.tasks 
            if task.status == TaskStatus.COMPLETED
        )
        
        in_progress_percentage = sum(
            task.completion_percentage / 100
            for task in project.tasks
            if task.status == TaskStatus.IN_PROGRESS
        )
        
        project.overall_progress = (
            (completed_tasks + in_progress_percentage) / total_tasks * 100
        )
        
        # フェーズの自動更新
        await self._update_project_phase(project)
    
    
    async def _update_project_phase(self, project: ProjectProgress):
        """プロジェクトフェーズの更新"""
        
        # マイルストーンベースでフェーズ判定
        completed_milestones = [
            m for m in project.milestones if m.is_completed
        ]
        
        if not completed_milestones:
            project.current_phase = ProjectPhase.PLANNING
            return
        
        latest_milestone = max(
            completed_milestones,
            key=lambda m: m.completed_date or datetime.min
        )
        
        # マイルストーンタイプに基づくフェーズ設定
        phase_map = {
            MilestoneType.DOCUMENT_PREPARATION: ProjectPhase.APPLICATION,
            MilestoneType.APPLICATION_SUBMIT: ProjectPhase.REVIEW,
            MilestoneType.RESULT_NOTIFICATION: ProjectPhase.EXECUTION,
            MilestoneType.PROJECT_END: ProjectPhase.REPORTING,
            MilestoneType.REPORT_SUBMISSION: ProjectPhase.COMPLETED
        }
        
        project.current_phase = phase_map.get(
            latest_milestone.type,
            project.current_phase
        )
    
    
    async def get_project_progress(
        self,
        project_id: str
    ) -> Optional[ProjectProgress]:
        """プロジェクト進捗取得"""
        
        if project_id not in self.projects:
            return None
        
        project = self.projects[project_id]
        
        # 最新の状態に更新
        await self._update_overall_progress(project_id)
        
        # 最近のアクティビティ更新
        project.recent_activities = await self._get_recent_activities(project_id)
        
        return project
    
    
    async def _get_recent_activities(
        self,
        project_id: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """最近のアクティビティ取得"""
        
        project = self.projects[project_id]
        activities = []
        
        # タスクの更新履歴から生成（簡易版）
        for task in sorted(
            project.tasks,
            key=lambda t: t.updated_at,
            reverse=True
        )[:limit]:
            activity = {
                "type": "task_update",
                "timestamp": task.updated_at.isoformat(),
                "title": f"タスク「{task.title}」が更新されました",
                "details": {
                    "task_id": task.id,
                    "status": task.status.value
                }
            }
            activities.append(activity)
        
        return activities
    
    
    async def get_upcoming_deadlines(
        self,
        project_id: Optional[str] = None,
        days_ahead: int = 7
    ) -> List[Dict[str, Any]]:
        """今後の期限取得"""
        
        deadlines = []
        cutoff_date = datetime.now() + timedelta(days=days_ahead)
        
        projects = [self.projects[project_id]] if project_id else self.projects.values()
        
        for project in projects:
            # タスクの期限
            for task in project.tasks:
                if (task.due_date and 
                    task.due_date <= cutoff_date and
                    task.status != TaskStatus.COMPLETED):
                    
                    deadlines.append({
                        "type": "task",
                        "project_id": project.project_id,
                        "project_name": project.project_name,
                        "item_id": task.id,
                        "title": task.title,
                        "due_date": task.due_date.isoformat(),
                        "days_until": (task.due_date - datetime.now()).days,
                        "priority": task.priority.value
                    })
            
            # マイルストーンの期限
            for milestone in project.milestones:
                if (milestone.target_date <= cutoff_date and
                    not milestone.is_completed):
                    
                    deadlines.append({
                        "type": "milestone",
                        "project_id": project.project_id,
                        "project_name": project.project_name,
                        "item_id": milestone.id,
                        "title": milestone.name,
                        "due_date": milestone.target_date.isoformat(),
                        "days_until": (milestone.target_date - datetime.now()).days,
                        "priority": "high"
                    })
        
        # 期限が近い順にソート
        deadlines.sort(key=lambda x: x["due_date"])
        
        return deadlines
    
    
    async def _check_and_create_alerts(self, project_id: str):
        """アラート生成チェック"""
        
        project = self.projects[project_id]
        alerts = []
        
        # 期限超過タスクチェック
        for task in project.tasks:
            if (task.due_date and 
                task.due_date < datetime.now() and
                task.status != TaskStatus.COMPLETED):
                
                alert = ProgressAlert(
                    id=f"alert_{task.id}_{datetime.now().timestamp()}",
                    type="overdue",
                    severity="warning",
                    title=f"タスク期限超過: {task.title}",
                    message=f"タスク「{task.title}」の期限を{(datetime.now() - task.due_date).days}日超過しています",
                    related_items=[task.id]
                )
                alerts.append(alert)
        
        # マイルストーン接近チェック
        for milestone in project.milestones:
            days_until = (milestone.target_date - datetime.now()).days
            if (not milestone.is_completed and 
                0 < days_until <= 7):
                
                alert = ProgressAlert(
                    id=f"alert_{milestone.id}_{datetime.now().timestamp()}",
                    type="milestone_approaching",
                    severity="info",
                    title=f"マイルストーン接近: {milestone.name}",
                    message=f"マイルストーン「{milestone.name}」まであと{days_until}日です",
                    related_items=[milestone.id]
                )
                alerts.append(alert)
        
        # 予算超過チェック
        if project.budget_status:
            if project.budget_status.spent > project.budget_status.total_budget:
                alert = ProgressAlert(
                    id=f"alert_budget_{project_id}_{datetime.now().timestamp()}",
                    type="budget_overrun",
                    severity="critical",
                    title="予算超過",
                    message=f"プロジェクト予算を{project.budget_status.spent - project.budget_status.total_budget:,.0f}円超過しています",
                    related_items=[project_id]
                )
                alerts.append(alert)
        
        # アラートを保存（実装では通知システムと連携）
        for alert in alerts:
            logger.warning(f"アラート生成: {alert.title}")
    
    
    async def generate_progress_summary(
        self,
        project_id: str
    ) -> Dict[str, Any]:
        """進捗サマリー生成"""
        
        project = await self.get_project_progress(project_id)
        if not project:
            return {}
        
        # タスク統計
        task_stats = {
            "total": len(project.tasks),
            "completed": sum(1 for t in project.tasks if t.status == TaskStatus.COMPLETED),
            "in_progress": sum(1 for t in project.tasks if t.status == TaskStatus.IN_PROGRESS),
            "not_started": sum(1 for t in project.tasks if t.status == TaskStatus.NOT_STARTED),
            "overdue": sum(1 for t in project.tasks if t.due_date and t.due_date < datetime.now() and t.status != TaskStatus.COMPLETED)
        }
        
        # マイルストーン統計
        milestone_stats = {
            "total": len(project.milestones),
            "completed": sum(1 for m in project.milestones if m.is_completed),
            "upcoming": sum(1 for m in project.milestones if not m.is_completed and (m.target_date - datetime.now()).days <= 30)
        }
        
        # 時間統計
        total_estimated = sum(t.estimated_hours for t in project.tasks)
        total_actual = sum(t.actual_hours for t in project.tasks)
        
        # KPIサマリー
        kpi_summary = {
            kpi.name: {
                "current": kpi.current_value,
                "target": kpi.target_value,
                "achievement_rate": (kpi.current_value / kpi.target_value * 100) if kpi.target_value > 0 else 0,
                "trend": kpi.trend
            }
            for kpi in project.kpis
        }
        
        summary = {
            "project_info": {
                "id": project.project_id,
                "name": project.project_name,
                "phase": project.current_phase.value,
                "overall_progress": round(project.overall_progress, 1),
                "days_elapsed": (datetime.now() - project.start_date).days,
                "days_remaining": (project.target_end_date - datetime.now()).days
            },
            "task_statistics": task_stats,
            "milestone_statistics": milestone_stats,
            "time_tracking": {
                "estimated_total": total_estimated,
                "actual_total": total_actual,
                "efficiency": round(total_estimated / total_actual * 100, 1) if total_actual > 0 else 100
            },
            "kpi_summary": kpi_summary,
            "health_indicators": {
                "on_schedule": task_stats["overdue"] == 0,
                "budget_healthy": project.budget_status is None or project.budget_status.spent <= project.budget_status.total_budget,
                "team_capacity": len(project.team_members) > 0
            }
        }
        
        return summary
    
    
    async def export_gantt_data(
        self,
        project_id: str
    ) -> List[Dict[str, Any]]:
        """ガントチャート用データエクスポート"""
        
        project = self.projects.get(project_id)
        if not project:
            return []
        
        gantt_data = []
        
        # タスクデータ
        for task in project.tasks:
            gantt_item = {
                "id": task.id,
                "text": task.title,
                "start_date": task.created_at.strftime("%Y-%m-%d"),
                "duration": task.estimated_hours / 8,  # 日数に変換
                "progress": task.completion_percentage / 100,
                "parent": None,
                "type": "task",
                "priority": task.priority.value,
                "assignee": task.assigned_to
            }
            gantt_data.append(gantt_item)
        
        # マイルストーンデータ
        for milestone in project.milestones:
            gantt_item = {
                "id": milestone.id,
                "text": milestone.name,
                "start_date": milestone.target_date.strftime("%Y-%m-%d"),
                "duration": 0,  # マイルストーンは期間なし
                "progress": 1.0 if milestone.is_completed else 0.0,
                "parent": None,
                "type": "milestone",
                "priority": "high"
            }
            gantt_data.append(gantt_item)
        
        return gantt_data