import { pdf } from '@react-pdf/renderer';

import { resolveApplicantName } from '@applyai/shared';

import { CvPdfDocument } from './CvPdfDocument';

type DownloadCvPdfParams = {
  readonly applicantName?: string;
  readonly masterCvText?: string;
  readonly cvText: string;
};

export async function downloadCvPdf(params: DownloadCvPdfParams) {
  const applicantName = resolveApplicantName(params.applicantName, params.masterCvText);
  const blob = await pdf(<CvPdfDocument cvText={params.cvText} />).toBlob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${applicantName.replace(/\s+/g, '-')}-cv.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
