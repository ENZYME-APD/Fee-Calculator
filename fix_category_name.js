const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

const brokenRender = `                        const categoryObj = teamCategories.find(c => c.id === categoryId);
                        const isExternal = categoryObj?.type === 'external';`;
                        
const fixedRender = `                        const categoryObj = teamCategories.find(c => c.id === categoryId);
                        const categoryName = categoryObj?.name || 'Uncategorized';
                        const isExternal = categoryObj?.type === 'external';`;

code = code.replace(brokenRender, fixedRender);
fs.writeFileSync(file, code);
