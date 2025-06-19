"""
AI パフォーマンス・メトリクス収集システム
AI サービスの利用状況、パフォーマンス、コストを追跡
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from datetime import datetime, timedelta
import json
import asyncio
import logging
from collections import defaultdict, deque
import statistics

logger = logging.getLogger(__name__)


@dataclass
class RequestMetrics:
    """リクエストメトリクス"""
    request_id: str
    user_id: str
    task_type: str
    provider: str
    model_used: str
    processing_time: float
    token_usage: Dict[str, int]
    cost: float
    quality_score: float
    success: bool
    error_type: Optional[str] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class PerformanceStats:
    """パフォーマンス統計"""
    total_requests: int
    success_rate: float
    avg_processing_time: float
    avg_quality_score: float
    total_cost: float
    error_rate: float
    provider_breakdown: Dict[str, int]
    task_type_breakdown: Dict[str, int]


@dataclass
class UsageAnalytics:
    """使用分析"""
    hourly_usage: Dict[int, int]
    daily_usage: Dict[str, int]
    user_activity: Dict[str, int]
    popular_tasks: Dict[str, int]
    peak_hours: List[int]
    cost_trends: Dict[str, float]


class MetricsCollector:
    """メトリクス収集・分析システム"""
    
    def __init__(self, max_history: int = 10000):
        """
        初期化
        
        Args:
            max_history: 保持する最大履歴数
        """
        self.max_history = max_history
        self.metrics_history: deque = deque(maxlen=max_history)
        
        # リアルタイム集計用
        self.real_time_stats = {
            'requests_per_minute': deque(maxlen=60),
            'errors_per_minute': deque(maxlen=60),
            'avg_response_time': deque(maxlen=100),
            'current_hour_requests': 0,
            'current_hour_start': datetime.now().replace(minute=0, second=0, microsecond=0)
        }
        
        # アラート設定
        self.alert_thresholds = {
            'error_rate': 0.1,  # 10%
            'avg_response_time': 10.0,  # 10秒
            'cost_per_hour': 100.0,  # $100/時間
            'quality_score_drop': 20.0  # 20ポイント低下
        }
        
        # アラート履歴
        self.alerts = deque(maxlen=1000)

    async def record_request(self, request, response) -> None:
        """
        リクエスト・レスポンスの記録
        
        Args:
            request: AIRequest オブジェクト
            response: AIResponse オブジェクト
        """
        try:
            # メトリクス作成
            metrics = RequestMetrics(
                request_id=request.request_id,
                user_id=request.user_id,
                task_type=request.task_type,
                provider=response.provider or "unknown",
                model_used=response.metadata.get('model', 'unknown'),
                processing_time=response.processing_time,
                token_usage=response.metadata.get('usage', {}),
                cost=response.cost,
                quality_score=response.quality_score,
                success=response.success,
                error_type=response.error if not response.success else None,
                timestamp=datetime.now()
            )
            
            # 履歴に追加
            self.metrics_history.append(metrics)
            
            # リアルタイム統計更新
            await self._update_real_time_stats(metrics)
            
            # アラートチェック
            await self._check_alerts(metrics)
            
            logger.info(f"メトリクス記録完了: {request.request_id}")
            
        except Exception as e:
            logger.error(f"メトリクス記録エラー: {str(e)}")

    async def get_performance_stats(
        self,
        time_range: timedelta = timedelta(hours=24)
    ) -> PerformanceStats:
        """
        パフォーマンス統計取得
        
        Args:
            time_range: 集計期間
            
        Returns:
            PerformanceStats: パフォーマンス統計
        """
        try:
            cutoff_time = datetime.now() - time_range
            recent_metrics = [
                m for m in self.metrics_history 
                if m.timestamp >= cutoff_time
            ]
            
            if not recent_metrics:
                return self._empty_performance_stats()
            
            # 基本統計
            total_requests = len(recent_metrics)
            successful_requests = [m for m in recent_metrics if m.success]
            success_rate = len(successful_requests) / total_requests
            
            # 処理時間統計
            processing_times = [m.processing_time for m in recent_metrics]
            avg_processing_time = statistics.mean(processing_times)
            
            # 品質スコア統計
            quality_scores = [m.quality_score for m in successful_requests if m.quality_score > 0]
            avg_quality_score = statistics.mean(quality_scores) if quality_scores else 0
            
            # コスト統計
            total_cost = sum(m.cost for m in recent_metrics)
            
            # エラー率
            error_rate = 1 - success_rate
            
            # プロバイダー別内訳
            provider_breakdown = defaultdict(int)
            for m in recent_metrics:
                provider_breakdown[m.provider] += 1
            
            # タスクタイプ別内訳
            task_type_breakdown = defaultdict(int)
            for m in recent_metrics:
                task_type_breakdown[m.task_type] += 1
            
            return PerformanceStats(
                total_requests=total_requests,
                success_rate=round(success_rate, 3),
                avg_processing_time=round(avg_processing_time, 3),
                avg_quality_score=round(avg_quality_score, 2),
                total_cost=round(total_cost, 6),
                error_rate=round(error_rate, 3),
                provider_breakdown=dict(provider_breakdown),
                task_type_breakdown=dict(task_type_breakdown)
            )
            
        except Exception as e:
            logger.error(f"パフォーマンス統計取得エラー: {str(e)}")
            return self._empty_performance_stats()

    async def get_usage_analytics(
        self,
        time_range: timedelta = timedelta(days=7)
    ) -> UsageAnalytics:
        """
        使用分析取得
        
        Args:
            time_range: 分析期間
            
        Returns:
            UsageAnalytics: 使用分析結果
        """
        try:
            cutoff_time = datetime.now() - time_range
            recent_metrics = [
                m for m in self.metrics_history 
                if m.timestamp >= cutoff_time
            ]
            
            if not recent_metrics:
                return self._empty_usage_analytics()
            
            # 時間別使用量
            hourly_usage = defaultdict(int)
            daily_usage = defaultdict(int)
            user_activity = defaultdict(int)
            popular_tasks = defaultdict(int)
            daily_costs = defaultdict(float)
            
            for m in recent_metrics:
                hour = m.timestamp.hour
                day = m.timestamp.strftime('%Y-%m-%d')
                
                hourly_usage[hour] += 1
                daily_usage[day] += 1
                user_activity[m.user_id] += 1
                popular_tasks[m.task_type] += 1
                daily_costs[day] += m.cost
            
            # ピーク時間帯特定
            peak_hours = sorted(hourly_usage.keys(), key=lambda h: hourly_usage[h], reverse=True)[:3]
            
            return UsageAnalytics(
                hourly_usage=dict(hourly_usage),
                daily_usage=dict(daily_usage),
                user_activity=dict(user_activity),
                popular_tasks=dict(popular_tasks),
                peak_hours=peak_hours,
                cost_trends=dict(daily_costs)
            )
            
        except Exception as e:
            logger.error(f"使用分析取得エラー: {str(e)}")
            return self._empty_usage_analytics()

    async def get_quality_trends(
        self,
        time_range: timedelta = timedelta(hours=24)
    ) -> Dict[str, Any]:
        """
        品質トレンド分析
        
        Args:
            time_range: 分析期間
            
        Returns:
            Dict: 品質トレンド情報
        """
        try:
            cutoff_time = datetime.now() - time_range
            recent_metrics = [
                m for m in self.metrics_history 
                if m.timestamp >= cutoff_time and m.success and m.quality_score > 0
            ]
            
            if not recent_metrics:
                return {"error": "データ不足"}
            
            # 時系列品質データ
            hourly_quality = defaultdict(list)
            for m in recent_metrics:
                hour_key = m.timestamp.strftime('%Y-%m-%d %H:00')
                hourly_quality[hour_key].append(m.quality_score)
            
            # 時間別平均品質スコア
            hourly_avg_quality = {
                hour: statistics.mean(scores) 
                for hour, scores in hourly_quality.items()
            }
            
            # プロバイダー別品質比較
            provider_quality = defaultdict(list)
            for m in recent_metrics:
                provider_quality[m.provider].append(m.quality_score)
            
            provider_avg_quality = {
                provider: statistics.mean(scores)
                for provider, scores in provider_quality.items()
            }
            
            # タスクタイプ別品質
            task_quality = defaultdict(list)
            for m in recent_metrics:
                task_quality[m.task_type].append(m.quality_score)
            
            task_avg_quality = {
                task: statistics.mean(scores)
                for task, scores in task_quality.items()
            }
            
            # 品質改善トレンド
            recent_scores = [m.quality_score for m in recent_metrics[-100:]]
            trend = "improving" if len(recent_scores) > 1 and recent_scores[-1] > recent_scores[0] else "stable"
            
            return {
                "hourly_avg_quality": hourly_avg_quality,
                "provider_quality_comparison": provider_avg_quality,
                "task_type_quality": task_avg_quality,
                "overall_trend": trend,
                "quality_variance": statistics.pvariance(recent_scores) if len(recent_scores) > 1 else 0,
                "sample_size": len(recent_metrics)
            }
            
        except Exception as e:
            logger.error(f"品質トレンド分析エラー: {str(e)}")
            return {"error": str(e)}

    async def get_cost_analysis(
        self,
        time_range: timedelta = timedelta(days=30)
    ) -> Dict[str, Any]:
        """
        コスト分析
        
        Args:
            time_range: 分析期間
            
        Returns:
            Dict: コスト分析結果
        """
        try:
            cutoff_time = datetime.now() - time_range
            recent_metrics = [
                m for m in self.metrics_history 
                if m.timestamp >= cutoff_time
            ]
            
            if not recent_metrics:
                return {"error": "データ不足"}
            
            total_cost = sum(m.cost for m in recent_metrics)
            total_requests = len(recent_metrics)
            avg_cost_per_request = total_cost / total_requests if total_requests > 0 else 0
            
            # プロバイダー別コスト
            provider_costs = defaultdict(float)
            provider_requests = defaultdict(int)
            for m in recent_metrics:
                provider_costs[m.provider] += m.cost
                provider_requests[m.provider] += 1
            
            provider_avg_costs = {
                provider: provider_costs[provider] / provider_requests[provider]
                for provider in provider_costs.keys()
            }
            
            # 日別コストトレンド
            daily_costs = defaultdict(float)
            for m in recent_metrics:
                day = m.timestamp.strftime('%Y-%m-%d')
                daily_costs[day] += m.cost
            
            # 時間別コスト
            hourly_costs = defaultdict(float)
            for m in recent_metrics:
                hour = m.timestamp.hour
                hourly_costs[hour] += m.cost
            
            # 最も高コストなタスクタイプ
            task_costs = defaultdict(float)
            task_counts = defaultdict(int)
            for m in recent_metrics:
                task_costs[m.task_type] += m.cost
                task_counts[m.task_type] += 1
            
            expensive_tasks = sorted(
                task_costs.items(), 
                key=lambda x: x[1], 
                reverse=True
            )[:5]
            
            return {
                "total_cost": round(total_cost, 6),
                "avg_cost_per_request": round(avg_cost_per_request, 6),
                "provider_total_costs": dict(provider_costs),
                "provider_avg_costs": provider_avg_costs,
                "daily_cost_trend": dict(daily_costs),
                "hourly_cost_distribution": dict(hourly_costs),
                "expensive_task_types": expensive_tasks,
                "cost_efficiency": {
                    "cost_per_success": round(
                        total_cost / len([m for m in recent_metrics if m.success]),
                        6
                    ) if any(m.success for m in recent_metrics) else 0
                }
            }
            
        except Exception as e:
            logger.error(f"コスト分析エラー: {str(e)}")
            return {"error": str(e)}

    async def get_real_time_dashboard(self) -> Dict[str, Any]:
        """
        リアルタイムダッシュボード情報
        
        Returns:
            Dict: ダッシュボード情報
        """
        try:
            current_time = datetime.now()
            
            # 現在の分間リクエスト数
            current_minute_requests = len([
                m for m in self.metrics_history 
                if m.timestamp >= current_time - timedelta(minutes=1)
            ])
            
            # 現在時間のリクエスト数
            current_hour_start = current_time.replace(minute=0, second=0, microsecond=0)
            current_hour_requests = len([
                m for m in self.metrics_history 
                if m.timestamp >= current_hour_start
            ])
            
            # 直近の平均応答時間
            recent_times = [
                m.processing_time for m in list(self.metrics_history)[-10:]
                if m.processing_time > 0
            ]
            avg_response_time = statistics.mean(recent_times) if recent_times else 0
            
            # 直近のエラー率
            recent_requests = list(self.metrics_history)[-50:]
            recent_error_rate = len([
                m for m in recent_requests if not m.success
            ]) / len(recent_requests) if recent_requests else 0
            
            # システム健全性
            health_status = "healthy"
            if recent_error_rate > self.alert_thresholds['error_rate']:
                health_status = "warning"
            if recent_error_rate > 0.2 or avg_response_time > 15:
                health_status = "critical"
            
            return {
                "current_minute_requests": current_minute_requests,
                "current_hour_requests": current_hour_requests,
                "avg_response_time": round(avg_response_time, 3),
                "error_rate": round(recent_error_rate, 3),
                "health_status": health_status,
                "active_providers": list(set(
                    m.provider for m in list(self.metrics_history)[-10:]
                )),
                "total_metrics_recorded": len(self.metrics_history),
                "alerts_count": len(self.alerts)
            }
            
        except Exception as e:
            logger.error(f"リアルタイムダッシュボード取得エラー: {str(e)}")
            return {"error": str(e)}

    async def _update_real_time_stats(self, metrics: RequestMetrics) -> None:
        """リアルタイム統計更新"""
        try:
            current_time = datetime.now()
            
            # 分間リクエスト数更新
            minute_key = current_time.strftime('%H:%M')
            self.real_time_stats['requests_per_minute'].append((minute_key, 1))
            
            # エラー分間カウント
            if not metrics.success:
                self.real_time_stats['errors_per_minute'].append((minute_key, 1))
            
            # 平均応答時間更新
            self.real_time_stats['avg_response_time'].append(metrics.processing_time)
            
            # 時間別リクエスト数更新
            hour_start = current_time.replace(minute=0, second=0, microsecond=0)
            if hour_start != self.real_time_stats['current_hour_start']:
                self.real_time_stats['current_hour_requests'] = 0
                self.real_time_stats['current_hour_start'] = hour_start
            
            self.real_time_stats['current_hour_requests'] += 1
            
        except Exception as e:
            logger.error(f"リアルタイム統計更新エラー: {str(e)}")

    async def _check_alerts(self, metrics: RequestMetrics) -> None:
        """アラートチェック"""
        try:
            alerts_triggered = []
            
            # エラー率チェック
            recent_requests = list(self.metrics_history)[-20:]
            if len(recent_requests) >= 10:
                error_rate = len([m for m in recent_requests if not m.success]) / len(recent_requests)
                if error_rate > self.alert_thresholds['error_rate']:
                    alerts_triggered.append({
                        "type": "high_error_rate",
                        "value": error_rate,
                        "threshold": self.alert_thresholds['error_rate'],
                        "timestamp": datetime.now()
                    })
            
            # 応答時間チェック
            if metrics.processing_time > self.alert_thresholds['avg_response_time']:
                alerts_triggered.append({
                    "type": "slow_response",
                    "value": metrics.processing_time,
                    "threshold": self.alert_thresholds['avg_response_time'],
                    "timestamp": datetime.now()
                })
            
            # 品質スコア低下チェック
            if metrics.quality_score > 0:
                recent_quality_scores = [
                    m.quality_score for m in list(self.metrics_history)[-10:]
                    if m.quality_score > 0
                ]
                if len(recent_quality_scores) >= 5:
                    avg_recent_quality = statistics.mean(recent_quality_scores)
                    if metrics.quality_score < avg_recent_quality - self.alert_thresholds['quality_score_drop']:
                        alerts_triggered.append({
                            "type": "quality_drop",
                            "value": metrics.quality_score,
                            "average": avg_recent_quality,
                            "timestamp": datetime.now()
                        })
            
            # アラートを記録
            for alert in alerts_triggered:
                self.alerts.append(alert)
                logger.warning(f"アラート発生: {alert}")
                
        except Exception as e:
            logger.error(f"アラートチェックエラー: {str(e)}")

    def _empty_performance_stats(self) -> PerformanceStats:
        """空のパフォーマンス統計"""
        return PerformanceStats(
            total_requests=0,
            success_rate=0.0,
            avg_processing_time=0.0,
            avg_quality_score=0.0,
            total_cost=0.0,
            error_rate=0.0,
            provider_breakdown={},
            task_type_breakdown={}
        )

    def _empty_usage_analytics(self) -> UsageAnalytics:
        """空の使用分析"""
        return UsageAnalytics(
            hourly_usage={},
            daily_usage={},
            user_activity={},
            popular_tasks={},
            peak_hours=[],
            cost_trends={}
        )

    async def export_metrics(
        self,
        format_type: str = "json",
        time_range: Optional[timedelta] = None
    ) -> str:
        """
        メトリクスエクスポート
        
        Args:
            format_type: エクスポート形式
            time_range: エクスポート期間
            
        Returns:
            str: エクスポートされたデータ
        """
        try:
            metrics_to_export = self.metrics_history
            
            if time_range:
                cutoff_time = datetime.now() - time_range
                metrics_to_export = [
                    m for m in self.metrics_history 
                    if m.timestamp >= cutoff_time
                ]
            
            if format_type.lower() == "json":
                return json.dumps(
                    [asdict(m) for m in metrics_to_export],
                    default=str,
                    ensure_ascii=False,
                    indent=2
                )
            else:
                raise ValueError(f"Unsupported format: {format_type}")
                
        except Exception as e:
            logger.error(f"メトリクスエクスポートエラー: {str(e)}")
            return json.dumps({"error": str(e)})