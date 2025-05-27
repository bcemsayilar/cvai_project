import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Define interfaces based on the potential JSON structures
// Adding optional chaining for robustness

interface Contact {
  type?: string;
  value?: string;
}

interface EducationItem {
  degree?: string;
  institution?: string;
  location?: string;
  dates?: string;
  details?: string[];
}

interface ExperienceItem {
  position?: string;
  company?: string;
  location?: string;
  dates?: string;
  highlights?: string[];
  tags?: string[];
}

interface SkillsItem {
  category?: string;
  skills?: string[];
}

// Define the structure for the nested Groq output
interface NestedResumeData {
  header?: {
    name?: string;
    title?: string;
    location?: string;
    contacts?: Contact[];
    objective?: string;
    summary?: string;
  };
  sections?: {
    experience?: ExperienceItem[];
    education?: EducationItem[];
    skills?: SkillsItem[];
    certifications?: string[];
    languages?: string[];
    references?: any[];
  };
  design?: any;
}

// Define the structure for the ResumePreviewData content field
interface ResumeContent {
  name?: string
  title?: string
  contact?: {
    email?: string
    phone?: string
    location?: string
    linkedin?: string
  }
  objective?: string
  summary?: string
  experience?: Array<ExperienceItem>
  education?: Array<EducationItem>
  skills?: string[]
  certifications?: string[]
  languages?: string[]
  references?: any[];
}

// Define a combined interface to handle all potential input structures
interface ResumeDataInput extends NestedResumeData {
  // Add flat properties for backward compatibility
  name?: string;
  title?: string;
  location?: string;
  contacts?: Contact[];
  objective?: string;
  summary?: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string[]; // Flat skills array
  certifications?: string[];
  languages?: string[];
  references?: any[];
  // Add the content field from ResumePreviewData
  content?: ResumeContent;
}

// Use built-in font Times-Roman
// Font.register is not needed for built-in fonts
// Font.register({
//   family: 'Inter',
//   src: 'https://fonts.gstatic.com/s/inter/v12/UcCOGsMdependinggUcQbWaKucowKftvg.woff2'
// });


