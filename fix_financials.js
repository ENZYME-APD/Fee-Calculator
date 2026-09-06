const fs = require('fs');

// 1. Fix SortableBlock.tsx
const blockFile = 'src/components/documents/SortableBlock.tsx';
let blockCode = fs.readFileSync(blockFile, 'utf8');

// A. BubbleMenu for Tiptap
if (!blockCode.includes('BubbleMenu')) {
  blockCode = blockCode.replace(
    "import { EditorContent, useEditor } from '@tiptap/react';",
    "import { EditorContent, useEditor, BubbleMenu } from '@tiptap/react';\nimport { Bold, Italic, List, ListOrdered } from 'lucide-react';"
  );
  
  const bubbleMenuUi = `
        <div className="prose-wrapper relative group/editor">
          {editor && (
            <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="flex items-center gap-1 bg-slate-800 text-white rounded-lg p-1 shadow-lg border border-slate-700">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={\`p-1.5 rounded hover:bg-slate-700 \${editor.isActive('bold') ? 'bg-blue-600' : ''}\`}
              ><Bold size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={\`p-1.5 rounded hover:bg-slate-700 \${editor.isActive('italic') ? 'bg-blue-600' : ''}\`}
              ><Italic size={14} /></button>
              <div className="w-px h-4 bg-slate-600 mx-1"></div>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={\`p-1.5 rounded hover:bg-slate-700 \${editor.isActive('bulletList') ? 'bg-blue-600' : ''}\`}
              ><List size={14} /></button>
              <button
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={\`p-1.5 rounded hover:bg-slate-700 \${editor.isActive('orderedList') ? 'bg-blue-600' : ''}\`}
              ><ListOrdered size={14} /></button>
            </BubbleMenu>
          )}
          <EditorContent editor={editor} />
        </div>
`;
  blockCode = blockCode.replace(
    /<div className="prose-wrapper">[\s\S]*?<EditorContent editor={editor} \/>[\s\S]*?<\/div>/,
    bubbleMenuUi
  );
}

// B. Financial Summary Table
const newFinancialUi = `
    if (block.type === 'financial_summary') {
      let totalProjectFee = 0;
      const profitMultiplier = 1 + ((project.profitMargin || 30) / 100);

      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Phase</th>
                <th className="px-4 py-3 font-bold">Duration</th>
                <th className="px-4 py-3 font-bold text-right">Fee</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {phases.map(phase => {
                let phaseCost = 0;
                allocations.filter(a => a.phaseId === phase.id).forEach(a => {
                  const m = members.find(m => m.id === a.memberId);
                  if (m) phaseCost += a.hours * m.costPerHour;
                });
                costs.filter(c => c.phaseId === phase.id).forEach(c => {
                  phaseCost += c.quantity * c.unitCost;
                });
                
                const phaseFee = phaseCost * profitMultiplier;
                totalProjectFee += phaseFee;
                
                return (
                  <tr key={phase.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{phase.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{phase.durationWeeks} Weeks</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">$\\{phaseFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-slate-50 dark:bg-slate-900 border-t-2 border-slate-200 dark:border-slate-700">
              <tr>
                <td colSpan={2} className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">Total Fee</td>
                <td className="px-4 py-3 font-bold text-blue-600 dark:text-blue-400 text-right">$\\{totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      );
    }
`;

blockCode = blockCode.replace(
  /if \(block\.type === 'financial_summary'\) \{[\s\S]*?return \([\s\S]*?<\/div>[\s\S]*?\);[\s\S]*?\}/,
  newFinancialUi.trim()
);

fs.writeFileSync(blockFile, blockCode);

// 2. Fix docxExport.ts
const docxFile = 'src/lib/utils/docxExport.ts';
let docxCode = fs.readFileSync(docxFile, 'utf8');

const newDocxFinancial = `
    else if (block.type === 'financial_summary') {
      const profitMultiplier = 1 + ((project.profitMargin || 30) / 100);
      
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phase", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Fee", bold: true })] })], shading: { fill: "f1f5f9" } })
          ]
        })
      ];

      let totalProjectFee = 0;

      for (const phase of phases) {
        let phaseCost = 0;
        allocations.filter(a => a.phaseId === phase.id).forEach(a => {
          const m = members.find(m => m.id === a.memberId);
          if (m) phaseCost += a.hours * m.costPerHour;
        });
        costs.filter(c => c.phaseId === phase.id).forEach(c => {
          phaseCost += c.quantity * c.unitCost;
        });

        const phaseFee = phaseCost * profitMultiplier;
        totalProjectFee += phaseFee;

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(phase.name)] }),
              new TableCell({ children: [new Paragraph(\`\${phase.durationWeeks} Weeks\`)] }),
              new TableCell({ children: [new Paragraph(\`$\${phaseFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}\`)] })
            ]
          })
        );
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Fee", bold: true })] })], columnSpan: 2, shading: { fill: "e2e8f0" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: \`$\${totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}\`, bold: true })] })], shading: { fill: "e2e8f0" } })
          ]
        })
      );

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

docxCode = docxCode.replace(
  /else if \(block\.type === 'financial_summary'\) \{[\s\S]*?docElements\.push\(new Paragraph\(\{ spacing: \{ after: 400 \} \}\)\);[\s\S]*?\}/,
  newDocxFinancial.trim()
);

fs.writeFileSync(docxFile, docxCode);

