// Colour helpers for places that need a colour string instead of a Tailwind class
// (Recharts props, inline styles, SVG attributes). They resolve to the active
// theme's CSS variables, so charts follow the theme and light/dark mode.

export type ColorFamily = 'ink' | 'accent' | 'positive' | 'negative' | 'warning' | 'info' | 'clay';
export type ColorStep = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 950;

/** e.g. tc('accent', 600) -> 'var(--color-accent-600)' */
export const tc = (family: ColorFamily, step: ColorStep) => `var(--color-${family}-${step})`;

/** Same, with transparency: tca('ink', 400, 0.1) */
export const tca = (family: ColorFamily, step: ColorStep, alpha: number) =>
  `color-mix(in srgb, var(--color-${family}-${step}) ${Math.round(alpha * 100)}%, transparent)`;

/** Ordered chart series colours (defined per theme as --chart-1 … --chart-8). */
export const CHART_COLORS = Array.from({ length: 8 }, (_, i) => `var(--color-chart-${i + 1})`);

/** Default colour for new user categories. Stored in the database, so it must be a real hex. */
export const DEFAULT_CATEGORY_HEX = '#0F766E';
