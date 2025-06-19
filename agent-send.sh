#!/bin/bash

AGENT_PREFIX="${AGENT_PREFIX:-agentdemo}"

get_agent_target() {
    case "$1" in
        "president") echo "${AGENT_PREFIX}_president" ;;
        "boss1") echo "${AGENT_PREFIX}:0.0" ;;
        "worker1") echo "${AGENT_PREFIX}:0.1" ;;
        "worker2") echo "${AGENT_PREFIX}:0.2" ;;
        "worker3") echo "${AGENT_PREFIX}:0.3" ;;
        *) echo "" ;;
    esac
}

log_send() {
    mkdir -p logs
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1: $2" >> "logs/${AGENT_PREFIX}_send_log.txt"
}

check_target() {
    local session_name="${1%%:*}"
    tmux has-session -t "$session_name" 2>/dev/null
}

send_message() {
    tmux send-keys -t "$1" C-c
    sleep 0.2
    tmux send-keys -t "$1" "$2" C-m
}

main() {
    if [[ "$1" == "--list" ]]; then
        echo "📋 利用可能エージェント（prefix: $AGENT_PREFIX）:"
        echo "  president, boss1, worker1, worker2, worker3"
        exit 0
    fi

    if [[ $# -lt 2 ]]; then
        echo "❌ 使用法: $0 [エージェント名] [メッセージ]"
        echo "   例: $0 boss1 '作業開始'"
        exit 1
    fi

    local agent="$1"
    shift
    local message="$*"

    local target
    target=$(get_agent_target "$agent")

    if [[ -z "$target" ]]; then
        echo "❌ 無効なエージェント: $agent"
        exit 1
    fi

    if ! check_target "$target"; then
        echo "❌ セッションが存在しません: $target"
        exit 1
    fi

    echo "📤 $agent に送信中: $message"
    send_message "$target" "$message"
    log_send "$agent" "$message"
    echo "✅ 送信完了"
}

main "$@"