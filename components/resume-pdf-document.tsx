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

interface DesignProps {
  typography?: {
    fontFamily?: string;
    fontSize?: number;
    lineHeight?: number;
    paragraphSpacing?: number;
    headingFontFamily?: string;
    headingFontSize?: number;
  };
  colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    text?: string;
    background?: string;
  };
  layout?: {
    columns?: number;
    columnGap?: number;
    padding?: number;
    margin?: number;
  };
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
    featured_project?: any[];
  };
  design?: DesignProps;
}

// Define the structure for the ResumePreviewData content field (old structure)
interface OldResumeContent {
  name?: string;
  title?: string;
  contact?: {
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
  };
  objective?: string;
  summary?: string;
  experience?: Array<ExperienceItem>;
  education?: Array<EducationItem>;
  skills?: string[]; // Flat skills array
  certifications?: string[];
  languages?: string[];
  references?: any[];
}

// Define a combined interface to handle all potential input structures
interface ResumeDataInput extends NestedResumeData {
  // Add flat properties for backward compatibility with the old structure
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
  // Add the content field from the old ResumePreviewData
  content?: OldResumeContent;
}

// Register Noto Sans font with proper server-side paths
try {
  // On server-side, we need to use absolute paths to the public directory
  const isServer = typeof window === 'undefined';
  
  if (isServer) {
    const path = require('path');
    const publicDir = path.join(process.cwd(), 'public');
    
    Font.register({
      family: 'Noto Sans',
      fonts: [
        { src: path.join(publicDir, 'fonts/NotoSans-Regular.ttf') },
        { src: path.join(publicDir, 'fonts/NotoSans-Bold.ttf'), fontWeight: 'bold' },
        { src: path.join(publicDir, 'fonts/NotoSans-Italic.ttf'), fontStyle: 'italic' }
      ],
    });
  } else {
    // Client-side uses public URLs
    Font.register({
      family: 'Noto Sans',
      fonts: [
        { src: '/fonts/NotoSans-Regular.ttf' },
        { src: '/fonts/NotoSans-Bold.ttf', fontWeight: 'bold' },
        { src: '/fonts/NotoSans-Italic.ttf', fontStyle: 'italic' }
      ],
    });
  }
} catch (error) {
  console.warn('Failed to register Noto Sans fonts, using system fallback fonts:', error);
}

