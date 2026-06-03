import { pdf } from '@react-pdf/renderer';

import { CvPdfDocument } from './CvPdfDocument';

type DownloadCvPdfParams = {
  readonly companyName: string;
  readonly jobTitle: string;
  readonly cvText: string;
};

export async function downloadCvPdf(params: DownloadCvPdfParams) {
  const blob = await pdf(<CvPdfDocument {...params} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${params.companyName.replace(/\s+/g, '-')}-cv.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
