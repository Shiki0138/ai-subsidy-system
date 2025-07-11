"""
PDF プレビューサービス
決済前に品質確認できるプレビュー機能
"""

from typing import Dict, List, Optional, Any
from dataclasses import dataclass
import asyncio
import logging
from datetime import datetime
from pathlib import Path
import hashlib

logger = logging.getLogger(__name__)


@dataclass
class PreviewConfig:
    """プレビュー設定"""
    max_pages: int = 3  # プレビュー可能ページ数
    watermark: bool = True  # 透かし入り
    blur_sections: List[str] = None  # ぼかし処理するセクション
    sample_ratio: float = 0.3  # 表示する内容の割合
    
    def __post_init__(self):
        if self.blur_sections is None:
            self.blur_sections = ["financial_details", "personal_info"]


class PdfPreviewService:
    """PDFプレビューサービス"""
    
    def __init__(self, output_dir: str = "output/previews"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.preview_cache = {}  # メモリキャッシュ
        
    async def generate_preview(
        self,
        application_id: str,
        document_type: str,
        full_content: Dict[str, Any],
        config: Optional[PreviewConfig] = None
    ) -> Dict[str, Any]:
        """
        プレビュー生成
        
        Returns:
            {
                "preview_id": "prev_xxx",
                "preview_url": "/api/preview/xxx",
                "pages": 3,
                "watermarked": true,
                "expires_at": "2025-06-21T00:00:00Z",
                "quality_indicators": {
                    "completeness": 95,
                    "ai_score": 88,
                    "estimated_success_rate": 72
                }
            }
        """
        try:
            if config is None:
                config = PreviewConfig()
                
            preview_id = self._generate_preview_id(application_id, document_type)
            
            # キャッシュチェック
            if preview_id in self.preview_cache:
                logger.info(f"プレビューキャッシュヒット: {preview_id}")
                return self.preview_cache[preview_id]
            
            # プレビューコンテンツ生成
            preview_content = await self._create_preview_content(
                full_content, config
            )
            
            # 品質指標の計算
            quality_indicators = self._calculate_quality_indicators(
                full_content, preview_content
            )
            
            # プレビューファイル保存
            preview_path = await self._save_preview(
                preview_id, preview_content, config
            )
            
            result = {
                "preview_id": preview_id,
                "preview_url": f"/api/preview/{preview_id}",
                "pages": config.max_pages,
                "watermarked": config.watermark,
                "expires_at": "2025-06-21T00:00:00Z",  # 24時間後
                "quality_indicators": quality_indicators,
                "preview_path": str(preview_path)
            }
            
            # キャッシュに保存
            self.preview_cache[preview_id] = result
            
            logger.info(f"プレビュー生成完了: {preview_id}")
            return result
            
        except Exception as e:
            logger.error(f"プレビュー生成エラー: {str(e)}")
            raise
    
    async def _create_preview_content(
        self,
        full_content: Dict[str, Any],
        config: PreviewConfig
    ) -> Dict[str, Any]:
        """プレビューコンテンツ作成"""
        preview_content = {}
        
        # 基本情報は表示
        preview_content["basic_info"] = full_content.get("basic_info", {})
        
        # 詳細セクションは部分表示
        for section, content in full_content.items():
            if section in config.blur_sections:
                # ぼかし処理
                preview_content[section] = self._blur_content(content)
            else:
                # 部分表示
                preview_content[section] = self._partial_content(
                    content, config.sample_ratio
                )
        
        # 透かし情報追加
        if config.watermark:
            preview_content["watermark"] = {
                "text": "プレビュー版 - 購入後に完全版をダウンロード",
                "opacity": 0.3,
                "position": "diagonal"
            }
        
        return preview_content
    
    def _blur_content(self, content: Any) -> Any:
        """コンテンツのぼかし処理"""
        if isinstance(content, str):
            # 文字列の場合、一部を伏字に
            visible_length = max(len(content) // 4, 10)
            return content[:visible_length] + "..." + "█" * 20
        elif isinstance(content, dict):
            # 辞書の場合、再帰的に処理
            return {k: self._blur_content(v) for k, v in content.items()}
        elif isinstance(content, list):
            # リストの場合、最初の要素のみ表示
            return [self._blur_content(content[0])] if content else []
        else:
            # 数値等はそのまま
            return content
    
    def _partial_content(self, content: Any, ratio: float) -> Any:
        """コンテンツの部分表示"""
        if isinstance(content, str):
            # 文字列の場合、指定割合だけ表示
            visible_length = int(len(content) * ratio)
            if visible_length < len(content):
                return content[:visible_length] + "\n\n[... 続きは購入後にご覧いただけます ...]"
            return content
        elif isinstance(content, list):
            # リストの場合、指定割合の要素を表示
            visible_count = max(int(len(content) * ratio), 1)
            if visible_count < len(content):
                return content[:visible_count] + [
                    f"... 他{len(content) - visible_count}項目は購入後にご覧いただけます"
                ]
            return content
        else:
            return content
    
    def _calculate_quality_indicators(
        self,
        full_content: Dict[str, Any],
        preview_content: Dict[str, Any]
    ) -> Dict[str, float]:
        """品質指標の計算"""
        # 完全性スコア（必須項目の充足率）
        required_sections = [
            "company_overview", "business_plan", "financial_plan",
            "implementation_schedule", "expected_effects"
        ]
        filled_sections = sum(
            1 for section in required_sections 
            if full_content.get(section)
        )
        completeness = (filled_sections / len(required_sections)) * 100
        
        # AIスコア（文章の品質）
        ai_score = self._calculate_ai_score(full_content)
        
        # 推定採択率（過去データから算出）
        estimated_success_rate = self._estimate_success_rate(
            completeness, ai_score
        )
        
        return {
            "completeness": round(completeness, 1),
            "ai_score": round(ai_score, 1),
            "estimated_success_rate": round(estimated_success_rate, 1)
        }
    
    def _calculate_ai_score(self, content: Dict[str, Any]) -> float:
        """AI品質スコア計算（モック）"""
        # 実際にはAIモデルで評価
        base_score = 80.0
        
        # 文章量ボーナス
        total_length = sum(
            len(str(v)) for v in content.values() 
            if isinstance(v, (str, list))
        )
        length_bonus = min(total_length / 10000 * 10, 10)
        
        # 構造化ボーナス
        structure_bonus = len(content.keys()) * 0.5
        
        return min(base_score + length_bonus + structure_bonus, 100)
    
    def _estimate_success_rate(
        self, 
        completeness: float, 
        ai_score: float
    ) -> float:
        """採択率推定（モック）"""
        # 実際には過去データから機械学習モデルで予測
        base_rate = 30.0  # 基準採択率
        
        # 完全性による調整
        completeness_factor = completeness / 100 * 1.5
        
        # AI品質による調整
        ai_factor = ai_score / 100 * 1.2
        
        estimated_rate = base_rate * completeness_factor * ai_factor
        
        # 現実的な範囲に収める
        return max(min(estimated_rate, 85), 15)
    
    def _generate_preview_id(
        self, 
        application_id: str, 
        document_type: str
    ) -> str:
        """プレビューID生成"""
        data = f"{application_id}:{document_type}:{datetime.now().isoformat()}"
        hash_value = hashlib.sha256(data.encode()).hexdigest()[:12]
        return f"prev_{hash_value}"
    
    async def _save_preview(
        self,
        preview_id: str,
        content: Dict[str, Any],
        config: PreviewConfig
    ) -> Path:
        """プレビューファイル保存"""
        preview_dir = self.output_dir / preview_id
        preview_dir.mkdir(exist_ok=True)
        
        # プレビューHTML生成
        html_content = self._generate_preview_html(content, config)
        
        html_path = preview_dir / "preview.html"
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        # メタデータ保存
        import json
        meta_path = preview_dir / "metadata.json"
        with open(meta_path, 'w', encoding='utf-8') as f:
            json.dump({
                "preview_id": preview_id,
                "created_at": datetime.now().isoformat(),
                "config": {
                    "max_pages": config.max_pages,
                    "watermark": config.watermark,
                    "sample_ratio": config.sample_ratio
                }
            }, f, ensure_ascii=False, indent=2)
        
        return html_path
    
    def _generate_preview_html(
        self,
        content: Dict[str, Any],
        config: PreviewConfig
    ) -> str:
        """プレビューHTML生成"""
        html = f"""
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>申請書プレビュー</title>
    <style>
        body {{
            font-family: 'Noto Sans JP', sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            position: relative;
        }}
        .watermark {{
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-45deg);
            font-size: 48px;
            color: rgba(0,0,0,0.1);
            z-index: -1;
            white-space: nowrap;
        }}
        .preview-notice {{
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            margin-bottom: 30px;
            border-radius: 5px;
        }}
        .blurred {{
            filter: blur(5px);
            user-select: none;
        }}
        .quality-badge {{
            display: inline-block;
            padding: 5px 10px;
            margin: 5px;
            border-radius: 3px;
            font-size: 14px;
        }}
        .high-quality {{ background: #d4edda; color: #155724; }}
        .medium-quality {{ background: #fff3cd; color: #856404; }}
        .low-quality {{ background: #f8d7da; color: #721c24; }}
    </style>
</head>
<body>
"""
        
        if config.watermark:
            html += '<div class="watermark">プレビュー版</div>'
        
        html += """
    <div class="preview-notice">
        <h3>🔍 これはプレビュー版です</h3>
        <p>完全版では全ての内容が表示され、PDFダウンロードが可能になります。</p>
        <button onclick="window.parent.postMessage({action: 'purchase'}, '*')">
            完全版を購入（¥3,980）
        </button>
    </div>
"""
        
        # 品質指標表示
        if "quality_indicators" in content:
            qi = content["quality_indicators"]
            html += '<div class="quality-indicators">'
            
            # 完全性
            completeness = qi.get("completeness", 0)
            if completeness >= 90:
                badge_class = "high-quality"
            elif completeness >= 70:
                badge_class = "medium-quality"
            else:
                badge_class = "low-quality"
            html += f'<span class="quality-badge {badge_class}">完全性: {completeness}%</span>'
            
            # AIスコア
            ai_score = qi.get("ai_score", 0)
            if ai_score >= 85:
                badge_class = "high-quality"
            elif ai_score >= 70:
                badge_class = "medium-quality"
            else:
                badge_class = "low-quality"
            html += f'<span class="quality-badge {badge_class}">AI品質: {ai_score}%</span>'
            
            # 推定採択率
            success_rate = qi.get("estimated_success_rate", 0)
            html += f'<span class="quality-badge medium-quality">推定採択率: {success_rate}%</span>'
            
            html += '</div><hr>'
        
        # コンテンツ表示
        for section, data in content.items():
            if section in ["watermark", "quality_indicators"]:
                continue
                
            html += f'<section class="preview-section">'
            html += f'<h2>{section.replace("_", " ").title()}</h2>'
            
            if isinstance(data, str):
                if "█" in data:  # ぼかし処理されている
                    html += f'<div class="blurred">{data}</div>'
                else:
                    html += f'<div>{data}</div>'
            elif isinstance(data, dict):
                html += '<dl>'
                for key, value in data.items():
                    html += f'<dt>{key}:</dt>'
                    if isinstance(value, str) and "█" in value:
                        html += f'<dd class="blurred">{value}</dd>'
                    else:
                        html += f'<dd>{value}</dd>'
                html += '</dl>'
            elif isinstance(data, list):
                html += '<ul>'
                for item in data:
                    if isinstance(item, str) and "..." in item:
                        html += f'<li style="color: #999;">{item}</li>'
                    else:
                        html += f'<li>{item}</li>'
                html += '</ul>'
            
            html += '</section><hr>'
        
        html += """
    <div style="text-align: center; margin-top: 50px;">
        <button onclick="window.parent.postMessage({action: 'purchase'}, '*')" 
                style="padding: 15px 30px; font-size: 18px; background: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer;">
            完全版を購入してPDFをダウンロード
        </button>
    </div>
</body>
</html>
"""
        return html