// Make styles is now a function that accepts theme and design props
// and returns a StyleSheet object.
const makeStyles = (theme: any, design: DesignProps) => StyleSheet.create({
  body: {
    fontFamily: design?.typography?.fontFamily || 'Noto Sans', // Use Noto Sans as primary, fallback to Helvetica
    fontSize: design?.typography?.fontSize || 10, // Default font size
    lineHeight: design?.typography?.lineHeight || 1.5,
    padding: design?.layout?.padding || 40,
    margin: design?.layout?.margin || 0,
    backgroundColor: theme.background,
    color: theme.textPrimary,
  },
  headerBlock: {
    marginBottom: design?.typography?.paragraphSpacing || 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.border,
  },
  name: {
    fontSize: design?.typography?.headingFontSize || 24,
    fontFamily: design?.typography?.headingFontFamily || 'Noto Sans', // Use Noto Sans as primary
    fontWeight: 'bold',
    marginBottom: 15,
    color: theme.textPrimary,
  },
  title: {
    fontSize: design?.typography?.fontSize || 14,
    marginBottom: 5,
    color: theme.textSecondary,
  },
  location: {
    fontSize: design?.typography?.fontSize || 12,
    color: theme.textSecondary,
  },
  contactRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
    gap: 8, // Add some gap between contact items
  },
  contactItem: {
    fontSize: design?.typography?.fontSize || 10,
    color: theme.textSecondary,
    // marginRight: 10, // Replaced by gap
  },
  objective: {
    marginTop: design?.typography?.paragraphSpacing || 10,
    fontSize: design?.typography?.fontSize || 10,
    color: theme.textPrimary,
  },
  twoColumnLayout: {
    flexDirection: 'row',
    marginTop: design?.typography?.paragraphSpacing || 20,
    gap: design?.layout?.columnGap || 20, // Use gap for space between columns
  },
  leftColumn: {
    // width: '30%', // Remove fixed width
    flex: 1, // Allow left column to take available space
    // paddingRight: design?.layout?.columnGap || 10, // Replaced by gap on twoColumnLayout
  },
  rightColumn: {
    // width: '70%', // Remove fixed width
    flex: 2, // Allow right column to take more space than left
    // paddingLeft: design?.layout?.columnGap || 10, // Replaced by gap on twoColumnLayout
  },
  section: {
    marginBottom: design?.typography?.paragraphSpacing || 20,
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: design?.typography?.headingFontSize || 16,
    fontFamily: design?.typography?.headingFontFamily || 'Noto Sans', // Use Noto Sans as primary
    fontWeight: 'bold',
    marginBottom: 5,
    color: theme.accent,
  },
  sectionLine: {
    borderBottomWidth: 1,
    borderBottomColor: theme.accent, // Use accent color for line
    marginBottom: 10,
    width: 50, // Give the line a fixed width
  },
  item: {
    marginBottom: 10,
  },
  itemTitle: {
    fontSize: design?.typography?.fontSize || 12,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  itemSubtitle: {
    fontSize: design?.typography?.fontSize || 10,
    color: theme.textSecondary,
    marginBottom: 5,
  },
  highlights: {
    marginLeft: 10,
  },
  highlight: {
    fontSize: design?.typography?.fontSize || 10,
    color: theme.textPrimary,
    marginBottom: 3,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 5,
    gap: 5, // Add gap between skill tags
  },
  skillTag: {
    fontSize: design?.typography?.fontSize ? design.typography.fontSize * 0.9 : 9, // Slightly smaller font for tags
    backgroundColor: theme.tagBg,
    color: theme.tagText,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
   languageList: {
    flexDirection: 'row', // Keep languages in a row
    flexWrap: 'wrap', // Allow wrapping if needed
    marginBottom: 5,
     gap: 5, // Add gap between languages
  },
  languageItem: {
    fontSize: design?.typography?.fontSize || 10,
    color: theme.textPrimary,
    // marginRight: 10, // Replaced by gap
  }
});

export function ResumePdfDocument({ resumeData, mode = 'light' }: { resumeData: ResumeDataInput | null; mode?: string }) {
  // Process data to a consistent structure, prioritizing content field if available
  const data = resumeData || {};
  const contentData = (data as ResumeDataInput)?.content; // Use optional chaining here
  const isNestedGroq = (data as NestedResumeData)?.header !== undefined || (data as NestedResumeData)?.sections !== undefined; // Use optional chaining

  // Safely access nested properties
  const name = contentData?.name || data?.name || (data as NestedResumeData)?.header?.name || '';
  const title = contentData?.title || data?.title || (data as NestedResumeData)?.header?.title || '';
  const location = contentData?.contact?.location || data?.location || (data as NestedResumeData)?.header?.location || '';
  const contacts = contentData?.contact ? [
      ...(contentData.contact.email ? [{ type: 'email', value: contentData.contact.email }] : []),
      ...(contentData.contact.phone ? [{ type: 'phone', value: contentData.contact.phone }] : []),
      ...(contentData.contact.location && !location.includes(contentData.contact.location) ? [{ type: 'location', value: contentData.contact.location }] : []), // Avoid duplicating location if already used and accessed via root/header
      ...(contentData.contact.linkedin ? [{ type: 'linkedin', value: contentData.contact.linkedin }] : []),
    ].filter(c => c.value) // Filter out empty contact objects
    : data?.contacts || (data as NestedResumeData)?.header?.contacts || [];
  const objective = contentData?.objective || contentData?.summary || data?.objective || data?.summary || (data as NestedResumeData)?.header?.objective || (data as NestedResumeData)?.header?.summary || '';
  const experience = contentData?.experience || data?.experience || (data as NestedResumeData)?.sections?.experience || [];
  const education = contentData?.education || data?.education || (data as NestedResumeData)?.sections?.education || [];
  // Flatten nested skills or use flat skills array
  const skills = contentData?.skills || data?.skills || (isNestedGroq ? ((data as NestedResumeData)?.sections?.skills || []).flatMap(s => s.skills || []) : []) || [];
  const languages = contentData?.languages || data?.languages || (isNestedGroq ? (data as NestedResumeData)?.sections?.languages : []) || [];
  const certifications = contentData?.certifications || data?.certifications || (isNestedGroq ? (data as NestedResumeData)?.sections?.certifications : []) || [];
  const references = contentData?.references || data?.references || (isNestedGroq ? (data as NestedResumeData)?.sections?.references : []) || [];
  const featured_project = (isNestedGroq ? (data as NestedResumeData)?.sections?.featured_project : []) || []; // Assuming this only exists in the new structure

  const designProps = (data as NestedResumeData)?.design || {}; // Access design props from the new structure

  // Define a simple theme based on light/dark mode - can be expanded later
  const theme = mode === 'dark' ? {
    background: '#181926',
    textPrimary: '#f4f4f4',
    textSecondary: '#a1a1aa',
    accent: designProps?.colors?.accent || '#38bdf8', // Use design color if provided, fallback to theme
    sectionBg: '#232946',
    tagBg: '#334155',
    tagText: designProps?.colors?.accent || '#38bdf8', // Use design color if provided, fallback to theme
    border: '#334155',
    headerBg: '#232946', // Solid background for header for simplicity
  } : { // Light mode (default)
    background: '#ffffff',
    textPrimary: '#333333',
    textSecondary: '#666666',
    accent: designProps?.colors?.accent || '#007bff', // Use design color if provided, fallback to theme
    sectionBg: '#f8f8f8',
    tagBg: '#e9e9eb',
    tagText: designProps?.colors?.accent || '#007bff', // Use design color if provided, fallback to theme
    border: '#dddddd',
    headerBg: '#eeeeee', // Solid background for header for simplicity
  };

  const styles = makeStyles(theme, designProps);

  // Helper to render sections using processedData
  const renderEducation = (education: EducationItem[]) => (
    education && education.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Education</Text>
        <View style={styles.sectionLine} />
        {education.map((item, i) => (
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
    ) : null // Don't render section if empty
  );

  const renderExperience = (experience: ExperienceItem[]) => (
    experience && experience.length > 0 ? (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Experience</Text>
        <View style={styles.sectionLine} />
        {experience.map((item, i) => (
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
    ) : null // Don't render section if empty
  );

  const renderSkills = (skills: string[]) => {
    return (
      skills && skills.length > 0 ? (
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
      ) : null
    );
  };

  const renderLanguages = (languages: string[]) => {
    return (
      languages && languages.length > 0 ? (
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
      ) : null
    );
  };

  const renderFeaturedProjects = (projects: any[]) => {
     return (
      projects && projects.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Projects</Text>
          <View style={styles.sectionLine} />
          {/* Render project details here based on your JSON structure */}
           {/* Example: */}
           {/* {projects.map((project, i) => (
             <View key={i} style={styles.item}>
               <Text style={styles.itemTitle}>{project?.name}</Text>
                <Text style={styles.itemSubtitle}>{project?.dates}</Text>
               <Text style={styles.highlight}>{project?.description}</Text>
             </View>
           ))} */}
            <Text>Rendering for Featured Projects not yet implemented based on specific JSON structure.</Text>
        </View>
      ) : null
    );
  };

  // Add similar render functions for other sections (certifications, references, etc.) if needed

  return (
    <Document>
      <Page style={styles.body}>
        {/* Header Section */}
        <View style={styles.headerBlock}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.location}>{location}</Text>
          {contacts && contacts.length > 0 && (
            <View style={styles.contactRow}>
              {contacts.map((c, i) => (
                // Added null/undefined checks for c.value
                c && c.value ? <Text key={i} style={styles.contactItem}>{c.value}</Text> : null
              ))}
            </View>
          )}
           {objective ? <Text style={styles.objective}>{objective}</Text> : null}
        </View>

        {/* Main Content - Using two-column layout if specified in design */}
         {designProps?.layout?.columns === 2 || designProps?.layout === undefined ? (
           <View style={styles.twoColumnLayout}>
             {/* Left Column */}
             <View style={styles.leftColumn}>
               {renderEducation(education)}
               {renderSkills(skills)}
               {renderLanguages(languages)}
               {/* Add other sections for left column as needed */}
             </View>
             {/* Right Column */}
             <View style={styles.rightColumn}>
               {renderExperience(experience)}
                {renderFeaturedProjects(featured_project)}
               {/* Add other sections for right column as needed */}
             </View>
           </View>
         ) : (
           /* Single Column Layout */
            <View>
              {renderExperience(experience)}
              {renderEducation(education)}
              {renderSkills(skills)}
               {renderLanguages(languages)}
               {renderFeaturedProjects(featured_project)}
               {/* Add other sections for single column as needed */}
            </View>
         )}

      </Page>
    </Document>
  );
}
 