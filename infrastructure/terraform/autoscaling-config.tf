# Auto Scaling設定 - Week 3実装
# Team D: Infrastructure & Monitoring
# Created: 2025-06-20
# Purpose: 決済システムの自動スケーリングとパフォーマンス最適化

# CloudWatch メトリクスに基づくカスタムスケーリング
resource "aws_cloudwatch_metric_alarm" "payment_api_cpu_high" {
  alarm_name          = "${var.project_name}-payment-api-cpu-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "70"
  alarm_description   = "Payment API CPU utilization is too high"
  alarm_actions       = [aws_appautoscaling_policy.payment_app_scale_up.arn]

  dimensions = {
    ServiceName = aws_ecs_service.payment_app.name
    ClusterName = aws_ecs_cluster.payment_cluster.name
  }

  tags = {
    Name = "${var.project_name}-payment-cpu-high-alarm"
    Type = "autoscaling-alarm"
  }
}

resource "aws_cloudwatch_metric_alarm" "payment_api_cpu_low" {
  alarm_name          = "${var.project_name}-payment-api-cpu-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "30"
  alarm_description   = "Payment API CPU utilization is low - scale down"
  alarm_actions       = [aws_appautoscaling_policy.payment_app_scale_down.arn]

  dimensions = {
    ServiceName = aws_ecs_service.payment_app.name
    ClusterName = aws_ecs_cluster.payment_cluster.name
  }

  tags = {
    Name = "${var.project_name}-payment-cpu-low-alarm"
    Type = "autoscaling-alarm"
  }
}

# メモリ使用率によるスケーリング
resource "aws_cloudwatch_metric_alarm" "payment_api_memory_high" {
  alarm_name          = "${var.project_name}-payment-api-memory-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "MemoryUtilization"
  namespace           = "AWS/ECS"
  period              = "120"
  statistic           = "Average"
  threshold           = "80"
  alarm_description   = "Payment API Memory utilization is too high"
  alarm_actions       = [aws_appautoscaling_policy.payment_app_scale_up.arn]

  dimensions = {
    ServiceName = aws_ecs_service.payment_app.name
    ClusterName = aws_ecs_cluster.payment_cluster.name
  }

  tags = {
    Name = "${var.project_name}-payment-memory-high-alarm"
    Type = "autoscaling-alarm"
  }
}

# カスタムメトリクス: 決済レスポンス時間によるスケーリング
resource "aws_cloudwatch_metric_alarm" "payment_latency_high" {
  alarm_name          = "${var.project_name}-payment-latency-high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "PaymentLatencyP99"
  namespace           = "PaymentSystem/Performance"
  period              = "60"
  statistic           = "Average"
  threshold           = "2"
  alarm_description   = "Payment latency P99 is too high - scale up"
  alarm_actions       = [aws_appautoscaling_policy.payment_app_scale_up.arn]

  tags = {
    Name = "${var.project_name}-payment-latency-alarm"
    Type = "performance-alarm"
  }
}

# スケールアップポリシー
resource "aws_appautoscaling_policy" "payment_app_scale_up" {
  name               = "${var.project_name}-payment-app-scale-up"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.payment_app.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_app.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown               = 300
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_lower_bound = 0
      metric_interval_upper_bound = 50
      scaling_adjustment          = 2
    }

    step_adjustment {
      metric_interval_lower_bound = 50
      scaling_adjustment          = 4
    }
  }
}

# スケールダウンポリシー（慎重にスケールダウン）
resource "aws_appautoscaling_policy" "payment_app_scale_down" {
  name               = "${var.project_name}-payment-app-scale-down"
  policy_type        = "StepScaling"
  resource_id        = aws_appautoscaling_target.payment_app.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_app.service_namespace

  step_scaling_policy_configuration {
    adjustment_type         = "ChangeInCapacity"
    cooldown               = 600  # より長いクールダウン
    metric_aggregation_type = "Average"

    step_adjustment {
      metric_interval_upper_bound = 0
      scaling_adjustment          = -1
    }
  }
}

