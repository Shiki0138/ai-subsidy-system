# 決済システム用変数定義
# Team D: Infrastructure & Monitoring
# Created: 2025-06-20

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "ai-subsidy-system"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
  
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "aws_region" {
  description = "AWS region for infrastructure deployment"
  type        = string
  default     = "us-east-1"
}

# ネットワーク設定
variable "vpc_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  description = "CIDR blocks for private subnets"
  type        = list(string)
  default     = ["10.0.10.0/24", "10.0.20.0/24", "10.0.30.0/24"]
}

variable "database_subnet_cidrs" {
  description = "CIDR blocks for database subnets"
  type        = list(string)
  default     = ["10.0.100.0/24", "10.0.200.0/24", "10.0.300.0/24"]
}

# データベース設定
variable "db_instance_class" {
  description = "RDS instance class for payment database"
  type        = string
  default     = "db.r6g.xlarge"
  
  validation {
    condition = can(regex("^db\\.(t3|r6g|r5)\\.(micro|small|medium|large|xlarge|2xlarge)$", var.db_instance_class))
    error_message = "Database instance class must be a valid RDS instance type."
  }
}

variable "db_replica_instance_class" {
  description = "RDS instance class for payment database replica"
  type        = string
  default     = "db.r6g.large"
}

variable "db_allocated_storage" {
  description = "Allocated storage for payment database (GB)"
  type        = number
  default     = 500
  
  validation {
    condition     = var.db_allocated_storage >= 100 && var.db_allocated_storage <= 10000
    error_message = "Database storage must be between 100GB and 10TB."
  }
}

variable "db_max_allocated_storage" {
  description = "Maximum allocated storage for payment database (GB)"
  type        = number
  default     = 1000
}

variable "db_name" {
  description = "Payment database name"
  type        = string
  default     = "payment_system"
  
  validation {
    condition     = can(regex("^[a-zA-Z][a-zA-Z0-9_]{0,62}$", var.db_name))
    error_message = "Database name must start with a letter and contain only letters, numbers, and underscores."
  }
}

variable "db_username" {
  description = "Payment database master username"
  type        = string
  default     = "payment_admin"
  sensitive   = true
}

variable "db_password" {
  description = "Payment database master password"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.db_password) >= 8
    error_message = "Database password must be at least 8 characters long."
  }
}

# Redis設定
variable "redis_node_type" {
  description = "ElastiCache Redis node type"
  type        = string
  default     = "cache.r6g.large"
  
  validation {
    condition = can(regex("^cache\\.(t3|r6g|r5)\\.(micro|small|medium|large|xlarge)$", var.redis_node_type))
    error_message = "Redis node type must be a valid ElastiCache node type."
  }
}

variable "redis_num_cache_nodes" {
  description = "Number of cache nodes in Redis cluster"
  type        = number
  default     = 3
  
  validation {
    condition     = var.redis_num_cache_nodes >= 1 && var.redis_num_cache_nodes <= 20
    error_message = "Number of Redis cache nodes must be between 1 and 20."
  }
}

variable "redis_auth_token" {
  description = "Redis AUTH token for authentication"
  type        = string
  sensitive   = true
  
  validation {
    condition     = length(var.redis_auth_token) >= 16 && length(var.redis_auth_token) <= 128
    error_message = "Redis auth token must be between 16 and 128 characters."
  }
}

# ECS設定
variable "ecs_desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 3
  
  validation {
    condition     = var.ecs_desired_count >= 1 && var.ecs_desired_count <= 50
    error_message = "ECS desired count must be between 1 and 50."
  }
}

variable "ecs_min_capacity" {
  description = "Minimum number of ECS tasks for auto scaling"
  type        = number
  default     = 2
}

variable "ecs_max_capacity" {
  description = "Maximum number of ECS tasks for auto scaling"
  type        = number
  default     = 20
  
  validation {
    condition     = var.ecs_max_capacity >= var.ecs_min_capacity
    error_message = "ECS max capacity must be greater than or equal to min capacity."
  }
}

variable "ecr_repository_url" {
  description = "ECR repository URL for payment application"
  type        = string
  default     = "123456789012.dkr.ecr.us-east-1.amazonaws.com/ai-subsidy-payment"
}

variable "app_version" {
  description = "Application version tag"
  type        = string
  default     = "latest"
}

# 証明書設定
variable "domain_name" {
  description = "Domain name for payment system"
  type        = string
  default     = "payments.ai-subsidy.com"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID"
  type        = string
  default     = "Z1234567890ABC"
}

# 監視設定
variable "cloudwatch_retention_days" {
  description = "CloudWatch logs retention period in days"
  type        = number
  default     = 30
  
  validation {
    condition = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.cloudwatch_retention_days)
    error_message = "CloudWatch retention days must be a valid retention period."
  }
}

