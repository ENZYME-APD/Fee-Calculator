const fs = require('fs');

// 2. Add typography to tailwind.config.ts
const tailwindFile = 'tailwind.config.ts';
let tailwindCode = fs.readFileSync(tailwindFile, 'utf8');
if (!tailwindCode.includes('@tailwindcss/typography')) {
  tailwindCode = tailwindCode.replace(
    'plugins: [',
    "plugins: [\n    require('@tailwindcss/typography'),"
  );
  fs.writeFileSync(tailwindFile, tailwindCode);
}

// 3. Add print:hidden to Navigation.tsx
const navFile = 'src/components/layout/Navigation.tsx';
let navCode = fs.readFileSync(navFile, 'utf8');
navCode = navCode.replace(
  'className="h-full bg-slate-900 text-slate-300 w-64 flex flex-col transition-all duration-300 relative z-50 shadow-xl shrink-0"',
  'className="h-full bg-slate-900 text-slate-300 w-64 flex flex-col transition-all duration-300 relative z-50 shadow-xl shrink-0 print:hidden"'
);
fs.writeFileSync(navFile, navCode);

// 4. Check if there are other print styles missing in DocumentBuilder
const builderFile = 'src/components/documents/DocumentBuilder.tsx';
let builderCode = fs.readFileSync(builderFile, 'utf8');

// Ensure the main container scrolls, but prints correctly
builderCode = builderCode.replace(
  'className="flex-1 overflow-y-auto p-8 print:p-0 print:bg-white bg-slate-100 dark:bg-slate-950"',
  'className="flex-1 overflow-y-auto print:overflow-visible p-8 print:p-0 print:bg-white bg-slate-100 dark:bg-slate-950 print:block"'
);
builderCode = builderCode.replace(
  'className="flex h-full w-full bg-slate-50 dark:bg-slate-950"',
  'className="flex h-full w-full bg-slate-50 dark:bg-slate-950 print:bg-white print:block"'
);
builderCode = builderCode.replace(
  'className="flex-1 flex flex-col h-full relative"',
  'className="flex-1 flex flex-col h-full relative print:block"'
);

fs.writeFileSync(builderFile, builderCode);
