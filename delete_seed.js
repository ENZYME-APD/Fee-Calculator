const fs = require('fs');
const file = 'src/app/(app)/overheads/page.tsx';
const lines = fs.readFileSync(file, 'utf8').split('\n');

const newLines = [];
let skip = false;
let skipButton = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const performSeed = async () => {')) {
    skip = true;
  }
  if (skip) {
    if (line.includes('action: performSeed')) {
      skip = false;
      // Skip the next two lines: '    });' and '  };'
      i += 2;
    }
    continue;
  }

  if (line.includes('user?.email?.toLowerCase() === \'j.beneitez@weareenzyme.com\'')) {
    skipButton = true;
  }
  if (skipButton) {
    if (line.includes('</button>')) {
      skipButton = false;
      i += 1; // skip the ')}' line
    }
    continue;
  }

  newLines.push(line);
}

fs.writeFileSync(file, newLines.join('\n'));
