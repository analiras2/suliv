import type { AppErrorCode } from '@suliv/error-codes';
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { UserProfile } from '@/module/auth/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  session: Session | null;
  user: UserProfile | null;
  status: SessionStatus;
  /** Why the user landed on login (expired link or session); not persisted. */
  authNotice: AppErrorCode | null;
  setSession: (session: Session | null) => void;
  setUser: (user: UserProfile | null) => void;
  setAuthNotice: (code: AppErrorCode) => void;
  clearAuthNotice: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  user: null,
  status: 'loading',
  authNotice: null,
  setSession: (session) =>
    set((state) => ({
      session,
      status: session ? 'authenticated' : 'unauthenticated',
      user: session ? state.user : null,
    })),
  setUser: (user) => set({ user }),
  setAuthNotice: (code) => set({ authNotice: code }),
  clearAuthNotice: () => set({ authNotice: null }),
}));
