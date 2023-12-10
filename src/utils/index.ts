export const INNER_PADDING = '20px';

export const getInitials = (name: string) => {
  if (!name || name.trim() === '') {
    return '?';
  }

  const words = name.split(' ');
  const firstName = words[0][0];
  const lastName = words.length > 1 ? words[words.length - 1][0] : '';

  return firstName + lastName;
};
