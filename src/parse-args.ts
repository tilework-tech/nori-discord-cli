const SNOWFLAKE_RE = /^\d{16,22}$/;

const coerceValue = (value: string): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;

  if (
    (value.startsWith('[') && value.endsWith(']')) ||
    (value.startsWith('{') && value.endsWith('}'))
  ) {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  if (/^-?\d+$/.test(value) && !/^0\d/.test(value) && !SNOWFLAKE_RE.test(value)) {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }

  return value;
};

const kebabToSnake = (str: string) => str.replace(/-/g, '_');

export const parseArgs = (argv: string[]): Record<string, unknown> => {
  const result: Record<string, unknown> = {};
  let i = 0;

  while (i < argv.length) {
    const arg = argv[i];

    if (!arg.startsWith('--')) {
      i++;
      continue;
    }

    if (arg.includes('=')) {
      const eqIndex = arg.indexOf('=');
      result[kebabToSnake(arg.slice(2, eqIndex))] = coerceValue(arg.slice(eqIndex + 1));
      i++;
      continue;
    }

    const key = kebabToSnake(arg.slice(2));
    const next = argv[i + 1];

    if (next == null || next.startsWith('--')) {
      result[key] = true;
      i++;
      continue;
    }

    result[key] = coerceValue(next);
    i += 2;
  }

  return result;
};
