const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Remove performSeed and handleSeedMyData
const seedFuncRegex = /const performSeed = async \(\) => \{[\s\S]*?const handleSeedMyData = \(\) => \{[\s\S]*?\}\s*\}\;/;
code = code.replace(seedFuncRegex, '');

// 2. Remove the button rendering
const buttonRegex = /\{user\?\.email\?\.toLowerCase\(\) === 'j\.beneitez@weareenzyme\.com' && \([\s\S]*?<\/button>\s*\}\)/;
code = code.replace(buttonRegex, '');

fs.writeFileSync(file, code);
