"""
ものづくり補助金 API エンドポイント
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
from ..services.monozukuri_subsidy_service import MonozukuriSubsidyService
from ..middleware.auth_middleware import require_api_key
from ..middleware.rate_limit_middleware import rate_limit

app = Flask(__name__)
CORS(app)

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# サービス初期化
monozukuri_service = MonozukuriSubsidyService()

@app.route('/monozukuri/generate', methods=['POST'])
@require_api_key
@rate_limit(limit=10, window=3600)  # 1時間に10回まで
def generate_monozukuri_application():
    """ものづくり補助金申請書の自動生成"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'リクエストデータが必要です'
            }), 400
        
        simple_input = data.get('simple_input')
        user_id = data.get('user_id')
        
        if not simple_input:
            return jsonify({
                'success': False,
                'error': 'simple_input パラメータが必要です'
            }), 400
        
        logger.info(f"ものづくり補助金申請書生成開始 - User: {user_id}")
        
        # 申請書生成
        result = monozukuri_service.generate_from_simple_input(simple_input)
        
        logger.info(f"申請書生成完了 - 品質スコア: {result['quality_score']}, 採択確率: {result['adoption_probability']}%")
        
        return jsonify({
            'success': True,
            'application_data': result['application_data'],
            'quality_score': result['quality_score'],
            'adoption_probability': result['adoption_probability'],
            'generated_at': result['generated_at'],
            'metadata': {
                'user_id': user_id,
                'subsidy_type': 'monozukuri',
                'generation_method': 'quick_apply'
            }
        })
        
    except ValueError as e:
        logger.error(f"入力値エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'入力値エラー: {str(e)}'
        }), 400
        
    except Exception as e:
        logger.error(f"申請書生成エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': '申請書の生成中にエラーが発生しました'
        }), 500

@app.route('/monozukuri/assess', methods=['POST'])
@require_api_key
@rate_limit(limit=20, window=3600)  # 1時間に20回まで
def assess_monozukuri_application():
    """ものづくり補助金申請の簡易評価"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'リクエストデータが必要です'
            }), 400
        
        simple_input = data.get('simple_input')
        
        if not simple_input:
            return jsonify({
                'success': False,
                'error': 'simple_input パラメータが必要です'
            }), 400
        
        # 簡易評価実行
        assessment = monozukuri_service.get_quick_assessment(simple_input)
        
        return jsonify({
            'success': True,
            **assessment
        })
        
    except Exception as e:
        logger.error(f"簡易評価エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': '評価中にエラーが発生しました'
        }), 500

@app.route('/monozukuri/optimize', methods=['POST'])
@require_api_key
@rate_limit(limit=15, window=3600)  # 1時間に15回まで
def optimize_monozukuri_application():
    """申請書の最適化"""
    try:
        data = request.get_json()
        
        current_data = data.get('current_data')
        updates = data.get('updates')
        
        if not current_data or not updates:
            return jsonify({
                'success': False,
                'error': 'current_data と updates パラメータが必要です'
            }), 400
        
        # 最適化処理
        optimized_data = monozukuri_service._optimize_content_with_updates(current_data, updates)
        quality_score = monozukuri_service._calculate_quality_score(optimized_data)
        
        return jsonify({
            'success': True,
            'optimized_data': optimized_data,
            'quality_score': quality_score,
            'optimized_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"最適化エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': '最適化中にエラーが発生しました'
        }), 500

@app.route('/monozukuri/success-patterns/<industry>', methods=['GET'])
@require_api_key
@rate_limit(limit=30, window=3600)  # 1時間に30回まで
def get_success_patterns(industry):
    """業種別成功パターンの取得"""
    try:
        patterns = monozukuri_service._get_industry_success_patterns(industry)
        
        return jsonify({
            'success': True,
            'industry': industry,
            'patterns': patterns,
            'retrieved_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"成功パターン取得エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'データの取得中にエラーが発生しました'
        }), 500

@app.route('/monozukuri/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({
        'status': 'healthy',
        'service': 'monozukuri-subsidy-api',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.0'
    })

# エラーハンドラー
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'error': 'エンドポイントが見つかりません'
    }), 404

@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({
        'success': False,
        'error': 'レート制限に達しました。しばらく後に再試行してください。'
    }), 429

@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        'success': False,
        'error': 'サーバー内部エラーが発生しました'
    }), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )