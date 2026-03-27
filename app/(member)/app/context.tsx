'use client'
import React, { createContext, useContext } from 'react'
import type { Profile } from '@/lib/supabase/types'
import type { usePlayer } from '@/hooks/usePlayer'
import type { useToast } from '@/hooks/useToast'

export interface MemberCtx {
  profile:     Profile | null
  showData:    Record<string, unknown>
  setShowData: (fn: (prev: Record<string, unknown>) => Record<string, unknown>) => void
  player:      ReturnType<typeof usePlayer>
  showToast:   ReturnType<typeof useToast>['showToast']
}

export const MemberContext = createContext<MemberCtx | null>(null)

export function useMember() {
  const c = useContext(MemberContext)
  if (!c) throw new Error('useMember must be used inside MemberLayout')
  return c
}
