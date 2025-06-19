#!/bin/bash

# 監視システムデプロイスクリプト
set -e

NAMESPACE="monitoring"

echo "📊 Deploying monitoring system..."

# Namespaceの作成
echo "🔧 Creating monitoring namespace..."
kubectl apply -f kubernetes/namespace.yaml

# RBAC設定
echo "🔐 Setting up RBAC..."
kubectl apply -f kubernetes/monitoring/rbac.yaml

# Prometheusデプロイ
echo "📈 Deploying Prometheus..."
kubectl apply -f kubernetes/monitoring/prometheus-config.yaml
kubectl apply -f kubernetes/monitoring/alert-rules.yaml

# Grafanaデプロイ
echo "📊 Deploying Grafana..."
kubectl apply -f kubernetes/monitoring/grafana.yaml

# デプロイ状況確認
echo "⏳ Waiting for deployments to be ready..."
kubectl rollout status deployment/prometheus -n $NAMESPACE
kubectl rollout status deployment/grafana -n $NAMESPACE

# サービス確認
echo "🔍 Checking services..."
kubectl get services -n $NAMESPACE

echo "✅ Monitoring system deployed successfully!"
echo ""
echo "📍 Access URLs (after port-forwarding):"
echo "   Prometheus: kubectl port-forward -n monitoring svc/prometheus 9090:9090"
echo "   Grafana:    kubectl port-forward -n monitoring svc/grafana 3000:3000"
echo ""
echo "🔑 Grafana credentials:"
echo "   Username: admin"
echo "   Password: Check grafana-secret in monitoring namespace"