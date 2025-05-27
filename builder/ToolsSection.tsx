import React from 'react';
import { ResumeContent } from '../components/resume-preview'; // Import types

interface ToolsSectionProps {
  data: string[]; // Expecting an array of tool strings
}

// Removing the complex ToolCard component and hardcoded data
// interface ToolCardProps { /* ... */ }
// function ToolCard({ icon, name, description, className = "" }: ToolCardProps) { /* ... */ }

export function ToolsSection({ data }: ToolsSectionProps) {
  if (!data || data.length === 0) {
    return null; // Don't render if no tools
  }

  return (
    <section className="flex gap-4 justify-center items-start w-full">
      {/* Consider if this icon is part of the design or just a template element */}
      {/* <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/d183a568b5e26c22357b7a23454428e6bc862958?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
          className="object-contain w-4 shadow aspect-square"
          alt=""
      /> */}
      <div className="flex flex-col flex-1 shrink pb-6 basis-0 min-w-60">
        <h2 className="self-start text-xs font-medium tracking-normal leading-none text-center text-slate-800">
          Tools
        </h2>
        <div className="mt-4 w-full">
          {/* Render tools as a flex container of tags, similar to skills */}
          <div className="flex flex-wrap gap-2">
            {data.map((tool, index) => (
              <span key={index} className="bg-slate-200 px-2 py-1 rounded">{tool}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
} 