import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register Noto Sans font using public URLs that work in Next.js
Font.register({
  family: 'Noto Sans',
  fonts: [
    { src: '/fonts/NotoSans-Regular.ttf', fontWeight: 'normal' },
    { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 'bold' },
  ],
});

interface ATSScore {
  keywordMatch: number
  formatScore: number
  contentQuality: number
  readabilityScore: number
  structureScore: number
  overallScore: number
  recommendations: string[]
}

interface ATSPdfDocumentProps {
  atsContent: string
  atsScore?: ATSScore | null
  mode?: 'light' | 'dark'
}

const makeStyles = (mode: 'light' | 'dark') => {
  const theme = mode === 'dark' ? {
    background: '#181926',
    textPrimary: '#f4f4f4',
    textSecondary: '#a1a1aa',
    accent: '#38bdf8',
    sectionBg: '#232946',
  } : {
    background: '#ffffff',
    textPrimary: '#333333',
    textSecondary: '#666666',
    accent: '#007bff',
    sectionBg: '#f8f8f8',
  };

  return StyleSheet.create({
    page: {
      flexDirection: 'column',
      backgroundColor: theme.background,
      padding: 30,
      fontFamily: 'Noto Sans',
    },
    header: {
      marginBottom: 20,
      padding: 20,
      backgroundColor: theme.sectionBg,
      borderRadius: 8,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 10,
    },
    subtitle: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 10,
    },
    scoreContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    scoreText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.accent,
    },
    formatBadge: {
      backgroundColor: theme.accent,
      color: theme.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
      fontSize: 10,
      fontWeight: 'bold',
    },
    contentContainer: {
      flex: 1,
      backgroundColor: theme.sectionBg,
      padding: 20,
      borderRadius: 8,
      marginBottom: 20,
    },
    contentTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 15,
    },
    content: {
      fontSize: 11,
      lineHeight: 1.4,
      color: theme.textPrimary,
      fontFamily: 'Courier',
    },
    sectionHeader: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.accent,
      marginTop: 15,
      marginBottom: 8,
    },
    bulletPoint: {
      fontSize: 11,
      color: theme.textPrimary,
      marginLeft: 15,
      marginBottom: 4,
    },
    optimizationContainer: {
      backgroundColor: `${theme.accent}15`,
      padding: 15,
      borderRadius: 8,
      marginTop: 20,
    },
    optimizationTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.accent,
      marginBottom: 10,
    },
    optimizationText: {
      fontSize: 10,
      color: theme.textPrimary,
      lineHeight: 1.4,
      marginBottom: 4,
    },
  });
};

export function ATSPdfDocument({ atsContent, atsScore, mode = 'light' }: ATSPdfDocumentProps) {
  const styles = makeStyles(mode);

  const formatATSContent = (content: string) => {
    // Split content into sections and format for better PDF display
    const lines = content.split('\n');
    const formattedSections: { type: 'header' | 'content' | 'bullet', text: string }[] = [];

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.match(/^[A-Z\s]+$/)) {
        // Section headers (all caps)
        formattedSections.push({ type: 'header', text: trimmedLine });
      } else if (trimmedLine.startsWith('•') || trimmedLine.startsWith('-')) {
        // Bullet points
        formattedSections.push({ type: 'bullet', text: trimmedLine.replace(/^[•-]\s*/, '') });
      } else {
        // Regular content
        formattedSections.push({ type: 'content', text: trimmedLine });
      }
    });

    return formattedSections;
  };

  const formattedContent = formatATSContent(atsContent);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>ATS Optimized Resume</Text>
          <Text style={styles.subtitle}>Applicant Tracking System Compatible Format</Text>
          
          <View style={styles.scoreContainer}>
            {atsScore && (
              <Text style={styles.scoreText}>
                Score: {atsScore.overallScore}/100
              </Text>
            )}
            <Text style={styles.formatBadge}>LaTeX (.tex)</Text>
          </View>
        </View>

        {/* Content Section */}
        <View style={styles.contentContainer}>
          <Text style={styles.contentTitle}>Resume Content</Text>
          
          {formattedContent.map((section, index) => {
            switch (section.type) {
              case 'header':
                return (
                  <Text key={index} style={styles.sectionHeader}>
                    {section.text}
                  </Text>
                );
              case 'bullet':
                return (
                  <Text key={index} style={styles.bulletPoint}>
                    • {section.text}
                  </Text>
                );
              default:
                return (
                  <Text key={index} style={styles.content}>
                    {section.text}
                  </Text>
                );
            }
          })}
        </View>

        {/* ATS Optimization Info */}
        <View style={styles.optimizationContainer}>
          <Text style={styles.optimizationTitle}>✓ ATS Optimization Applied</Text>
          <Text style={styles.optimizationText}>• Clean, machine-readable formatting</Text>
          <Text style={styles.optimizationText}>• Standard section headings for easy parsing</Text>
          <Text style={styles.optimizationText}>• Optimized keyword placement</Text>
          <Text style={styles.optimizationText}>• Professional LaTeX structure</Text>
          <Text style={styles.optimizationText}>• Compatible with all major ATS systems</Text>
        </View>
      </Page>
    </Document>
  );
}
