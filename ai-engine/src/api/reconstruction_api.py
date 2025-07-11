"""
事業再構築補助金 API エンドポイント
最大1億5000万円の大型補助金に対応
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
from datetime import datetime
from ..services.reconstruction_subsidy_service import ReconstructionSubsidyService
from ..middleware.auth_middleware import require_api_key
from ..middleware.rate_limit_middleware import rate_limit

app = Flask(__name__)
CORS(app)

# ログ設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# サービス初期化
reconstruction_service = ReconstructionSubsidyService()

@app.route('/reconstruction/check-eligibility', methods=['POST'])
@require_api_key
@rate_limit(limit=20, window=3600)  # 1時間に20回まで
def check_eligibility():
    """事業再構築補助金の申請資格をチェック"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'リクエストデータが必要です'
            }), 400
        
        company_data = data.get('company_data')
        user_id = data.get('user_id')
        
        if not company_data:
            return jsonify({
                'success': False,
                'error': 'company_data パラメータが必要です'
            }), 400
        
        logger.info(f"申請資格チェック開始 - User: {user_id}")
        
        # 申請資格チェック
        result = reconstruction_service.check_eligibility(company_data)
        
        logger.info(f"申請資格チェック完了 - 申請可能: {result.get('eligible', False)}")
        
        return jsonify({
            'success': True,
            **result
        })
        
    except ValueError as e:
        logger.error(f"入力値エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'入力値エラー: {str(e)}'
        }), 400
        
    except Exception as e:
        logger.error(f"申請資格チェックエラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': '申請資格の確認中にエラーが発生しました'
        }), 500

@app.route('/reconstruction/quick-assessment', methods=['POST'])
@require_api_key
@rate_limit(limit=30, window=3600)  # 1時間に30回まで
def quick_assessment():
    """簡易評価（問い合わせ段階での事前評価）"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'リクエストデータが必要です'
            }), 400
        
        basic_info = data.get('basic_info')
        user_id = data.get('user_id')
        
        if not basic_info:
            return jsonify({
                'success': False,
                'error': 'basic_info パラメータが必要です'
            }), 400
        
        logger.info(f"簡易評価開始 - User: {user_id}")
        
        # 簡易評価実行
        assessment = reconstruction_service.generate_quick_assessment(basic_info)
        
        logger.info(f"簡易評価完了 - タイプ: {assessment.get('assessment_type')}")
        
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

@app.route('/reconstruction/generate-comprehensive', methods=['POST'])
@require_api_key
@rate_limit(limit=5, window=3600)  # 1時間に5回まで（重い処理のため）
def generate_comprehensive_application():
    """包括的な事業再構築申請書の生成"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'リクエストデータが必要です'
            }), 400
        
        application_data = data.get('application_data')
        user_id = data.get('user_id')
        
        if not application_data:
            return jsonify({
                'success': False,
                'error': 'application_data パラメータが必要です'
            }), 400
        
        logger.info(f"包括的申請書生成開始 - User: {user_id}")
        
        # 申請書生成
        result = reconstruction_service.generate_comprehensive_application(application_data)
        
        if result.get('success') == False:
            return jsonify(result), 400
        
        logger.info(f"申請書生成完了 - 品質スコア: {result.get('quality_score')}, 採択確率: {result.get('adoption_probability')}%")
        
        return jsonify({
            'success': True,
            **result
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

@app.route('/reconstruction/quality-check', methods=['POST'])
@require_api_key
@rate_limit(limit=15, window=3600)  # 1時間に15回まで
def quality_check():
    """申請書の品質チェック"""
    try:
        data = request.get_json()
        
        application_data = data.get('application_data')
        user_id = data.get('user_id')
        
        if not application_data:
            return jsonify({
                'success': False,
                'error': 'application_data パラメータが必要です'
            }), 400
        
        # 品質分析
        quality_report = reconstruction_service.quality_analyzer.analyze_document(application_data)
        
        # 改善提案の生成
        improvement_suggestions = reconstruction_service._generate_improvement_recommendations(quality_report)
        
        return jsonify({
            'success': True,
            'overall_score': quality_report['overall_score'],
            'section_scores': {
                'completeness': quality_report.get('completeness_score', 0),
                'clarity': quality_report.get('clarity_score', 0),
                'feasibility': quality_report.get('feasibility_score', 0),
                'innovation': quality_report.get('innovation_score', 0)
            },
            'improvement_suggestions': improvement_suggestions,
            'analyzed_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"品質チェックエラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': '品質チェック中にエラーが発生しました'
        }), 500

@app.route('/reconstruction/optimize', methods=['POST'])
@require_api_key
@rate_limit(limit=10, window=3600)  # 1時間に10回まで
def optimize_application():
    """申請書の最適化"""
    try:
        data = request.get_json()
        
        current_data = data.get('current_data')
        updates = data.get('updates')
        user_id = data.get('user_id')
        
        if not current_data or not updates:
            return jsonify({
                'success': False,
                'error': 'current_data と updates パラメータが必要です'
            }), 400
        
        # 最適化処理
        optimized_data = reconstruction_service._optimize_content_with_updates(current_data, updates)
        quality_score = reconstruction_service._calculate_quality_score(optimized_data)
        
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

@app.route('/reconstruction/industry-insights/<industry>', methods=['GET'])
@require_api_key
@rate_limit(limit=50, window=3600)  # 1時間に50回まで
def get_industry_insights(industry):
    """業界別のインサイトとトレンド情報"""
    try:
        # 業界別の成功パターンとトレンドを取得
        insights = {
            'industry': industry,
            'market_trends': reconstruction_service._get_market_trends(industry),
            'common_reconstruction_types': reconstruction_service._get_common_reconstruction_types(industry),
            'success_factors': reconstruction_service._get_industry_success_factors(industry),
            'typical_challenges': reconstruction_service._get_typical_challenges(industry),
            'funding_patterns': reconstruction_service._get_funding_patterns(industry)
        }
        
        return jsonify({
            'success': True,
            'insights': insights,
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"業界インサイト取得エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': 'インサイトの取得中にエラーが発生しました'
        }), 500

@app.route('/reconstruction/support-organizations', methods=['GET'])
@require_api_key
@rate_limit(limit=30, window=3600)  # 1時間に30回まで
def get_support_organizations():
    """認定支援機関の情報取得"""
    try:
        location = request.args.get('location', '')
        specialty = request.args.get('specialty', '')
        
        # 認定支援機関のデータベースから検索（実際の実装では外部APIと連携）
        organizations = reconstruction_service._search_support_organizations(location, specialty)
        
        return jsonify({
            'success': True,
            'organizations': organizations,
            'search_criteria': {
                'location': location,
                'specialty': specialty
            }
        })
        
    except Exception as e:
        logger.error(f"認定支援機関検索エラー: {str(e)}")
        return jsonify({
            'success': False,
            'error': '認定支援機関の検索中にエラーが発生しました'
        }), 500

@app.route('/reconstruction/health', methods=['GET'])
def health_check():
    """ヘルスチェック"""
    return jsonify({
        'status': 'healthy',
        'service': 'reconstruction-subsidy-api',
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
    port = int(os.environ.get('PORT', 5001))
    debug = os.environ.get('DEBUG', 'False').lower() == 'true'
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )