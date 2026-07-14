import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import type { UserProfile } from '@/module/auth/types';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface SessionState {
  session: Session | null;
  user: UserProfile | null;
  status: SessionStatus;
  setSession: (session: Session | null) => void;
  setUser: (user: UserProfile | null) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  user: null,
  status: 'loading',
  setSession: (session) =>
    set((state) => ({
      session,
      status: session ? 'authenticated' : 'unauthenticated',
      user: session ? state.user : null,
    })),
  setUser: (user) => set({ user }),
}));
