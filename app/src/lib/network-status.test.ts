import { act, renderHook } from '@testing-library/react-native';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

type NetInfoState = { isConnected: boolean | null };
type NetInfoListener = (state: NetInfoState) => void;

const mockAddEventListener = jest.fn<(listener: NetInfoListener) => () => void>();

jest.mock('@react-native-community/netinfo', () => ({
  __esModule: true,
  default: {
    addEventListener: (listener: NetInfoListener) => mockAddEventListener(listener),
  },
}));

// eslint-disable-next-line import/first
import { useNetworkStatus } from './network-status';

// Emit a connectivity change through the captured listener. Wrapped in an async
// act pass because a synchronous act() does not flush an external state update
// after the first mounted hook in a file (jest-expo + React 19 behavior).
const emit = (dispatch: () => void) => act(async () => { dispatch(); });

describe('useNetworkStatus', () => {
  let listener: NetInfoListener;
  let currentState: NetInfoState;

  beforeEach(() => {
    jest.clearAllMocks();
    currentState = { isConnected: true };
    mockAddEventListener.mockImplementation((incoming) => {
      listener = incoming;
      // NetInfo emits the current state to the listener on subscribe.
      incoming(currentState);
      return jest.fn();
    });
  });

  // UT-016
  it('reflects NetInfo current value on initial mount without waiting for an event', async () => {
    currentState = { isConnected: false };
    const { result } = await renderHook(() => useNetworkStatus());
    expect(result.current.isConnected).toBe(false);
  });

  // UT-015
  it('reflects a connectivity change emitted by the NetInfo listener', async () => {
    const { result } = await renderHook(() => useNetworkStatus());
    expect(result.current.isConnected).toBe(true);

    await emit(() => listener({ isConnected: false }));
    expect(result.current.isConnected).toBe(false);

    await emit(() => listener({ isConnected: true }));
    expect(result.current.isConnected).toBe(true);
  });

  it('treats a null NetInfo connectivity value as disconnected', async () => {
    const { result } = await renderHook(() => useNetworkStatus());

    await emit(() => listener({ isConnected: null }));
    expect(result.current.isConnected).toBe(false);
  });

  it('unsubscribes from NetInfo on unmount', async () => {
    const unsubscribe = jest.fn();
    mockAddEventListener.mockImplementation((incoming) => {
      listener = incoming;
      return unsubscribe;
    });
    const { unmount } = await renderHook(() => useNetworkStatus());
    expect(mockAddEventListener).toHaveBeenCalled();

    await act(async () => { unmount(); });
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
