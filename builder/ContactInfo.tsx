import React from 'react';

interface ContactItemProps {
  icon: string;
  label: string;
  value: string;
}

function ContactItem({ icon, label, value }: ContactItemProps) {
  return (
    <div className="flex gap-2 items-center mt-3 w-full whitespace-nowrap">
      <img
        src={icon}
        className="object-contain shrink-0 self-stretch my-auto w-4 aspect-square rounded-[100px]"
        alt={label}
      />
      <div className="flex-1 shrink self-stretch my-auto basis-0">
        <p className="text-xs tracking-normal leading-none text-slate-500">
          {label}
        </p>
        <p className="text-xs font-medium leading-none text-slate-600">
          {value}
        </p>
      </div>
    </div>
  );
}

export function ContactInfo() {
  return (
    <section className="mt-4 w-full">
      <ContactItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/e6c4147250c65eecb58d65de3d98f818e6c9e704?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Email"
        value="chiara.bianchi@gmail.com"
      />
      <ContactItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/ef9d61a3414db611c8ff9e0e452f1606941dda83?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Website"
        value="https://aldesign.it"
      />
      <ContactItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/44750b0d151dacb9bccd54595d192523a2255456?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Phone"
        value="(+39) 333 0123 765"
      />
      <ContactItem
        icon="https://cdn.builder.io/api/v1/image/assets/TEMP/b4f31ec74c896da27c0c7230d0f4a6021c9b49bf?placeholderIfAbsent=true&apiKey=d604fb59150c426298290fd501be6c4e"
        label="Address"
        value="Bologna, Italy"
      />
    </section>
  );
}
