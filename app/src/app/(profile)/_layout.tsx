import { Stack } from 'expo-router';

/**
 * The profile sub-screens (settings and "my recipes") live outside the (tabs) layout. That layout
 * uses the headless Tabs, which only turns routes that have a TabTrigger into screens, so a push to
 * a nested file such as /profile/settings/username would be dropped. A plain Stack keeps the same
 * URLs and gives these screens a back stack over the tab bar.
 */
export default function ProfileLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
