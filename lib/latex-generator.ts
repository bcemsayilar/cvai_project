// LaTeX Resume Generator
// Converts structured resume data to clean LaTeX format optimized for ATS

interface ResumeData {
  name: string;
  title?: string;
  location?: string;
  contacts: Array<{
    type: string;
    value: string;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    location?: string;
    dates: string;
    details?: string[];
  }>;
  experience: Array<{
    position: string;
    company: string;
    location?: string;
    dates: string;
    highlights?: string[];
    tags?: string[];
  }>;
  skills?: string[];
  featured_project?: Array<{
    name: string;
    description: string;
    technologies?: string[];
  }>;
}

// New utility function to convert LaTeX data structure to React PDF format
export function convertLatexDataToReactPdf(latexData: ResumeData): any {
  return {
    content: {
      name: latexData.name,
      title: latexData.title,
      contact: {
        location: latexData.location,
        // Convert contacts array to individual fields
        ...latexData.contacts.reduce((acc, contact) => {
          switch (contact.type.toLowerCase()) {
            case 'email':
              acc.email = contact.value;
              break;
            case 'phone':
              acc.phone = contact.value;
              break;
            case 'linkedin':
              acc.linkedin = contact.value;
              break;
          }
          return acc;
        }, {} as any)
      },
      experience: latexData.experience || [],
      education: latexData.education || [],
      skills: latexData.skills || [],
      featured_project: latexData.featured_project || []
    },
    design: {
      // ATS-optimized design with minimal styling
      typography: {
        fontFamily: 'Noto Sans',
        fontSize: 10,
        headingFontSize: 14,
        lineHeight: 1.3
      },
      layout: {
        columns: 1, // Single column for ATS compatibility
        padding: 30,
        margin: 0
      },
      colors: {
        accent: '#000000', // Black for maximum compatibility
        background: '#ffffff',
        textPrimary: '#000000',
        textSecondary: '#333333'
      }
    }
  };
}

export function generateATSLatexResume(data: ResumeData): string {
  const {
    name,
    title,
    location,
    contacts,
    education,
    experience,
    skills,
    featured_project
  } = data;

  // Build contact information line
  const contactInfo = contacts
    .map(contact => escapeLaTeX(contact.value))
    .join(' $\\cdot$ ');

  // Generate LaTeX content
  const latex = `\\documentclass[a4paper]{article}
    \\usepackage{fullpage}
    \\usepackage{amsmath}
    \\usepackage{amssymb}
    \\usepackage{textcomp}
    \\usepackage[utf8]{inputenc}
    \\usepackage[T1]{fontenc}
    \\textheight=10in
    \\pagestyle{empty}
    \\raggedright
    \\usepackage[left=0.8in,right=0.8in,bottom=0.8in,top=0.8in]{geometry}

\\def\\bull{\\vrule height 0.8ex width .7ex depth -.1ex }

% DEFINITIONS FOR RESUME %%%%%%%%%%%%%%%%%%%%%%%

\\newcommand{\\area} [2] {
    \\vspace*{-9pt}
    \\begin{verse}
        \\textbf{#1}   #2
    \\end{verse}
}

\\newcommand{\\lineunder} {
    \\vspace*{-8pt} \\\\
    \\hspace*{-18pt} \\hrulefill \\\\
}

\\newcommand{\\header} [1] {
    {\\hspace*{-18pt}\\vspace*{6pt} \\textsc{#1}}
    \\vspace*{-6pt} \\lineunder
}

\\newcommand{\\employer} [3] {
    { \\textbf{#1} (#2)\\\\ \\underline{\\textbf{\\emph{#3}}}\\\\  }
}

\\newcommand{\\contact} [3] {
    \\vspace*{-10pt}
    \\begin{center}
        {\\Huge \\scshape {#1}}\\\\
        #2 \\\\ #3
    \\end{center}
    \\vspace*{-8pt}
}

\\newenvironment{achievements}{
    \\begin{list}
        {$\\bullet$}{\\topsep 0pt \\itemsep -2pt}}{\\vspace*{4pt}
    \\end{list}
}

\\newcommand{\\schoolwithcourses} [4] {
    \\textbf{#1} #2 $\\bullet$ #3\\\\
    #4 \\\\
    \\vspace*{5pt}
}

\\newcommand{\\school} [4] {
    \\textbf{#1} #2 $\\bullet$ #3\\\\
    #4 \\\\
}
% END RESUME DEFINITIONS %%%%%%%%%%%%%%%%%%%%%%%

    \\begin{document}
\\vspace*{-40pt}

%==== Profile ====%
\\vspace*{-10pt}
\\begin{center}
{\\Huge \\scshape ${escapeLaTeX(name)}}\\\\
\t${location ? escapeLaTeX(location) + ' $\\cdot$ ' : ''}${contactInfo}\\\\
\\end{center}

${title ? `\\header{Profile}\n${escapeLaTeX(title)}\\\\
\\vspace*{2mm}\n\n` : ''}

%==== Experience ====%
\\header{Experience}
\\vspace{1mm}

${experience.map(exp => generateExperienceSection(exp)).join('\n\n')}

%==== Education ====%
\\header{Education}
${education.map(edu => generateEducationSection(edu)).join('\n')}

${skills && skills.length > 0 ? `\\header{Skills}
${skills.join(', ')}\\\\
\\vspace*{2mm}
` : ''}

${featured_project && featured_project.length > 0 ? `\\header{Projects}
${featured_project.map(proj => generateProjectSection(proj)).join('\n\n')}
` : ''}

\\ 
\\end{document}`;

  return latex;
}

