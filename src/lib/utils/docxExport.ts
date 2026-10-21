
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType } from 'docx';
import { paymentAmount, paymentPercent, formatPercent } from '@/lib/utils/payments';
import { computeProjectFinancials, feeMultiplierFor } from '@/lib/utils/projectFinancials';
import { saveAs } from 'file-saver';
import { DocumentBlock, Project, Phase, Allocation, ProjectCost, TeamMember, TeamCategory, Payment } from '@/lib/firebase/schema';
import { getAllocationRate } from '@/lib/utils/allocationCost';

// Helper to strip HTML tags for simple rich text fallback
const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};


// Rich text (the editor's HTML) to Word paragraphs, keeping headings, lists, bold and italics
type Marks = { bold?: boolean; italics?: boolean; underline?: boolean };
const runsOf = (node: Node, marks: Marks = {}): TextRun[] => {
  const out: TextRun[] = [];
  node.childNodes.forEach(child => {
    if (child.nodeType === 3) {
      const t = (child.textContent || '').replace(/\s+/g, ' ');
      if (t) out.push(new TextRun({ text: t, bold: marks.bold, italics: marks.italics, underline: marks.underline ? {} : undefined }));
    } else if (child.nodeType === 1) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === 'br') { out.push(new TextRun({ text: '', break: 1 })); return; }
      if (tag === 'ul' || tag === 'ol') return; // nested lists are handled as their own paragraphs
      out.push(...runsOf(el, {
        bold: marks.bold || tag === 'strong' || tag === 'b',
        italics: marks.italics || tag === 'em' || tag === 'i',
        underline: marks.underline || tag === 'u',
      }));
    }
  });
  return out;
};

const htmlToParagraphs = (html: string): Paragraph[] => {
  const root = document.createElement('div');
  root.innerHTML = html;
  const out: Paragraph[] = [];
  const walk = (el: Element, level: number) => {
    Array.from(el.children).forEach(child => {
      const tag = child.tagName.toLowerCase();
      if (tag === 'ul' || tag === 'ol') {
        Array.from(child.children).forEach((li, i) => {
          const prefix = tag === 'ol' ? [new TextRun(`${i + 1}. `)] : [];
          out.push(new Paragraph({
            children: [...prefix, ...runsOf(li)],
            ...(tag === 'ul' ? { bullet: { level: Math.min(level, 8) } } : { indent: { left: 360 * (level + 1) } }),
            spacing: { after: 80 },
          }));
          walk(li, level + 1);
        });
      } else if (/^h[1-6]$/.test(tag)) {
        out.push(new Paragraph({ children: [new TextRun({ text: child.textContent || '', bold: true, size: tag === 'h2' ? 28 : 24 })], spacing: { before: 240, after: 120 } }));
      } else if (tag === 'p' || tag === 'blockquote') {
        const runs = runsOf(child);
        if (runs.length) out.push(new Paragraph({ children: runs, spacing: { after: 160 }, ...(tag === 'blockquote' ? { indent: { left: 720 } } : {}) }));
      } else if (tag !== 'li') {
        walk(child, level);
      }
    });
  };
  walk(root, 0);
  if (!out.length && root.textContent?.trim()) out.push(new Paragraph({ children: [new TextRun(stripHtml(html))] }));
  return out;
};

export const exportToDocx = async (
  project: Project,
  blocks: DocumentBlock[],
  phases: Phase[],
  allocations: Allocation[],
  costs: ProjectCost[],
  members: TeamMember[],
  categories: TeamCategory[],
  payments: Payment[]
) => {
  
  const docElements: any[] = [];
  
  // Document Title
  docElements.push(
    new Paragraph({
      children: [new TextRun({ text: `Fee Proposal: ${project.name}`, bold: true, size: 48 })],
      spacing: { after: 400 }
    })
  );

  for (const block of blocks) {
    if (block.title) {
      docElements.push(
        new Paragraph({
          children: [new TextRun({ text: block.title, bold: true, size: 32 })],
          spacing: { before: 400, after: 200 }
        })
      );
    }

    if (block.type === 'rich_text') {
      docElements.push(...htmlToParagraphs(block.content || ''));
    }
    else if (block.type === 'phase_scope') {
      for (const phase of phases) {
        docElements.push(
          new Paragraph({
            children: [new TextRun({ text: phase.name, bold: true, size: 28 })],
            spacing: { before: 200, after: 100 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Duration: ", bold: true }),
              new TextRun(`${phase.durationWeeks} Weeks`)
            ],
            spacing: { after: 200 }
          }),
          new Paragraph({
            children: [new TextRun({ text: phase.description || "No description provided." })],
            spacing: { after: 300 }
          })
        );
      }
    }
    else if (block.type === 'financial_summary') {
      const profitMultiplier = feeMultiplierFor(project, computeProjectFinancials(project, phases, allocations, costs, members).totalCost);
      
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
          if (m) phaseCost += a.hours * getAllocationRate(a, m);
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
              new TableCell({ children: [new Paragraph(`${phase.durationWeeks} Weeks`)] }),
              new TableCell({ children: [new Paragraph(`$${phaseFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}`)] })
            ]
          })
        );
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Fee", bold: true })] })], columnSpan: 2, shading: { fill: "e2e8f0" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, bold: true })] })], shading: { fill: "e2e8f0" } })
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
        const memberAllocations = allocations.filter(a => a.memberId === member.id && a.projectId === project.id);
        if (memberAllocations.length === 0) continue;
        
        const totalHours = memberAllocations.reduce((sum, a) => sum + a.hours, 0);
        
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(member.name)] }),
              new TableCell({ children: [new Paragraph(member.position)] }),
              new TableCell({ children: [new Paragraph(`${totalHours} hrs`)] })
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
    else if (block.type === 'payment_schedule') {
      const profitMultiplier = feeMultiplierFor(project, computeProjectFinancials(project, phases, allocations, costs, members).totalCost);
      let totalProjectFee = 0;

      for (const phase of phases) {
        let phaseCost = 0;
        allocations.filter(a => a.phaseId === phase.id).forEach(a => {
          const m = members.find(m => m.id === a.memberId);
          if (m) phaseCost += a.hours * getAllocationRate(a, m);
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
        const amount = paymentAmount(payment, totalProjectFee);
        
        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(payment.name)] }),
              new TableCell({ children: [new Paragraph(`${formatPercent(paymentPercent(payment, totalProjectFee))}%`)] }),
              new TableCell({ children: [new Paragraph(`$${amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}`)] })
            ]
          })
        );
      }

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Fee", bold: true })] })], columnSpan: 2, shading: { fill: "e2e8f0" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: `$${totalProjectFee.toLocaleString(undefined, { maximumFractionDigits: 2 })}`, bold: true })] })], shading: { fill: "e2e8f0" } })
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
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children: docElements,
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${project.name} - Fee Proposal.docx`);
};
