variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "db_username" {
  description = "Database username"
  type        = string
  default     = "ai_subsidy_admin"
}

variable "db_password" {
  description = "Database password"
  type        = string
  sensitive   = true
}

variable "redis_auth_token" {
  description = "Redis auth token"
  type        = string
  sensitive   = true
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "ai-subsidy-system"
}

variable "tags" {
  description = "Default tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ai-subsidy-system"
    ManagedBy   = "terraform"
  }
}