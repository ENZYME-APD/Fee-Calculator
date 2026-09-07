const fs = require('fs');

const file = 'src/components/documents/SortableBlock.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/onClick=\{\(\) => onInsert\('rich_text'\)\}/g, 'type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert(\'rich_text\'); }}');
code = code.replace(/onClick=\{\(\) => onInsert\('financial_summary'\)\}/g, 'type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert(\'financial_summary\'); }}');
code = code.replace(/onClick=\{\(\) => onInsert\('team_breakdown'\)\}/g, 'type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert(\'team_breakdown\'); }}');
code = code.replace(/onClick=\{\(\) => onInsert\('payment_schedule'\)\}/g, 'type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onInsert(\'payment_schedule\'); }}');

fs.writeFileSync(file, code);
