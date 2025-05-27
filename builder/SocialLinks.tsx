import React from 'react';

interface SocialItemProps {
  icon: string;
  label: string;
  username: string;
  customBg?: string;
}

function SocialItem({ icon, label, username, customBg }: SocialItemProps) {
  const IconWrapper = ({ children }: { children: React.ReactNode }) => {
    if (customBg) {
      return (
        <div className={`flex overflow-hidden flex-col justify-center items-center self-stretch my-auto w-4 h-4 ${customBg} shadow-sm min-h-4 rounded-[100px]`}>
          {children}
        </div>
      );
    }
    return <>{children}</>;
  };

  return (
    <div className="flex gap-2 items-center mt-3 w-full whitespace-nowrap">
      <IconWrapper>
        <img
          src={icon}
          className={`object-contain ${customBg ? 'w-2.5' : 'w-4'} aspect-square ${!customBg && 'rounded-[100px]'}`}
          alt={label}
        />
      </IconWrapper>
      <div className="flex-1 shrink self-stretch my-auto basis-0">
        <p className="text-xs tracking-normal leading-none text-slate-500">
          {label}
        </p>
        <p className="text-xs font-medium leading-none text-slate-600">
          {username}
        </p>
      </div>
    </div>
  );
}

export function SocialLinks() {
  return (
    <section className="mt-4 w-full">
      <h2 className="text-xs tracking-normal leading-none text-slate-500">
        Socials
      </h2>
      <SocialItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/46f701a04dc811f917e333e8ba0b9fadd1b62ad8?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Instagram"
        username="@chiara.designs"
      />
      <SocialItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/c4dc82be92f76a40131f3570cb196acae0c89bcd?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Dribbble"
        username="@chiara-designs"
      />
      <SocialItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/488186fd4a31bd6ee9d363649fc42e0c21a1f07a?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Twitter"
        username="@chiaradesigns"
        customBg="bg-sky-500"
      />
      <SocialItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/89fc909949beb39310b183a4b88813db42e77960?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Linkedin"
        username="chiara-bianchi-123"
        customBg="bg-sky-600"
      />
    </section>
  );
}
