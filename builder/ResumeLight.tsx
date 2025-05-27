"use client";
import React from 'react';
import { ResumeSidebar } from './ResumeSidebar';
import { ResumeMain } from './ResumeMain';

export function ResumeLight() {
  return (
    <article className="flex overflow-hidden flex-wrap items-start bg-white max-w-[594px]">
      <img
        src="https://cdn.builder.io/api/v1/image/assets/TEMP/91ba172df4fba5ef865676214a09f27b2c0bb8c5?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        className="object-contain shrink-0 w-2.5 aspect-square"
        alt=""
      />
      <ResumeSidebar />
      <ResumeMain />
    </article>
  );
}
