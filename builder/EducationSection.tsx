import React from 'react';
import { ResumeContent } from '../components/resume-preview'; // Import types

// Assuming the structure of an education item from ResumeContent
interface EducationItemData {
  degree?: string;
  institution?: string;
  location?: string;
  dates?: string;
  details?: string[];
}

interface EducationSectionProps {
  data: EducationItemData[]; // Expecting an array of education items
}

interface EducationCardProps {
  institution: string;
  course: string;
  date: string;
  // Remove hardcoded logo prop unless it's part of the data
  // logo: string;
}

function EducationCard({
  institution,
  course,
  date,
  // logo
}: EducationCardProps) {
  return (
    <article className="flex flex-col flex-1 shrink justify-center px-3 py-2 rounded basis-0 bg-slate-50">
      <div className="flex gap-2 items-center w-full text-xs font-medium leading-none whitespace-nowrap text-slate-800">
        {/* Consider replacing with an actual institution logo if needed */}
        {/* <img
          src={logo}
          className="object-contain shrink-0 self-stretch my-auto w-6 rounded aspect-square"
          alt={institution}
        /> */}
        <span className="self-stretch my-auto text-slate-800">
          {institution}
        </span>
      </div>
      <div className="flex flex-col justify-center mt-1 w-full">
        <h3 className="text-xs font-medium leading-none text-slate-800">
          {course}
        </h3>
        <time className="self-start text-xs tracking-normal text-center text-slate-500">
          {date}
        </time>
      </div>
    </article>
  );
}

export function EducationSection({ data }: EducationSectionProps) {
   if (!data || data.length === 0) {
    return null; // Don't render if no education
  }

  return (
    <section className="flex gap-4 justify-center w-full">
      {/* Consider if this icon is part of the design or just a template element */}
      {/* <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/85847dbf9648571eae2185c78f62bd7b848ab0f8?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        className="object-contain shrink-0 w-4 aspect-[0.14]"
        alt=""
      /> */}
      <div className="flex flex-col flex-1 shrink self-start pb-6 basis-0 min-w-60">
        <h2 className="self-start text-xs font-medium tracking-normal leading-none text-center text-slate-800">
          Education
        </h2>
        <div className="mt-4 w-full">
          <div className="flex gap-1 items-start w-full">
            {data.map((edu, index) => (
              // You might need to determine the logo based on data if available,
              // or use a default/placeholder image, or remove it if it's purely decorative in the template.
            <EducationCard
                key={index}
                institution={edu.institution || ''}
                course={edu.degree || ''} // Assuming 'degree' maps to 'course'
                date={edu.dates || ''}
                 // logo="..." // Pass actual logo if available in data
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
