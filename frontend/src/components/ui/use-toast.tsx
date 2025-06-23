'use client'

import { useState, useCallback } from 'react'

type ToastVariant = 'default' | 'destructive'

interface Toast {
  id: string
  title?: string
  description?: string
  variant?: ToastVariant
}

interface ToastContextValue {
  toasts: Toast[]
  toast: (props: Omit<Toast, 'id'>) => void
  dismiss: (id: string) => void
}

const toasts: Toast[] = []
const listeners: Array<(toasts: Toast[]) => void> = []

let memoryState: Toast[] = toasts

function dispatch(action: { type: string; toast?: Toast; id?: string }) {
  switch (action.type) {
    case 'ADD_TOAST':
      if (action.toast) {
        memoryState = [...memoryState, action.toast]
      }
      break
    case 'DISMISS_TOAST':
      if (action.id) {
        memoryState = memoryState.filter((t) => t.id !== action.id)
      }
      break
  }
  listeners.forEach((listener) => listener(memoryState))
}

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_VALUE
  return count.toString()
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState)

  const toast = useCallback((props: Omit<Toast, 'id'>) => {
    const id = genId()
    
    const newToast: Toast = {
      ...props,
      id,
    }

    dispatch({
      type: 'ADD_TOAST',
      toast: newToast,
    })

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dispatch({
        type: 'DISMISS_TOAST',
        id,
      })
    }, 5000)

    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    dispatch({
      type: 'DISMISS_TOAST',
      id,
    })
  }, [])

  // Subscribe to changes
  useState(() => {
    const listener = (newToasts: Toast[]) => {
      setToasts(newToasts)
    }
    listeners.push(listener)
    return () => {
      const index = listeners.indexOf(listener)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  })

  return {
    toast,
    dismiss,
    toasts,
  }
}

export type { Toast, ToastVariant }