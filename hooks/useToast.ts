'use client'
import { useState, useCallback, useRef } from 'react'

export interface ToastData {
  msg:   string
  icon:  string
  color: string
}

export function useToast() {
  const [toast, setToast] = useState<ToastData | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((msg: string, icon = '✓', color = '#4DCFB4') => {
    setToast({ msg, icon, color })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setToast(null), 3500)
  }, [])

  return { toast, showToast }
}
