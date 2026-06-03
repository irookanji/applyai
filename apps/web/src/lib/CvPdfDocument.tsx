import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    lineHeight: 1.5,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 20,
    color: '#4b5563',
  },
  bullet: {
    marginBottom: 6,
  },
});

type CvPdfDocumentProps = {
  readonly companyName: string;
  readonly jobTitle: string;
  readonly cvText: string;
};

export function CvPdfDocument({ companyName, jobTitle, cvText }: CvPdfDocumentProps) {
  const bullets = cvText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Tailored CV</Text>
        <Text style={styles.subtitle}>
          {companyName} — {jobTitle}
        </Text>
        <View>
          {bullets.map((bullet) => (
            <Text key={bullet} style={styles.bullet}>
              • {bullet.replace(/^[-•]\s*/, '')}
            </Text>
          ))}
        </View>
      </Page>
    </Document>
  );
}
