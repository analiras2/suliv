/* global jest */
// Services import the real HTTP client, which loads the auth service and creates its Supabase client at
// import time. Placeholder public values keep that import from throwing in suites that never touch Supabase.
process.env.EXPO_PUBLIC_SUPABASE_URL ??= 'http://localhost:54321';
process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??= 'test-anon-key';

jest.mock('react-native-worklets', () => require('react-native-worklets/lib/module/mock'));
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
