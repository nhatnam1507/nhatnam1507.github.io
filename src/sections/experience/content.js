// Colour per employer (keys are domain `employerOf(company)` values).
export const EMPLOYER_COLORS = { Toshiba: '#5aa9ff', Rikkeisoft: '#b18cff', Andpad: '#2ef2b0' };
export const colorOf = (employer) => EMPLOYER_COLORS[employer] || '#2ef2b0';
