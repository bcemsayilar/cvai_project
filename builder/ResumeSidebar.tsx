import React from 'react';
import { ProfileHeader } from './ProfileHeader';
import { ContactInfo } from './ContactInfo';
import { SocialLinks } from './SocialLinks';
import { LanguageList } from './LanguageList';

export function ResumeSidebar() {
  return (
    <aside className="overflow-hidden w-44">
      <div className="bg-slate-50">
        <div className="px-6 pt-6 pb-40 min-h-[842px] max-md:px-5 max-md:pb-24">
          <ProfileHeader />
          <ContactInfo />
          <img src="https://cdn.builder.io/api/v1/image/assets/TEMP/3dd02a1e05c0ce4ee07a60e9067cb2f9045fb8b8?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e" className="object-contain mt-4 w-32" alt="QR Code" />
          <SocialLinks />
          <LanguageList />
        </div>
      </div>
    </aside>
  );
}
