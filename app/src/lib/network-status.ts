import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/**
 * Reactive connectivity signal wrapping NetInfo. Narrow by design (ADR-002):
 * NetInfo is not a pre-flight gate before network calls — it drives only the
 * login-blocked state and reconnect detection. Data loading stays network-first
 * with a cache fallback, decided by the real request outcome, not this flag.
 */
export interface NetworkStatus {
  isConnected: boolean;
}

// Optimistic default: replaced on subscribe by NetInfo's current value (see
// below) before any connectivity-dependent UI relies on it, so there is no
// initial `undefined`/stale-default flash.
const INITIAL_CONNECTED = true;

export function useNetworkStatus(): NetworkStatus {
  const [isConnected, setIsConnected] = useState(INITIAL_CONNECTED);

  useEffect(() => {
    // NetInfo delivers the current connectivity to the listener immediately on
    // subscribe, then again on every change — a single subscription covers both
    // the initial-mount value and later updates without a separate fetch call.
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(Boolean(state.isConnected));
    });

    return unsubscribe;
  }, []);

  return { isConnected };
}
