import React from 'react';

interface Project {
   name?: string;
   description?: string;
   link?: string;
   // Add other project fields if necessary
}

interface LatestProjectsProps {
  data: Project[]; // Expecting an array of projects
}

interface ProjectCardProps {
  // icon: string; // Remove hardcoded icon if not in data
  title: string;
  description: string;
  link?: string; // Link is now a string URL
  className?: string;
}

function ProjectCard({ title, description, link, className = "" }: ProjectCardProps) {
  return (
    <article className={`overflow-hidden flex-1 shrink p-3 rounded basis-0 bg-slate-50 ${className}`}>
      {/* Remove hardcoded icon */}
      {/* <img
          src={icon}
          className="object-contain shrink-0 w-6 aspect-square"
          alt={title}
      /> */}
      <div className="flex flex-1 gap-2 items-start size-full">
        {/* If you have icons in your data, you can add an img tag here */}
        <div className="flex-1 shrink basis-0">
          <h3 className="text-xs font-medium leading-none text-slate-800">
            {title}
          </h3>
          <p className="text-xs tracking-normal leading-loose text-slate-500">
            {description}
          </p>
        </div>
      </div>
      {link && (
      <div className="flex gap-1.5 items-center mt-2 w-full text-xs font-semibold leading-none text-indigo-500 whitespace-nowrap">
          {/* Assuming no specific link icon in data, use a default or remove */}
          {/* <img
          src={link.icon}
          className="object-contain shrink-0 self-stretch my-auto w-3 aspect-square rounded-[100px]"
          alt="Link icon"
          /> */}
        <a
            href={link}
          className="flex-1 shrink self-stretch my-auto text-indigo-500 basis-0"
            target="_blank" // Open link in new tab
            rel="noopener noreferrer"
        >
            {link}
        </a>
      </div>
      )}
    </article>
  );
}

export function LatestProjects({ data }: LatestProjectsProps) {
  if (!data || data.length === 0) {
    return null; // Don't render if no projects
  }

  return (
    <section className="flex gap-4 justify-center w-full">
      {/* Consider if this icon is part of the design or just a template element */}
      {/* <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/3fa24d26636d9d287bda0b005e790f8a9e57445d?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        className="object-contain shrink-0 w-4 aspect-[0.12]"
        alt=""
      /> */}
      <div className="flex-1 shrink self-start pb-6 basis-0 min-w-60">
        <h2 className="text-xs font-medium tracking-normal leading-none text-slate-800">
          Latest projects
        </h2>
        <div className="flex gap-1 mt-4 w-full">
          {data.map((project, index) => (
          <ProjectCard
              key={index} // Use a unique key
              title={project.name || ''}
              description={project.description || ''}
              link={project.link}
              // className="min-h-16" // Apply class if needed
            />
          ))}
        </div>
      </div>
    </section>
  );
}
