import React from 'react';

interface LanguageItemProps {
  flag: string;
  language: string;
  level: string;
}

function LanguageItem({ flag, language, level }: LanguageItemProps) {
  return (
    <div className="flex gap-2 items-center mt-3 w-full whitespace-nowrap">
      <img
        src={flag}
        className="object-contain shrink-0 self-stretch my-auto w-4 aspect-[1.33]"
        alt={`${language} flag`}
      />
      <div className="flex-1 shrink self-stretch my-auto basis-0">
        <p className="text-xs font-medium leading-none text-slate-600">
          {language}
        </p>
        <p className="text-xs tracking-normal leading-none text-slate-500">
          {level}
        </p>
      </div>
    </div>
  );
}

export function LanguageList() {
  return (
    <section className="mt-4 w-full">
      <h2 className="text-xs tracking-normal leading-none text-slate-500">
        Languages
      </h2>
      <LanguageItem
        flag="https://cdn.builder.io/api/v1/image/assets/TEMP/ed78b9b1e126a8f9cf1d1aac9205e2f6f72e88cb?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        language="Italian"
        level="Native"
      />
      <LanguageItem
        flag="https://cdn.builder.io/api/v1/image/assets/TEMP/b5659060b8009ddebbf48ec949d90307f040db0e?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        language="Greek"
        level="Native"
      />
      <LanguageItem
        flag="https://cdn.builder.io/api/v1/image/assets/TEMP/0e9a2468f55b1bb974830cb3dcfd4b8a8a128305?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        language="English"
        level="Professional working"
      />
      <LanguageItem
        flag="https://cdn.builder.io/api/v1/image/assets/TEMP/7339fea050355e6b1558909e2e1673d12bd5d436?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        language="Spanish"
        level="Elementary"
      />
    </section>
  );
}
