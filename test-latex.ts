// Test LaTeX content to debug compilation issues

const simpleLatexTest = `\\documentclass[a4paper]{article}
\\usepackage{fullpage}
\\begin{document}
\\begin{center}
{\\Huge Test Document}
\\end{center}
This is a simple test document.
\\end{document}`;

console.log('Simple LaTeX Test:');
console.log(simpleLatexTest);

// Test the current latex generator
import { generateATSLatexResume } from './supabase/functions/process-resume/latex-generator-edge.ts';

const testData = {
  name: "John Doe",
  title: "Software Engineer",
  location: "San Francisco, CA",
  contacts: [
    { type: "email", value: "john@example.com" },
    { type: "phone", value: "555-123-4567" }
  ],
  education: [{
    degree: "Bachelor of Science in Computer Science",
    institution: "University of California, Berkeley",
    location: "Berkeley, CA",
    dates: "2018-2022"
  }],
  experience: [{
    position: "Software Engineer",
    company: "Tech Company",
    location: "San Francisco, CA",
    dates: "2022-Present",
    highlights: ["Developed web applications", "Improved system performance"]
  }],
  skills: ["JavaScript", "React", "Node.js"],
  featured_project: [{
    name: "Portfolio Website",
    description: "Personal portfolio built with React",
    technologies: ["React", "TypeScript"]
  }]
};

const generatedLatex = generateATSLatexResume(testData);
console.log('\nGenerated LaTeX:');
console.log(generatedLatex);
