import { render } from '@testing-library/react-native';
import { describe, expect, it } from '@jest/globals';

import { Avatar } from './avatar';

describe('Avatar', () => {
  it('UT-007: renders the image from avatarUrl when present', async () => {
    const screen = await render(
      <Avatar avatarUrl="https://cdn.suliv.app/u/1.jpg" name="Ana Maria" username="ana" />,
    );
    const image = screen.getByTestId('avatar-photo');
    expect(image.props.source).toEqual([{ uri: 'https://cdn.suliv.app/u/1.jpg' }]);
  });

  it('UT-008: falls back to initials from name when avatarUrl is null', async () => {
    const screen = await render(<Avatar avatarUrl={null} name="Ana Maria" username="ana" />);
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('AM');
  });

  it('falls back to initials from username when name is also null', async () => {
    const screen = await render(<Avatar avatarUrl={null} name={null} username="analu" />);
    expect(screen.getByTestId('avatar-initials')).toHaveTextContent('A');
  });
});
