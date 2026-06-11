import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

import type { CvLineKind } from '@applyai/shared';
import {
  classifyCvLine,
  fitCvToOnePage,
  getCvPdfPagePadding,
  getCvPdfScale,
  splitCvLines,
} from '@applyai/shared';

type CvPdfLine = {
  readonly key: string;
  readonly kind: CvLineKind;
  readonly content: string;
};

type CvPdfDocumentProps = {
  readonly cvText: string;
};

const buildPdfLines = (cvText: string): CvPdfLine[] => {
  const seen = new Map<string, number>();

  return splitCvLines(cvText).flatMap((line, lineIndex) => {
    const trimmed = line.trim();
    if (!trimmed) {
      return [];
    }

    const kind = classifyCvLine(trimmed, lineIndex);
    const content = kind === 'bullet' ? trimmed.replace(/^[-•*]\s*/, '') : trimmed;
    const count = seen.get(content) ?? 0;
    seen.set(content, count + 1);

    return [{ key: `${content}::${count}`, kind, content }];
  });
};

const createScaledStyles = (scale: number, pagePadding: number) => {
  const size = (value: number) => Math.max(value * scale, value * 0.65);

  return StyleSheet.create({
    page: {
      padding: pagePadding,
      fontSize: size(10),
      lineHeight: 1.35,
      fontFamily: 'Helvetica',
    },
    name: {
      fontSize: size(18),
      marginTop: size(4),
      marginBottom: size(2),
      fontWeight: 'bold',
    },
    contact: {
      fontSize: size(9),
      marginBottom: size(8),
      color: '#374151',
    },
    section: {
      fontSize: size(10),
      marginTop: size(10),
      marginBottom: size(4),
      fontWeight: 'bold',
      letterSpacing: 0.4,
    },
    subheading: {
      fontSize: size(9.5),
      marginTop: size(6),
      marginBottom: size(1),
      fontWeight: 'bold',
    },
    bullet: {
      marginBottom: size(2),
      paddingLeft: size(6),
    },
    text: {
      marginBottom: size(2),
    },
  });
};

export const CvPdfDocument = ({ cvText }: CvPdfDocumentProps) => {
  const lines = buildPdfLines(fitCvToOnePage(cvText));
  const totalChars = lines.reduce((sum, line) => sum + line.content.length, 0);
  const scale = getCvPdfScale(lines.length, totalChars);
  const styles = createScaledStyles(scale, getCvPdfPagePadding(scale));

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap={false}>
        <View>
          {lines.map((line) => {
            switch (line.kind) {
              case 'name':
                return (
                  <Text key={line.key} style={styles.name}>
                    {line.content}
                  </Text>
                );
              case 'contact':
                return (
                  <Text key={line.key} style={styles.contact}>
                    {line.content}
                  </Text>
                );
              case 'section':
                return (
                  <Text key={line.key} style={styles.section}>
                    {line.content}
                  </Text>
                );
              case 'subheading':
                return (
                  <Text key={line.key} style={styles.subheading}>
                    {line.content}
                  </Text>
                );
              case 'bullet':
                return (
                  <Text key={line.key} style={styles.bullet}>
                    • {line.content}
                  </Text>
                );
              default:
                return (
                  <Text key={line.key} style={styles.text}>
                    {line.content}
                  </Text>
                );
            }
          })}
        </View>
      </Page>
    </Document>
  );
};