# 予測スケーリング（平日・休日パターン）
resource "aws_appautoscaling_scheduled_action" "payment_scale_up_business_hours" {
  name               = "${var.project_name}-payment-scale-up-business-hours"
  service_namespace  = aws_appautoscaling_target.payment_app.service_namespace
  resource_id        = aws_appautoscaling_target.payment_app.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_app.scalable_dimension

  schedule = "cron(0 8 ? * MON-FRI *)"  # 平日午前8時
  
  scalable_target_action {
    min_capacity = 5
    max_capacity = 20
  }
}

resource "aws_appautoscaling_scheduled_action" "payment_scale_down_after_hours" {
  name               = "${var.project_name}-payment-scale-down-after-hours"
  service_namespace  = aws_appautoscaling_target.payment_app.service_namespace
  resource_id        = aws_appautoscaling_target.payment_app.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_app.scalable_dimension

  schedule = "cron(0 22 ? * MON-FRI *)"  # 平日午後10時
  
  scalable_target_action {
    min_capacity = 2
    max_capacity = 10
  }
}

# 土日のスケーリング設定
resource "aws_appautoscaling_scheduled_action" "payment_scale_weekend" {
  name               = "${var.project_name}-payment-scale-weekend"
  service_namespace  = aws_appautoscaling_target.payment_app.service_namespace
  resource_id        = aws_appautoscaling_target.payment_app.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_app.scalable_dimension

  schedule = "cron(0 0 ? * SAT *)"  # 土曜日午前0時
  
  scalable_target_action {
    min_capacity = 2
    max_capacity = 8
  }
}

# RDS Auto Scaling（リードレプリカ）
resource "aws_appautoscaling_target" "payment_db_replica" {
  max_capacity       = 5
  min_capacity       = 1
  resource_id        = "cluster:${aws_rds_cluster.payment_db_cluster.cluster_identifier}"
  scalable_dimension = "rds:cluster:ReadReplicaCount"
  service_namespace  = "rds"

  tags = {
    Name = "${var.project_name}-db-replica-autoscaling"
  }
}

resource "aws_appautoscaling_policy" "payment_db_replica_scale_up" {
  name               = "${var.project_name}-db-replica-scale-up"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.payment_db_replica.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_db_replica.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_db_replica.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "RDSReaderAverageCPUUtilization"
    }
    target_value = 70.0
  }
}

# ElastiCache Auto Scaling
resource "aws_elasticache_replication_group" "payment_redis_autoscaling" {
  replication_group_id         = "${var.project_name}-payment-redis-as"
  description                  = "Redis cluster with auto scaling"
  
  node_type            = var.redis_node_type
  port                 = 6379
  parameter_group_name = "default.redis7"
  
  num_cache_clusters         = 3
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  # Auto Discovery有効化
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  subnet_group_name  = aws_elasticache_subnet_group.payment_cache.name
  security_group_ids = [aws_security_group.redis.id]

  tags = {
    Name = "${var.project_name}-redis-autoscaling"
    Type = "cache-autoscaling"
  }

  lifecycle {
    ignore_changes = [num_cache_clusters]
  }
}

# Application Load Balancer Target Tracking
resource "aws_lb_target_group" "payment_app_scaled" {
  name     = "${var.project_name}-payment-app-scaled-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.payment_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  # 接続ドレイニング時間を短縮（スケーリング時の応答性向上）
  deregistration_delay = 30

  # スティッキーセッション（Redisセッション使用時は無効化）
  stickiness {
    type            = "lb_cookie"
    cookie_duration = 1
    enabled         = false
  }

  tags = {
    Name = "${var.project_name}-payment-scaled-target-group"
    Type = "autoscaling-target-group"
  }
}

