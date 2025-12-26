
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import * as FileSaver from "file-saver";
import { jsPDF } from "jspdf";
import { ResumeSection } from "../types";

export class ExportService {
  private static getSaveAs() {
    return (FileSaver as any).saveAs || (FileSaver as any).default?.saveAs || (FileSaver as any).default;
  }

  static async generateDocx(sections: ResumeSection[]) {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: sections.flatMap((section) => [
            new Paragraph({
              text: section.title.toUpperCase(),
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 240, after: 120 },
            }),
            ...section.content.split('\n').map(line => 
              new Paragraph({
                children: [new TextRun({ text: line, size: 22 })],
                spacing: { after: 80 },
                alignment: AlignmentType.JUSTIFY
              })
            ),
          ]),
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const saveAs = this.getSaveAs();
    saveAs(blob, "ATS_Optimized_Resume.docx");
  }

  static generateTxt(sections: ResumeSection[]) {
    let content = "";
    sections.forEach(section => {
      content += `${section.title.toUpperCase()}\n`;
      content += `${"=".repeat(section.title.length)}\n`;
      content += `${section.content}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const saveAs = this.getSaveAs();
    saveAs(blob, "ATS_Optimized_Resume.txt");
  }

  static async generatePdf(sections: ResumeSection[]) {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const maxLineWidth = pageWidth - margin * 2;
    const footerMargin = 15;

    // Calculate total height needed to decide on balancing
    let totalLines = 0;
    sections.forEach(s => {
      totalLines += 2; // Title + line
      totalLines += doc.splitTextToSize(s.content, maxLineWidth).length;
      totalLines += 1; // Spacing
    });

    // Heuristic for balancing: if total lines are slightly over one page, increase spacing
    const estimatedHeight = totalLines * 5;
    const isMultiPage = estimatedHeight > (pageHeight - margin * 2);
    const lineSpacing = (isMultiPage && estimatedHeight < (pageHeight * 1.3)) ? 6 : 5;

    let yOffset = margin;

    sections.forEach((section) => {
      const sectionLines = doc.splitTextToSize(section.content, maxLineWidth);
      const sectionHeight = 10 + (sectionLines.length * lineSpacing);

      // Better page break logic: If a section is small, don't split it. 
      // If it's big, split it but ensure at least 3 lines stay together.
      if (yOffset + 15 > pageHeight - footerMargin) {
        doc.addPage();
        yOffset = margin;
      }

      // Section Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 41, 59);
      doc.text(section.title.toUpperCase(), margin, yOffset);
      
      yOffset += 1.5;
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, yOffset, pageWidth - margin, yOffset);
      yOffset += 5;

      // Section Content
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(51, 65, 85);
      
      sectionLines.forEach((line: string) => {
        if (yOffset > pageHeight - footerMargin) {
          doc.addPage();
          yOffset = margin;
          // Re-draw title helper or just continue
        }
        doc.text(line, margin, yOffset);
        yOffset += lineSpacing;
      });

      yOffset += 4; // Space between sections
    });

    doc.save("ATS_Optimized_Resume.pdf");
  }
}
