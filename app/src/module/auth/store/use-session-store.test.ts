import type { Session } from '@supabase/supabase-js';
import { beforeEach, describe, expect, it } from '@jest/globals';

import type { UserProfile } from '@/module/auth/types';

import { useSessionStore } from './use-session-store';

const session = { access_token: 'access-token' } as Session;
const user = { id: 'user-id', name: 'Ana' } as UserProfile;

describe('useSessionStore', () => {
  beforeEach(() => {
    useSessionStore.setState({ session: null, status: 'loading', user: null });
  });

  it('UT-021 authenticates when a valid session is set', () => {
    useSessionStore.getState().setSession(session);

    expect(useSessionStore.getState()).toMatchObject({
      session,
      status: 'authenticated',
    });
  });

  it('UT-022 unauthenticates and clears the user when the session is removed', () => {
    useSessionStore.setState({ session, status: 'authenticated', user });

    useSessionStore.getState().setSession(null);

    expect(useSessionStore.getState()).toMatchObject({
      session: null,
      status: 'unauthenticated',
      user: null,
    });
  });

  it('preserves the hydrated profile when an active session changes', () => {
    useSessionStore.setState({ session: null, status: 'loading', user });

    useSessionStore.getState().setSession(session);

    expect(useSessionStore.getState().user).toBe(user);
  });

  it('sets and clears the hydrated user explicitly', () => {
    useSessionStore.getState().setUser(user);
    expect(useSessionStore.getState().user).toBe(user);

    useSessionStore.getState().setUser(null);
    expect(useSessionStore.getState().user).toBeNull();
  });
});
