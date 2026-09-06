import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, BorderStyle, WidthType, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { DocumentBlock, Project, Phase, Allocation, ProjectCost, TeamMember, TeamCategory } from '@/lib/firebase/schema';

// Helper to strip HTML tags for simple rich text fallback
const stripHtml = (html: string) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

export const exportToDocx = async (
  project: Project,
  blocks: DocumentBlock[],
  phases: Phase[],
  allocations: Allocation[],
  costs: ProjectCost[],
  members: TeamMember[],
  categories: TeamCategory[]
) => {
  
  const docElements: any[] = [];
  
  // Document Title
  docElements.push(
    new Paragraph({
      text: `Fee Proposal: ${project.name}`,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 }
    })
  );

  for (const block of blocks) {
    if (block.title) {
      docElements.push(
        new Paragraph({
          text: block.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 }
        })
      );
    }

    if (block.type === 'rich_text') {
      // Basic HTML to Paragraphs mapping
      const paragraphs = block.content.split('</p>');
      for (const p of paragraphs) {
        const text = stripHtml(p).trim();
        if (text) {
          docElements.push(
            new Paragraph({
              children: [new TextRun(text)],
              spacing: { after: 200 }
            })
          );
        }
      }
    }
    else if (block.type === 'phase_scope') {
      for (const phase of phases) {
        docElements.push(
          new Paragraph({
            text: phase.name,
            heading: HeadingLevel.HEADING_2,
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
            text: phase.description || "No description provided.",
            spacing: { after: 300 }
          })
        );
      }
    }
    else if (block.type === 'financial_summary') {
      const tableRows = [
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Phase", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Duration", bold: true })] })], shading: { fill: "f1f5f9" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Cost", bold: true })] })], shading: { fill: "f1f5f9" } })
          ]
        })
      ];

      let totalProjectCost = 0;

      for (const phase of phases) {
        let phaseCost = 0;
        allocations.filter(a => a.phaseId === phase.id).forEach(a => {
          const m = members.find(m => m.id === a.memberId);
          if (m) phaseCost += a.hours * m.costPerHour;
        });
        costs.filter(c => c.phaseId === phase.id).forEach(c => {
          phaseCost += c.quantity * c.unitCost;
        });

        totalProjectCost += phaseCost;

        tableRows.push(
          new TableRow({
            children: [
              new TableCell({ children: [new Paragraph(phase.name)] }),
              new TableCell({ children: [new Paragraph(`${phase.durationWeeks} Weeks`)] }),
              new TableCell({ children: [new Paragraph(`$${phaseCost.toLocaleString()}`)] })
            ]
          })
        );
      }

      const profit = totalProjectCost * ((project.profitMargin || 30) / 100);
      const totalFee = totalProjectCost + profit;

      tableRows.push(
        new TableRow({
          children: [
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "Total Fee", bold: true })] })], columnSpan: 2, shading: { fill: "e2e8f0" } }),
            new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: "$1", bold: true })] })], shading: { fill: "e2e8f0" } })
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