# CloudFront Auto Scaling（地理的分散）
resource "aws_cloudfront_distribution" "payment_cdn" {
  origin {
    domain_name = aws_lb.payment_alb.dns_name
    origin_id   = "PaymentALB"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Payment system CDN with auto scaling"
  default_root_object = "index.html"

  # 地理的制限なし（グローバル展開対応）
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  # ビューアー証明書
  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate.payment_cert.arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # デフォルトキャッシュ動作
  default_cache_behavior {
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "PaymentALB"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = true
      headers      = ["Host", "Authorization", "X-Forwarded-For"]
      
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 0
    default_ttl = 3600
    max_ttl     = 86400
  }

  # API エンドポイント用キャッシュ設定
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "PaymentALB"
    compress               = true
    viewer_protocol_policy = "https-only"

    forwarded_values {
      query_string = true
      headers      = ["*"]
      
      cookies {
        forward = "all"
      }
    }

    min_ttl     = 0
    default_ttl = 0      # API レスポンスはキャッシュしない
    max_ttl     = 0
  }

  # 静的アセット用キャッシュ設定
  ordered_cache_behavior {
    path_pattern           = "/static/*"
    allowed_methods        = ["GET", "HEAD"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "PaymentALB"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    forwarded_values {
      query_string = false
      
      cookies {
        forward = "none"
      }
    }

    min_ttl     = 31536000  # 1年
    default_ttl = 31536000
    max_ttl     = 31536000
  }

  # 価格クラス（全世界展開）
  price_class = "PriceClass_All"

  tags = {
    Name        = "${var.project_name}-payment-cdn"
    Type        = "cdn-autoscaling"
    Environment = var.environment
  }
}

# Lambda@Edge for dynamic scaling and routing
resource "aws_lambda_function" "payment_edge_optimizer" {
  filename         = "payment_edge_optimizer.zip"
  function_name    = "${var.project_name}-payment-edge-optimizer"
  role            = aws_iam_role.lambda_edge_role.arn
  handler         = "index.handler"
  source_code_hash = data.archive_file.payment_edge_optimizer.output_base64sha256
  runtime         = "nodejs18.x"
  timeout         = 5

  tags = {
    Name = "${var.project_name}-payment-edge-optimizer"
    Type = "edge-function"
  }
}

# Lambda@Edge用のコード作成
data "archive_file" "payment_edge_optimizer" {
  type        = "zip"
  output_path = "payment_edge_optimizer.zip"
  
  source {
    content = <<EOF
exports.handler = async (event) => {
    const request = event.Records[0].cf.request;
    const headers = request.headers;
    
    // 地理的ルーティング最適化
    const countryCode = headers['cloudfront-viewer-country'][0].value;
    
    // アジア太平洋地域からのリクエスト
    if (['JP', 'KR', 'CN', 'SG', 'AU'].includes(countryCode)) {
        request.origin = {
            custom: {
                domainName: 'api-ap.ai-subsidy.com',
                port: 443,
                protocol: 'https'
            }
        };
    }
    // ヨーロッパからのリクエスト
    else if (['DE', 'FR', 'GB', 'NL', 'IT'].includes(countryCode)) {
        request.origin = {
            custom: {
                domainName: 'api-eu.ai-subsidy.com',
                port: 443,
                protocol: 'https'
            }
        };
    }
    
    // リクエスト最適化ヘッダー追加
    headers['x-payment-region'] = [{ key: 'X-Payment-Region', value: countryCode }];
    headers['x-edge-optimization'] = [{ key: 'X-Edge-Optimization', value: 'enabled' }];
    
    return request;
};
EOF
    filename = "index.js"
  }
}

# Output values for autoscaling
output "autoscaling_policies" {
  description = "Auto scaling policies for payment system"
  value = {
    scale_up_policy_arn   = aws_appautoscaling_policy.payment_app_scale_up.arn
    scale_down_policy_arn = aws_appautoscaling_policy.payment_app_scale_down.arn
    target_group_arn      = aws_lb_target_group.payment_app_scaled.arn
    cloudfront_domain     = aws_cloudfront_distribution.payment_cdn.domain_name
  }
}

output "scaling_metrics" {
  description = "Key metrics for monitoring autoscaling"
  value = {
    cpu_high_alarm    = aws_cloudwatch_metric_alarm.payment_api_cpu_high.alarm_name
    memory_high_alarm = aws_cloudwatch_metric_alarm.payment_api_memory_high.alarm_name
    latency_alarm     = aws_cloudwatch_metric_alarm.payment_latency_high.alarm_name
  }
}