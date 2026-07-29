export const formatDate = (date: Date | string | null): string | null => {
  if (!date) return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString();
};

export const parseDecimal = (value: string | null): number | null => {
  if (!value) return null;
  return parseFloat(value);
};

export const safeJsonParse = <T>(json: string | null | undefined, fallback: T): T => {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
};
