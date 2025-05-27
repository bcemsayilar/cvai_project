import React from 'react';
import { ResumeContent } from '../components/resume-preview'; // Import types

// Assuming the structure of an experience item from ResumeContent
interface ExperienceItemData {
  position?: string;
  company?: string;
  location?: string;
  dates?: string;
  highlights?: string[];
  tags?: string[];
}

interface ExperienceSectionProps {
  data: ExperienceItemData[]; // Expecting an array of experience items
}

interface ExperienceItemProps {
  date: string;
  location: string;
  role: string;
  company: string;
  highlights?: string[];
  tags?: string[];
  // Remove hardcoded image props unless they are part of the data
  // stepIcon: string;
  // companyLogo: string;
}

function ExperienceItem({
  date,
  location,
  role,
  company,
  highlights,
  tags,
  // stepIcon,
  // companyLogo,
}: ExperienceItemProps) {
  return (
    <div className="flex gap-2 justify-center w-full">
      {/* Remove hardcoded icon */}
      {/* <img
        src={stepIcon}
        className="object-contain shrink-0 w-3 aspect-[0.29]"
        alt=""
      /> */}
      <div className="flex flex-1 shrink gap-1 justify-center items-start pt-1 pb-2 h-full basis-0 min-w-60">
        <div className="rounded w-[120px]">
          <div className="flex gap-0.5 w-full text-xs tracking-normal">
            <time className="my-auto text-slate-600">{date}</time>
            <div className="flex gap-0.5 items-center h-full whitespace-nowrap text-slate-500">
              {/* Consider replacing with an actual location icon if needed */}
              {location && (
                 <>
              <img
                src="https://cdn.builder.io/api/v1/image/assets/TEMP/28460b0e1b9de9510f6f81f143cffababd094c54?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
                className="object-contain shrink-0 self-stretch my-auto w-1.5 aspect-square"
                alt="Location icon"
              />
              <span className="self-stretch my-auto text-slate-500">
                {location}
              </span>
                 </>
              )}
            </div>
          </div>
          <div className="flex gap-2 items-start mt-1 w-full">
             {/* Consider replacing with an actual company logo if needed */}
            {/* <img
              src={companyLogo}
              className="object-contain shrink-0 w-5 shadow-sm aspect-square"
              alt={company}
            /> */}
            <div className="flex-1 shrink basis-0">
              <p className="text-xs tracking-normal leading-none text-slate-500">
                {role}
              </p>
              <p className="text-xs font-medium leading-none text-slate-800">
                {company}
              </p>
            </div>
          </div>
        </div>
        {/* Render highlights */}
        {highlights && highlights.length > 0 && (
          <ul className="list-disc list-inside text-xs tracking-normal basis-0 text-slate-500">
            {highlights.map((hl, i) => <li key={i}>{hl}</li>)}
          </ul>
        )}
        {/* Render tags */}
         {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
               {tags.map((tag, i) => (
                  <span key={i} className="text-xs bg-slate-200 px-1.5 py-0.5 rounded">{tag}</span>
               ))}
            </div>
         )}
      </div>
    </div>
  );
}

export function ExperienceSection({ data }: ExperienceSectionProps) {
   if (!data || data.length === 0) {
    return null; // Don't render if no experience
  }

  return (
    <section className="flex gap-4 justify-center w-full">
      {/* Consider if this icon is part of the design or just a template element */}
      {/* <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/f0c09f4a2fa1f018ceb4a08af04e28c96cf2575e?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        className="object-contain shrink-0 w-4 aspect-[0.07] max-md:hidden"
        alt=""
      /> */}
      <div className="flex flex-col flex-1 shrink self-start pb-6 basis-0 min-w-60">
        <h2 className="self-start text-xs font-medium tracking-normal leading-none text-center text-slate-800">
          Experience
        </h2>
        <div className="mt-4 w-full">
          {data.map((exp, index) => (
             // You might need to determine the stepIcon and companyLogo based on data if available,
             // or use default/placeholder images, or remove them if they are purely decorative in the template.
          <ExperienceItem
              key={index}
              date={exp.dates || ''}
              location={exp.location || ''}
              role={exp.position || ''}
              company={exp.company || ''}
              highlights={exp.highlights}
              tags={exp.tags}
               // stepIcon="..." // Pass actual icon if available in data
               // companyLogo="..." // Pass actual logo if available in data
            />
          ))}
        </div>
      </div>
    </section>
  );
}