export function ResumePdfDocument({ resumeData, mode = 'light' }: { resumeData: ResumeDataInput | null; mode?: string }) {
  // Process data to a consistent structure, prioritizing content field if available
  const data = resumeData || {};
  const contentData = (data as ResumeDataInput).content;
  const isNestedGroq = (data as NestedResumeData).header !== undefined || (data as NestedResumeData).sections !== undefined;

  const processedData = {
    name: contentData?.name || (isNestedGroq ? (data as NestedResumeData).header?.name : (data as ResumeDataInput).name) || '',
    title: contentData?.title || (isNestedGroq ? (data as NestedResumeData).header?.title : (data as ResumeDataInput).title) || '',
    location: contentData?.contact?.location || (isNestedGroq ? (data as NestedResumeData).header?.location : (data as ResumeDataInput).location) || '',
    contacts: contentData?.contact ? [
        ...(contentData.contact.email ? [{ type: 'email', value: contentData.contact.email }] : []),
        ...(contentData.contact.phone ? [{ type: 'phone', value: contentData.contact.phone }] : []),
        ...(contentData.contact.location && !contentData.contact.location ? [{ type: 'location', value: contentData.contact.location }] : []), // Avoid duplicating location if already used
        ...(contentData.contact.linkedin ? [{ type: 'linkedin', value: contentData.contact.linkedin }] : []),
      ] : (isNestedGroq ? (data as NestedResumeData).header?.contacts : (data as ResumeDataInput).contacts) || [],
    objective: contentData?.objective || contentData?.summary || (isNestedGroq ? (data as NestedResumeData).header?.objective || (data as NestedResumeData).header?.summary : (data as ResumeDataInput).objective || (data as ResumeDataInput).summary) || '',
    experience: contentData?.experience || (isNestedGroq ? (data as NestedResumeData).sections?.experience : (data as ResumeDataInput).experience) || [],
    education: contentData?.education || (isNestedGroq ? (data as NestedResumeData).sections?.education : (data as ResumeDataInput).education) || [],
    // Flatten nested skills or use flat skills array
    skills: contentData?.skills || (isNestedGroq ? ((data as NestedResumeData).sections?.skills || []).flatMap(s => s.skills || []) : (data as ResumeDataInput).skills) || [],
    languages: contentData?.languages || (isNestedGroq ? (data as NestedResumeData).sections?.languages : (data as ResumeDataInput).languages) || [],
    // Add other sections here as they are added to the interfaces
    certifications: contentData?.certifications || (isNestedGroq ? (data as NestedResumeData).sections?.certifications : (data as ResumeDataInput).certifications) || [],
    references: contentData?.references || (isNestedGroq ? (data as NestedResumeData).sections?.references : (data as ResumeDataInput).references) || [],

  };

  // Define a simple theme based on light/dark mode - can be expanded later
  const theme = mode === 'dark' ? {
    background: '#181926',
    textPrimary: '#f4f4f4',
    textSecondary: '#a1a1aa',
    accent: '#38bdf8',
    sectionBg: '#232946',
    tagBg: '#334155',
    tagText: '#38bdf8',
    border: '#334155',
    headerBg: '#232946', // Solid background for header for simplicity
  } : { // Light mode (default)
    background: '#ffffff',
    textPrimary: '#333333',
    textSecondary: '#666666',
    accent: '#007bff',
    sectionBg: '#f8f8f8',
    tagBg: '#e9e9eb',
    tagText: '#007bff',
    border: '#dddddd',
    headerBg: '#eeeeee', // Solid background for header for simplicity
  };

  const styles = makeStyles(theme);

  // Helper to render sections using processedData
  const renderEducation = (education: EducationItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Education</Text>
      <View style={styles.sectionLine} />
      {(education || []).map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemTitle}>{item?.degree || ''}{item?.degree && item?.institution ? ' — ' : ''}{item?.institution || ''}</Text>
          <Text style={styles.itemSubtitle}>{item?.location || ''}{item?.location && item?.dates ? ' | ' : ''}{item?.dates || ''}</Text>
          {(item?.details || []).length > 0 && (
            <View style={styles.highlights}>
              {(item?.details || []).map((detail: string, j: number) => (
                <Text key={j} style={styles.highlight}>• {detail}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderExperience = (experience: ExperienceItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Experience</Text>
      <View style={styles.sectionLine} />
      {(experience || []).map((item, i) => (
        <View key={i} style={styles.item}>
          <Text style={styles.itemTitle}>{item?.position || ''}{item?.position && item?.company ? ' @ ' : ''}{item?.company || ''}</Text>
          <Text style={styles.itemSubtitle}>{item?.location || ''}{item?.location && item?.dates ? ' | ' : ''}{item?.dates || ''}</Text>
          {(item?.tags || []).length > 0 && (
            <View style={styles.skillsList}>
              {(item?.tags || []).map((tag: string, j: number) => (
                <Text key={j} style={styles.skillTag}>{tag}</Text>
              ))}
            </View>
          )}
          {(item?.highlights || []).length > 0 && (
            <View style={styles.highlights}>
              {(item?.highlights || []).map((hl: string, j: number) => (
                <Text key={j} style={styles.highlight}>• {hl}</Text>
              ))}
            </View>
          )}
        </View>
      ))}
    </View>
  );

  const renderSkills = (skills: string[]) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills & Tools</Text>
        <View style={styles.sectionLine} />
         {(skills || []).length > 0 && (
              <View style={styles.skillsList}>
                {(skills || []).map((skill: string, j: number) => (
                  <Text key={j} style={styles.skillTag}>{skill}</Text>
                ))}
              </View>
            )}
      </View>
    );
  };

   const renderLanguages = (languages: string[]) => {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Languages</Text>
        <View style={styles.sectionLine} />
         {(languages || []).length > 0 && (
              <View style={styles.languageList}>
                {(languages || []).map((lang: string, j: number) => (
                  <Text key={j} style={styles.languageItem}>{lang}</Text>
                ))}
              </View>
            )}
      </View>
    );
  };


  // Add similar render functions for other sections (certifications, references, etc.) if needed

  return (
    <Document>
      <Page style={styles.body}>
        {/* Header Section */}
        <View style={styles.headerBlock}>
          <Text style={styles.name}>{processedData.name}</Text>
          <Text style={styles.title}>{processedData.title}</Text>
          <Text style={styles.location}>{processedData.location}</Text>
          {(processedData.contacts || []).length > 0 && (
            <View style={styles.contactRow}>
              {(processedData.contacts || []).map((c, i) => (
                // Added null/undefined checks for c.value
                c && c.value ? <Text key={i} style={styles.contactItem}>{c.value}</Text> : null
              ))}
            </View>
          )}
        </View>

        {/* Main Content: Two Columns */}
        <View style={styles.mainContent}>
          {/* Left Column */}
          <View style={styles.leftCol}>
            {processedData.education.length > 0 && renderEducation(processedData.education)}
            {processedData.skills.length > 0 && renderSkills(processedData.skills)}
             {processedData.languages.length > 0 && renderLanguages(processedData.languages)}
            {/* Add other left column sections here */}
          </View>

          {/* Right Column */}
          <View style={styles.rightCol}>
            {processedData.experience.length > 0 && renderExperience(processedData.experience)}
            {/* Add other right column sections here */}
          </View>
        </View>
      </Page>
    </Document>
  );
}

function makeStyles(theme: any) {
  return StyleSheet.create({
    body: {
      padding: 30,
      fontSize: 10, // Slightly smaller base font size
      fontFamily: 'Times-Roman', // Using built-in font
      color: theme.textPrimary,
      backgroundColor: theme.background,
    },
    headerBlock: {
      marginBottom: 20,
      paddingBottom: 15,
      borderBottom: `1pt solid ${theme.border}`,
    },
    name: {
      fontSize: 28, // Larger font size for name
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 2,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    title: {
      fontSize: 14,
      color: theme.textSecondary,
      marginBottom: 4,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    location: {
      fontSize: 10,
      color: theme.textSecondary,
      marginBottom: 8,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    contactRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
      marginTop: 4,
    },
    contactItem: {
      fontSize: 9, // Slightly smaller for contact items
      color: theme.textSecondary,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    mainContent: {
      flexDirection: 'row',
      gap: 30,
    },
    leftCol: {
      flex: 1.5,
      // paddingRight: 15,
      // borderRight: `1pt solid ${theme.border}`, // Example border if needed
    },
    rightCol: {
      flex: 3,
      // paddingLeft: 15,
    },
    section: {
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: 'bold',
      color: theme.accent,
      marginBottom: 5,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
     sectionLine: {
      height: 1,
      backgroundColor: theme.accent,
      marginBottom: 8,
      width: 40,
    },
    item: {
      marginBottom: 12,
    },
    itemTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: theme.textPrimary,
      marginBottom: 2,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    itemSubtitle: {
      fontSize: 10,
      color: theme.textSecondary,
      marginBottom: 4,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    highlights: {
      marginLeft: 8,
    },
    highlight: {
      fontSize: 10,
      color: theme.textPrimary,
      marginBottom: 2,
      fontFamily: 'Times-Roman', // Ensure font is applied
    },
    skillsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 5,
        marginTop: 5, // Add some space above skills list
    },
    skillTag: {
        fontSize: 9,
        backgroundColor: theme.tagBg,
        color: theme.tagText,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 3,
        fontFamily: 'Times-Roman', // Ensure font is applied
    },
    languageList: {
        flexDirection: 'column',
        gap: 3,
        marginTop: 5, // Add some space above language list
    },
    languageItem: {
        fontSize: 10,
        color: theme.textPrimary,
        fontFamily: 'Times-Roman', // Ensure font is applied
    }
  });
}
 