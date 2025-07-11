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
    .filter(c => c.value && c.value.trim() && c.value !== 'Not provided') // Filter out empty contacts and "Not provided"
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
\t${(location || contactInfo) ? `${location ? escapeLaTeX(location) : ''}${location && contactInfo ? ' $\\cdot$ ' : ''}${contactInfo}\\\\` : ''}
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
${skills.filter(s => s && s.trim() && s !== 'Not provided').join(', ')}\\\\
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
  
  // Filter out empty highlights and "Not provided"
  const validHighlights = highlights?.filter(h => h && h.trim() && h !== 'Not provided') || [];
  
  return `\\textbf{${escapeLaTeX(company)}} \\hfill ${location ? escapeLaTeX(location) : ''}\\\\
\\textit{${escapeLaTeX(position)}} \\hfill ${escapeLaTeX(dates)}\\\\
\\vspace{-1mm}
${validHighlights.length > 0 ? `\\begin{itemize} \\itemsep 1pt
${validHighlights.map(highlight => `\t\\item ${escapeLaTeX(highlight)}`).join('\n')}
\\end{itemize}` : ''}`;
}

function generateEducationSection(edu: ResumeData['education'][0]): string {
  const { degree, institution, location, dates, details } = edu;
  
  // Filter out empty details and "Not provided"
  const validDetails = details?.filter(d => d && d.trim() && d !== 'Not provided') || [];
  
  return `\\textbf{${escapeLaTeX(institution)}}\\hfill ${location ? escapeLaTeX(location) : ''}\\\\
${escapeLaTeX(degree)} \\textit{} \\hfill ${escapeLaTeX(dates)}\\\\
${validDetails.length > 0 ? `\\vspace{-1mm}
\\begin{itemize} \\itemsep 1pt
${validDetails.map(detail => `\t\\item ${escapeLaTeX(detail)}`).join('\n')}
\\end{itemize}` : ''}
\\vspace{2mm}`;
}

function generateProjectSection(proj: { name: string; description: string; technologies?: string[] }): string {
  const { name, description, technologies } = proj;
  
  // Filter out empty technologies and "Not provided"
  const validTechnologies = technologies?.filter(t => t && t.trim() && t !== 'Not provided') || [];
  
  return `\\textbf{${escapeLaTeX(name)}}\\\\
${escapeLaTeX(description)}${validTechnologies.length > 0
  ? ` (${validTechnologies.map(t => escapeLaTeX(t)).join(', ')})`
  : ''}\\\\`;
}

function escapeLaTeX(text: string): string {
  if (!text) return '';
  
  // Escape known LaTeX special characters
  let escaped = text
    .replace(/\\/g, '\\textbackslash{}') // Escape backslash first
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
    .replace(/</g, '{\\textless}') // Use textless for literal <
    .replace(/>/g, '{\\textgreater}') // Use textgreater for literal >
    .replace(/\|/g, '{\\textbar}'); // Use textbar for literal |

  // Optionally, if needed, add more targeted sanitization for highly dangerous commands, 
  // but *after* the initial escaping. For now, given the template-based generation,
  // direct command injection via user input should be minimized by the above escapes.
  // Example: if you wanted to disallow \input:
  // escaped = escaped.replace(/\\input/g, '{\\textbackslash{}input}');
  
  return escaped;
}

export type { ResumeData };
