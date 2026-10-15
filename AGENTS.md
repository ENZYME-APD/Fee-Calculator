<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Colour & copy conventions
- Colours come from the theme tokens only: `ink` (neutrals), `accent` (brand), `positive`, `negative`, `warning`, `info`, `clay`, each with steps 50–950 (e.g. `bg-ink-50 dark:bg-ink-950`, `text-accent-600`). Default Tailwind palettes (slate, blue, emerald…) are disabled and will silently do nothing.
- Values live in `src/styles/themes/*.css`; the active theme is the import in `src/app/globals.css`. To change the look, edit or swap that file — never hardcode hex in components.
- For Recharts/inline styles use `tc()`, `tca()` and `CHART_COLORS` from `@/lib/theme`.
- Muted text: `text-ink-500` in light, `dark:text-ink-400` in dark (ink-400 on white fails contrast).
- No purple. UI copy is sentence case ("Total fee", not "Total Fee" or "TOTAL FEE"); don't use `uppercase` on labels.
