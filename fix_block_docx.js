const fs = require('fs');

// 1. SortableBlock.tsx
const blockFile = 'src/components/documents/SortableBlock.tsx';
let blockCode = fs.readFileSync(blockFile, 'utf8');

blockCode = blockCode.replace(
  "import { DocumentBlock, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Project } from '@/lib/firebase/schema';",
  "import { DocumentBlock, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Project, Payment } from '@/lib/firebase/schema';"
);
blockCode = blockCode.replace(
  "import { GripVertical, Trash2, FileText, Calculator, Users } from 'lucide-react';",
  "import { GripVertical, Trash2, FileText, Calculator, Users, CreditCard } from 'lucide-react';"
);

blockCode = blockCode.replace(
  'members: TeamMember[];',
  'members: TeamMember[];\n  payments: Payment[];'
);

blockCode = blockCode.replace(
  'categories, project, onUpdate, onDelete, onInsert }: SortableBlockProps) {',
  'categories, project, payments, onUpdate, onDelete, onInsert }: SortableBlockProps) {'
);

const paymentBlockUi = `
    if (block.type === 'payment_schedule') {
      let totalProjectFee = 0;
      const profitMultiplier = 1 + ((project.profitMargin || 30) / 100);

      for (const phase of phases) {
        let phaseCost = 0;
        allocations.filter(a => a.phaseId === phase.id).forEach(a => {
          const m = members.find(m => m.id === a.memberId);
          if (m) phaseCost += a.hours * m.costPerHour;
        });
        costs.filter(c => c.phaseId === phase.id).forEach(c => {
          phaseCost += c.quantity * c.unitCost;
        });
        totalProjectFee += phaseCost * profitMultiplier;
      }

      return (
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 mt-2">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              <tr>
                <th className="px-4 py-3 font-bold">Milestone</th>
                <th className="px-4 py-3 font-bold text-center">%</th>
                <th className="px-4 py-3 font-bold text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {payments.map(payment => {
                const amount = totalProjectFee * (payment.percentage / 100);
                return (
                  <tr key={payment.id}>
                    <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{payment.name}</td>
                    <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{payment.percentage}%</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800 dark:text-slate-200">$\\{amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
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
          {payments.length === 0 && (
            <div className="p-4 text-center text-slate-500 text-sm">No payment milestones found for this project. Add them in the Project Settings.</div>
          )}
        </div>
      );
    }
`;

blockCode = blockCode.replace(
  /if \(block\.type === 'team_breakdown'\) \{[\s\S]*?return null;/,
  `if (block.type === 'team_breakdown') {`
);

blockCode = blockCode.replace(
  '    return null;\n  };\n\n  return (',
  paymentBlockUi + '\n    return null;\n  };\n\n  return ('
);

blockCode = blockCode.replace(
  '<button onClick={() => onInsert(\'team_breakdown\')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Team"><Users size={14} /></button>',
  '<button onClick={() => onInsert(\'team_breakdown\')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Team"><Users size={14} /></button>\n        <button onClick={() => onInsert(\'payment_schedule\')} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-600 dark:text-slate-300 transition-colors" title="Add Payments"><CreditCard size={14} /></button>'
);

fs.writeFileSync(blockFile, blockCode);

// 2. docxExport.ts
const docxFile = 'src/lib/utils/docxExport.ts';
let docxCode = fs.readFileSync(docxFile, 'utf8');

docxCode = docxCode.replace(
  "import { DocumentBlock, Project, Phase, Allocation, ProjectCost, TeamMember, TeamCategory } from '@/lib/firebase/schema';",
  "import { DocumentBlock, Project, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Payment } from '@/lib/firebase/schema';"
);

docxCode = docxCode.replace(
  "members: TeamMember[],\n  categories: TeamCategory[]\n)",
  "members: TeamMember[],\n  categories: TeamCategory[],\n  payments: Payment[]\n)"
);

const newDocxPayment = `
    else if (block.type === 'payment_schedule') {
      const profitMultiplier = 1 + ((project.profitMargin || 30) / 100);
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
        totalProjectFee += phaseCost * profitMultiplier;
      }
      
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Milestone", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "%", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Amount", bold: true })] })], shading: { fill: "f1f5f9" } })
          ]
        })
      ];

      for (const payment of payments) {
        const amount = totalProjectFee * (payment.percentage / 100);
        
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(payment.name)] }),
              new TableCell({ children: [new Paragraph(\`\${payment.percentage}%\`)] }),
              new TableCell({ children: [new Paragraph(\`$\${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}\`)] })
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
  '  const doc = new Document({',
  newDocxPayment + '\n  const doc = new Document({'
);

fs.writeFileSync(docxFile, docxCode);

