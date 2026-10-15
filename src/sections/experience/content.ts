// Colour per employer (keys are domain `employerOf(company)` values).
export const EMPLOYER_COLORS = { Toshiba: '#5aa9ff', Rikkeisoft: '#b18cff', Andpad: '#2ef2b0' } as const;

export const DEFAULT_COLOR = '#2ef2b0';
const COLOR_BY_EMPLOYER: Readonly<Record<string, string>> = EMPLOYER_COLORS;

export const colorOf = (employer: string): string => COLOR_BY_EMPLOYER[employer] ?? DEFAULT_COLOR;
