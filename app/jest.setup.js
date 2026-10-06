/* global jest */
// Services import the real HTTP client, which loads the auth service and creates its Supabase client at
// import time. Placeholder public values keep that import from throwing in suites that never touch Supabase.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';

// supabase-js builds a realtime client at creation and throws on Node versions without a native
// WebSocket (the CI runner). Nothing here connects, so an inert stand-in is enough.
if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = class WebSocketStub {};
}

// waitFor/findBy default to 1 s, which a loaded CI runner or the pre-push full run can exceed.
require('@testing-library/react-native').configure({ asyncUtilTimeout: 5000 });

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
