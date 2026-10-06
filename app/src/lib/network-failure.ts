import NetInfo from '@react-native-community/netinfo';

export type NetworkFailureCode = 'NETWORK_OFFLINE' | 'NETWORK_UNAVAILABLE';

/**
 * Reads connectivity only after a request failed without a response, so the
 * user sees "offline" instead of a generic failure. It is never called before a
 * request: NetInfo is not a pre-flight gate (splash-bootstrap-modo-offline ADR-002).
 */
export async function classifyNetworkFailure(): Promise<NetworkFailureCode> {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected === false ? 'NETWORK_OFFLINE' : 'NETWORK_UNAVAILABLE';
  } catch {
    return 'NETWORK_UNAVAILABLE';
  }
}
