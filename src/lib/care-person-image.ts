import type { CarePerson } from "@/lib/care-people";

const portraitPalettes = [
  { bg: "#F8EED9", hair: "#5A564B", skin: "#D6C8B2", shirt: "#7B786F" },
  { bg: "#F5F3EE", hair: "#7B786F", skin: "#CBC9C4", shirt: "#5A564B" },
  { bg: "#D6C8B2", hair: "#5A564B", skin: "#F8EED9", shirt: "#A4A29A" },
  { bg: "#CBC9C4", hair: "#7B786F", skin: "#F8EED9", shirt: "#5A564B" },
];

function buildPortrait(initials: string, seed: number) {
  const palette = portraitPalettes[seed % portraitPalettes.length];
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96">
      <rect width="96" height="96" rx="18" fill="${palette.bg}"/>
      <circle cx="48" cy="37" r="21" fill="${palette.skin}"/>
      <path d="M25 38c1-20 14-29 27-29 12 0 21 8 22 22-7-6-15-9-25-9-11 0-19 5-24 16Z" fill="${palette.hair}"/>
      <path d="M18 92c4-23 18-34 30-34s26 11 30 34H18Z" fill="${palette.shirt}"/>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function isProfileImageSrc(src: string) {
  return /^(https?:\/\/|data:image\/|\/)/.test(src);
}

export function resolvePersonPhoto(person: CarePerson) {
  if (isProfileImageSrc(person.avatar)) {
    return { hasPhoto: true, photo: person.avatar };
  }

  return {
    hasPhoto: false,
    photo: buildPortrait(person.initials, person.sort_order),
  };
}
