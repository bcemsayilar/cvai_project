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
  const contactInfo = (contacts ?? [])
    .map(c => escapeLaTeX(c.value))
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
\t{\\Huge \\scshape {${escapeLaTeX(name)}}}\\\\
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
${escapeLaTeX(description)}${technologies && technologies.length > 0
  ? ` (${technologies.map(t => escapeLaTeX(t)).join(', ')})`
  : ''}\\\\`;
}

function escapeLaTeX(text: string): string {
  if (!text) return '';
  
  // First sanitize the input to remove dangerous patterns
  let sanitized = text
    // Remove potential command injections
    .replace(/\\(input|include|write|immediate|openout|closeout|read|openin|closein|csname|expandafter|noexpand|shell|system|def|let|gdef|xdef|catcode|end|begin)\b/gi, '')
    // Remove file operations and system commands
    .replace(/\\(documentclass|usepackage|newcommand|renewcommand|newenvironment|renewenvironment)\b/gi, '')
    // Remove dangerous control sequences
    .replace(/\\[a-zA-Z@]+/g, match => {
      // Allow only safe LaTeX commands
      const safeCommands = ['textbf', 'textit', 'emph', 'underline', 'item', 'hfill', 'vspace', 'newline'];
      const command = match.slice(1); // Remove the backslash
      return safeCommands.includes(command) ? match : '';
    })
    // Remove any remaining backslash sequences that could be dangerous
    .replace(/\\./g, match => {
      // Only allow specific escaped characters
      const allowedEscapes = ['\\\\', '\\ ', '\\n', '\\t'];
      return allowedEscapes.includes(match) ? match : '';
    });
  
  // Then escape special LaTeX characters
  return sanitized
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/\$/g, '\\$')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/#/g, '\\#')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/_/g, '\\_')
    .replace(/~/g, '\\textasciitilde{}')
    // Additional security: escape potentially dangerous characters
    .replace(/\|/g, '\\textbar{}')
    .replace(/</g, '\\textless{}')
    .replace(/>/g, '\\textgreater{}')
    // Limit length to prevent DoS
    .substring(0, 1000);
}

export type { ResumeData };
