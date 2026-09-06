const fs = require('fs');
const file = 'src/components/planning/GanttPlanner.tsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('useSearchParams')) {
  code = code.replace(
    "import { useState, useMemo, useEffect } from 'react';",
    "import { useState, useMemo, useEffect } from 'react';\nimport { useSearchParams, useRouter } from 'next/navigation';"
  );
  
  // Add search params logic
  code = code.replace(
    "export function GanttPlanner() {",
    `export function GanttPlanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialProjectId = searchParams.get('project');`
  );
  
  code = code.replace(
    "const [selectedProjectId, setSelectedProjectId] = useState<string>('');",
    `const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjectId || '');
    
  useEffect(() => {
    if (initialProjectId && initialProjectId !== selectedProjectId) {
      setSelectedProjectId(initialProjectId);
    }
  }, [initialProjectId]);
  
  // Clean up URL after initial load
  useEffect(() => {
    if (initialProjectId) {
      router.replace('/planning');
    }
  }, [initialProjectId, router]);`
  );
}

fs.writeFileSync(file, code);
