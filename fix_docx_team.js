const fs = require('fs');
const file = 'src/lib/utils/docxExport.ts';
let code = fs.readFileSync(file, 'utf8');

const teamCode = `
    else if (block.type === 'team_breakdown') {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Team Member", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Role", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Allocated Hours", bold: true })] })], shading: { fill: "f1f5f9" } })
          ]
        })
      ];

      for (const member of members) {
        const memberAllocations = allocations.filter(a => a.memberId === member.id);
        if (memberAllocations.length === 0) continue;
        
        const totalHours = memberAllocations.reduce((sum, a) => sum + a.hours, 0);
        
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(member.name)] }),
              new TableCell({ children: [new Paragraph(member.position)] }),
              new TableCell({ children: [new Paragraph(\`\${totalHours} hrs\`)] })
            ]
          })
        );
      }

      docElements.push(
        new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "e2e8f0" },
          }
        })
      );
      docElements.push(new Paragraph({ spacing: { after: 400 } }));
    }
`;

code = code.replace(
  '  const doc = new Document({',
  teamCode + '\n  const doc = new Document({'
);

fs.writeFileSync(file, code);
