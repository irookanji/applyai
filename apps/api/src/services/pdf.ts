import { PDFParse } from 'pdf-parse';

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: buffer });

  try {
    const result = await parser.getText();

    if (!result.text.trim()) {
      throw new Error('Could not extract text from PDF. Try a text-based PDF file.');
    }

    return result.text.trim();
  } finally {
    await parser.destroy();
  }
}