function generateExperienceSection(exp: ResumeData['experience'][0]): string {
  const { position, company, location, dates, highlights } = exp;
  
  return `\\textbf{${escapeLaTeX(company)}} \\hfill ${location ? escapeLaTeX(location) : ''}\\\\
\\textit{${escapeLaTeX(position)}} \\hfill ${escapeLaTeX(dates)}\\\\
\\vspace{-1mm}
${highlights && highlights.length > 0 ? `\\begin{itemize} \\itemsep 1pt
${highlights.map(highlight => `\t\\item ${escapeLaTeX(highlight)}`).join('\n')}
\\end{itemize}` : ''}`;
}

function generateEducationSection(edu: ResumeData['education'][0]): string {
  const { degree, institution, location, dates, details } = edu;
  
  return `\\textbf{${escapeLaTeX(institution)}}\\hfill ${location ? escapeLaTeX(location) : ''}\\\\
${escapeLaTeX(degree)} \\textit{} \\hfill ${escapeLaTeX(dates)}\\\\
${details && details.length > 0 ? `\\vspace{-1mm}
\\begin{itemize} \\itemsep 1pt
${details.map(detail => `\t\\item ${escapeLaTeX(detail)}`).join('\n')}
\\end{itemize}` : ''}
\\vspace{2mm}`;
}

function generateProjectSection(proj: { name: string; description: string; technologies?: string[] }): string {
  const { name, description, technologies } = proj;
  
  return `\\textbf{${escapeLaTeX(name)}}\\\\
${escapeLaTeX(description)}${technologies && technologies.length > 0 ? ` (${technologies.map(escapeLaTeX).join(', ')})` : ''}\\\\`;
}

function escapeLaTeX(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/\\/g, '\\textbackslash')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde');
}

export type { ResumeData };