variable "enable_container_insights" {
  description = "Enable ECS Container Insights"
  type        = bool
  default     = true
}

variable "enable_performance_insights" {
  description = "Enable RDS Performance Insights"
  type        = bool
  default     = true
}

# セキュリティ設定
variable "enable_waf" {
  description = "Enable AWS WAF for ALB"
  type        = bool
  default     = true
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false  # 高額なため本番のみ有効化
}

variable "allowed_cidr_blocks" {
  description = "CIDR blocks allowed to access the system"
  type        = list(string)
  default     = ["0.0.0.0/0"]  # 本番では制限する
}

# バックアップ設定
variable "backup_retention_period" {
  description = "Database backup retention period in days"
  type        = number
  default     = 7
  
  validation {
    condition     = var.backup_retention_period >= 1 && var.backup_retention_period <= 35
    error_message = "Backup retention period must be between 1 and 35 days."
  }
}

variable "backup_window" {
  description = "Preferred backup window"
  type        = string
  default     = "03:00-04:00"
  
  validation {
    condition     = can(regex("^[0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9]$", var.backup_window))
    error_message = "Backup window must be in HH:MM-HH:MM format."
  }
}

variable "maintenance_window" {
  description = "Preferred maintenance window"
  type        = string
  default     = "sun:04:00-sun:05:00"
  
  validation {
    condition = can(regex("^(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]-(mon|tue|wed|thu|fri|sat|sun):[0-2][0-9]:[0-5][0-9]$", var.maintenance_window))
    error_message = "Maintenance window must be in day:HH:MM-day:HH:MM format."
  }
}

# タグ設定
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default = {
    Team        = "team-d"
    Project     = "hybrid-billing-implementation"
    CreatedBy   = "terraform"
    ManagedBy   = "team-d"
    CostCenter  = "engineering"
  }
}

# 監視・アラート設定
variable "alert_email" {
  description = "Email address for critical alerts"
  type        = string
  default     = "team-d@ai-subsidy.com"
  
  validation {
    condition     = can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.alert_email))
    error_message = "Alert email must be a valid email address."
  }
}

variable "slack_webhook_url" {
  description = "Slack webhook URL for alerts"
  type        = string
  default     = ""
  sensitive   = true
}

variable "pagerduty_service_key" {
  description = "PagerDuty service key for critical alerts"
  type        = string
  default     = ""
  sensitive   = true
}

# パフォーマンス設定
variable "cpu_threshold" {
  description = "CPU utilization threshold for auto scaling (%)"
  type        = number
  default     = 60
  
  validation {
    condition     = var.cpu_threshold >= 10 && var.cpu_threshold <= 90
    error_message = "CPU threshold must be between 10% and 90%."
  }
}

variable "memory_threshold" {
  description = "Memory utilization threshold for alerts (%)"
  type        = number
  default     = 85
  
  validation {
    condition     = var.memory_threshold >= 50 && var.memory_threshold <= 95
    error_message = "Memory threshold must be between 50% and 95%."
  }
}

variable "payment_success_rate_threshold" {
  description = "Payment success rate threshold for alerts (%)"
  type        = number
  default     = 99.5
  
  validation {
    condition     = var.payment_success_rate_threshold >= 95.0 && var.payment_success_rate_threshold <= 100.0
    error_message = "Payment success rate threshold must be between 95% and 100%."
  }
}

variable "payment_latency_threshold" {
  description = "Payment latency threshold for alerts (seconds)"
  type        = number
  default     = 3
  
  validation {
    condition     = var.payment_latency_threshold >= 1 && var.payment_latency_threshold <= 10
    error_message = "Payment latency threshold must be between 1 and 10 seconds."
  }
}

# 開発・テスト設定
variable "enable_debug_logging" {
  description = "Enable debug logging"
  type        = bool
  default     = false
}

variable "skip_final_snapshot" {
  description = "Skip final database snapshot on deletion (for development)"
  type        = bool
  default     = false
}

# コスト最適化設定
variable "enable_spot_instances" {
  description = "Enable spot instances for non-critical workloads"
  type        = bool
  default     = false
}

variable "storage_class" {
  description = "S3 storage class for logs"
  type        = string
  default     = "STANDARD_IA"
  
  validation {
    condition = contains(["STANDARD", "STANDARD_IA", "ONEZONE_IA", "REDUCED_REDUNDANCY"], var.storage_class)
    error_message = "Storage class must be a valid S3 storage class."
  }
}

# Stripe設定（Secrets Managerで管理）
variable "stripe_publishable_key" {
  description = "Stripe publishable key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "stripe_secret_key" {
  description = "Stripe secret key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "stripe_webhook_secret" {
  description = "Stripe webhook endpoint secret"
  type        = string
  default     = ""
  sensitive   = true
}