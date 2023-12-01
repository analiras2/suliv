const capitalizeText = (text: string) => {
  if (!text) {
    return '';
  }

  const sanitizeText = text.toLowerCase().trim();

  return (
    sanitizeText.charAt(0).toUpperCase() +
    sanitizeText.substring(1, sanitizeText.length)
  );
};

export const toCapitalize = (text: string | undefined) => {
  if (!text) {
    return '';
  }

  const sanitizeText = text.trim();

  if (/\s+/g.test(sanitizeText)) {
    return sanitizeText
      .split(' ')
      .map(word => capitalizeText(word))
      .join(' ');
  }

  return capitalizeText(sanitizeText);
};
