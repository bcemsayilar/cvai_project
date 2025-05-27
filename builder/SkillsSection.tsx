import React from 'react';
import { ResumeContent } from '../components/resume-preview'; // Import types

interface SkillsSectionProps {
  data: string[]; // Expecting an array of skill strings
}

// Assuming the SkillCategory and individual skill rendering logic will be simplified
// to just display skills from the data array.
// Removing hardcoded categories and icons for now.

// interface SkillCategoryProps {
//   icon: string;
//   category: string;
//   children: React.ReactNode;
// }

// function SkillCategory({ icon, category, children }: SkillCategoryProps) { /* ... */ }

export function SkillsSection({ data }: SkillsSectionProps) {
  if (!data || data.length === 0) {
    return null; // Don't render if no skills
  }

  return (
    <section className="flex gap-4 justify-center w-full font-medium">
      {/* Consider if this icon is part of the design or just a template element */}
      {/* <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/88453773aad604deb550518f5e372a7cee320697?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        className="object-contain shrink-0 w-4 aspect-[0.11]"
        alt=""
      /> */}
      <div className="flex flex-col flex-1 shrink self-start pb-6 basis-0 min-w-60">
        <h2 className="self-start text-xs tracking-normal leading-none text-center text-slate-800">
          Skills
        </h2>
        <div className="mt-4 w-full text-xs">
          {/* Render skills as a flex container of tags */}
          <div className="flex flex-wrap gap-2">
            {data.map((skill, index) => (
              <span key={index} className="bg-slate-200 px-2 py-1 rounded">{skill}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
