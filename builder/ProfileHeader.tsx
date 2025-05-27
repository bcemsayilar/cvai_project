import React from 'react';

export function ProfileHeader() {
  return (
    <header>
      <div className="flex flex-col justify-center items-end w-full">
        <img
          src="https://cdn.builder.io/api/v1/image/assets/TEMP/3a1e0fe36ebe610bcd1966dbef19628d7acde49c?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
          className="object-contain max-w-full rounded-none aspect-[1.9] w-[156px]"
          alt="Profile"
        />
      </div>
      <div className="mt-4 w-full">
        <div className="flex flex-col justify-center w-full font-medium">
          <h1 className="text-base tracking-tight leading-none text-slate-800">
            John Smith
          </h1>
          <p className="mt-1 text-xs tracking-normal leading-none bg-clip-text">
            UX Designer
          </p>
        </div>
        <blockquote className="mt-4 w-full">
          <p className="gap-0.5 w-full text-xs font-medium tracking-normal leading-3 text-slate-600">
            Every great design begins<br /> with an even better story.
          </p>
          <cite className="pl-3 w-full text-xs tracking-normal leading-none text-slate-500">
            Lorinda Mamo
          </cite>
        </blockquote>
        <div className="overflow-hidden mt-4 w-full">
          <hr className="flex shrink-0 h-px border-solid border-[7px] border-[color:var(--Gray-Lightest,#E2E6EE)]" />
        </div>
      </div>
    </header>
  );
}