// Function to extract structured data from LaTeX content
export function extractDataFromLatex(latexContent: string): any {
  try {
    // Extract name from LaTeX content
    const nameMatch = latexContent.match(/\\scshape\s*\{([^}]+)\}/);
    const name = nameMatch ? nameMatch[1].trim() : 'Resume';

    // Extract contact information
    const contactMatches = latexContent.match(/\{\\Huge[^}]+\}\\\\([^\\]+)\\\\/);
    const contactInfo = contactMatches ? contactMatches[1].trim() : '';
    
    // Parse contact information
    const contacts: Array<{type: string; value: string}> = [];
    if (contactInfo) {
      const parts = contactInfo.split('$\\cdot$').map(part => part.trim());
      parts.forEach(part => {
        if (part.includes('@')) {
          contacts.push({type: 'email', value: part});
        } else if (part.match(/^\+?\d/)) {
          contacts.push({type: 'phone', value: part});
        } else if (part.includes('linkedin') || part.includes('www.')) {
          contacts.push({type: 'linkedin', value: part});
        }
      });
    }

    // Extract location separately
    let location = '';
    if (contactInfo) {
      const parts = contactInfo.split('$\\cdot$').map(part => part.trim());
      const locationPart = parts.find(part => 
        !part.includes('@') && 
        !part.match(/^\+?\d/) && 
        !part.includes('linkedin') && 
        !part.includes('www.')
      );
      if (locationPart) location = locationPart;
    }

    // Extract profile/title
    const profileMatch = latexContent.match(/\\header\{Profile\}([^\\]+)/);
    const title = profileMatch ? profileMatch[1].trim() : '';

    // Extract experience section
    const experience: any[] = [];
    const expMatches = latexContent.match(/\\header\{Experience\}([^\\]+(?:\\textbf\{[^}]+\}[^\\]*)*)/);
    if (expMatches) {
      const expContent = expMatches[1];
      const jobMatches = expContent.match(/\\textbf\{([^}]+)\}[^\\]*\\\\[^\\]*\\textit\{([^}]+)\}[^\\]*\\\\([^\\]*(?:\\item[^\\]*)*)/g);
      
      if (jobMatches) {
        jobMatches.forEach(job => {
          const companyMatch = job.match(/\\textbf\{([^}]+)\}/);
          const positionMatch = job.match(/\\textit\{([^}]+)\}/);
          const company = companyMatch ? companyMatch[1] : '';
          const position = positionMatch ? positionMatch[1] : '';
          
          // Extract highlights
          const highlights: string[] = [];
          const itemMatches = job.match(/\\item\s*([^\\]+)/g);
          if (itemMatches) {
            itemMatches.forEach(item => {
              const highlight = item.replace(/\\item\s*/, '').trim();
              if (highlight) highlights.push(highlight);
            });
          }
          
          if (company && position) {
            experience.push({
              company,
              position,
              dates: '', // LaTeX format doesn't always have clear date extraction
              highlights
            });
          }
        });
      }
    }

    // Extract education section
    const education: any[] = [];
    const eduMatches = latexContent.match(/\\header\{Education\}([^\\]+(?:\\textbf\{[^}]+\}[^\\]*)*)/);
    if (eduMatches) {
      const eduContent = eduMatches[1];
      const schoolMatches = eduContent.match(/\\textbf\{([^}]+)\}[^\\]*\\\\([^\\]*)/g);
      
      if (schoolMatches) {
        schoolMatches.forEach(school => {
          const institutionMatch = school.match(/\\textbf\{([^}]+)\}/);
          const degreeMatch = school.match(/\\\\([^\\]+)/);
          const institution = institutionMatch ? institutionMatch[1] : '';
          const degree = degreeMatch ? degreeMatch[1].trim() : '';
          
          if (institution) {
            education.push({
              institution,
              degree,
              dates: '',
              details: []
            });
          }
        });
      }
    }

    // Extract skills
    const skillsMatch = latexContent.match(/\\header\{Skills\}([^\\]+)/);
    const skills = skillsMatch ? 
      skillsMatch[1].split(',').map(skill => skill.trim()).filter(skill => skill && skill !== '\\\\') 
      : [];

    // Extract projects
    const projects: any[] = [];
    const projectsMatch = latexContent.match(/\\header\{Projects\}([^\\]+(?:\\textbf\{[^}]+\}[^\\]*)*)/);
    if (projectsMatch) {
      const projectContent = projectsMatch[1];
      const projectMatches = projectContent.match(/\\textbf\{([^}]+)\}[^\\]*\\\\([^\\]*)/g);
      
      if (projectMatches) {
        projectMatches.forEach(project => {
          const nameMatch = project.match(/\\textbf\{([^}]+)\}/);
          const descMatch = project.match(/\\\\([^\\]+)/);
          const projectName = nameMatch ? nameMatch[1] : '';
          const description = descMatch ? descMatch[1].trim() : '';
          
          if (projectName) {
            projects.push({
              name: projectName,
              description
            });
          }
        });
      }
    }

    return {
      name,
      title,
      location,
      contacts,
      experience,
      education,
      skills,
      featured_project: projects
    };
  } catch (error) {
    console.error('Error extracting data from LaTeX:', error);
    return null;
  }
}
