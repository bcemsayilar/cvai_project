import React from 'react';
import { LatestProjects } from './LatestProjects';
import { ExperienceSection } from './ExperienceSection';
import { EducationSection } from './EducationSection';
import { SkillsSection } from './SkillsSection';
import { ToolsSection } from './ToolsSection';
import { ResumeContent, ResumeDesign } from '../components/resume-preview'; // Import types

interface ResumeMainProps {
  content: ResumeContent; // Assuming content holds the main resume data
  design?: ResumeDesign; // Design is optional
  isDarkMode: boolean; // Pass dark mode state
}

export function ResumeMain({ content, design, isDarkMode }: ResumeMainProps) {
  // Add null/undefined checks for content
  if (!content) {
    return null; // Or render a loading/error state
  }

  return (
    <main className="flex flex-1 shrink items-start pt-8 pr-6 pb-2 pl-4 basis-0 min-h-[842px] min-w-60 max-md:pr-5">
      <div className="flex-1 shrink w-full basis-0 min-w-60">
        {/* Pass relevant data to child components */}
        {/* Assuming child components accept a 'data' prop based on their section */}
        {content.projects && content.projects.length > 0 && <LatestProjects data={content.projects} />} {/* Pass projects data */}
        {content.experience && content.experience.length > 0 && <ExperienceSection data={content.experience} />} {/* Pass experience data */}
        {content.education && content.education.length > 0 && <EducationSection data={content.education} />} {/* Pass education data */}
        {/* Assuming skills might be a simple array or nested, pass the processed skills */}
        {(content.skills || (content as any).sections?.skills?.flatMap((s: any) => s.skills || []) || []).length > 0 &&
         <SkillsSection data={content.skills || (content as any).sections?.skills?.flatMap((s: any) => s.skills || [])} />} {/* Pass skills data */}
        {/* Assuming tools might be a simple array */}
         {content.tools && content.tools.length > 0 && <ToolsSection data={content.tools} />} {/* Pass tools data */}
        {/* Add other sections here and pass relevant data */}
      </div>
    </main>
  );
}
