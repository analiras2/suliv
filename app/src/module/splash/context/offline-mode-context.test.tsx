import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';
import { Text } from 'react-native';

import { OfflineModeProvider, useOfflineMode } from './offline-mode-context';

function Probe() {
  const isOffline = useOfflineMode();
  return <Text testID="offline-probe">{String(isOffline)}</Text>;
}

describe('offline-mode-context', () => {
  it('defaults to false outside a provider', async () => {
    const screen = await render(<Probe />);
    expect(screen.getByTestId('offline-probe').props.children).toBe('false');
  });

  it('propagates true when the splash view model reports offline', async () => {
    const screen = await render(
      <OfflineModeProvider isOffline={true}>
        <Probe />
      </OfflineModeProvider>,
    );
    expect(screen.getByTestId('offline-probe').props.children).toBe('true');
  });

  it('propagates false when the splash view model reports online', async () => {
    const screen = await render(
      <OfflineModeProvider isOffline={false}>
        <Probe />
      </OfflineModeProvider>,
    );
    expect(screen.getByTestId('offline-probe').props.children).toBe('false');
  });
});
