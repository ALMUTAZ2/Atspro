
declare const pdfjsLib: any;
declare const mammoth: any;

export class DocumentService {
  static async extractText(file: File): Promise<string> {
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'pdf') {
      return await this.extractFromPdf(file);
    } else if (extension === 'docx' || extension === 'doc') {
      return await this.extractFromDocx(file);
    } else {
      throw new Error('Unsupported file format. Please upload PDF or Word files.');
    }
  }

  private static async extractFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    // Initialize PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  private static async extractFromDocx(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value;
  }
}
