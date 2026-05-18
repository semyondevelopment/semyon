export type Mode = "personal" | "business";

export type Contact = {
  name: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  tiktok?: string;
  linkedin?: string;
  github?: string;
};

const env = (k: string) => {
  const v = process.env[k];
  return v && v.trim() ? v.trim() : undefined;
};

export function getContact(mode: Mode = "personal"): Contact {
  const name = env("CONTACT_NAME") || "Semyon";
  const sharedPhone = env("CONTACT_PHONE");
  const sharedEmail = env("CONTACT_EMAIL");

  if (mode === "business") {
    return {
      name,
      title: env("CONTACT_TITLE"),
      company: env("CONTACT_COMPANY"),
      phone: env("CONTACT_WORK_PHONE") || sharedPhone,
      email: env("CONTACT_WORK_EMAIL") || sharedEmail,
      website: env("CONTACT_WEBSITE"),
      linkedin: env("CONTACT_LINKEDIN"),
      github: env("CONTACT_GITHUB"),
    };
  }

  return {
    name,
    phone: sharedPhone,
    email: sharedEmail,
    instagram: env("CONTACT_INSTAGRAM"),
    facebook: env("CONTACT_FACEBOOK"),
    twitter: env("CONTACT_TWITTER"),
    tiktok: env("CONTACT_TIKTOK"),
    website: env("CONTACT_PERSONAL_WEBSITE"),
  };
}

export function parseMode(v: unknown): Mode {
  return v === "business" ? "business" : "personal";
}

const stripAt = (h: string) => h.replace(/^@/, "").trim();

export function instagramUrl(h: string)  { return `https://instagram.com/${stripAt(h)}`; }
export function facebookUrl(h: string)   { return /^https?:\/\//i.test(h) ? h : `https://facebook.com/${stripAt(h)}`; }
export function twitterUrl(h: string)    { return `https://x.com/${stripAt(h)}`; }
export function tiktokUrl(h: string)     { return `https://tiktok.com/@${stripAt(h)}`; }
export function githubUrl(h: string)     { return /^https?:\/\//i.test(h) ? h : `https://github.com/${stripAt(h)}`; }
export function linkedinUrl(h: string) {
  if (/^https?:\/\//i.test(h)) return h;
  return `https://linkedin.com/in/${h.trim().replace(/^\/?(in\/)?/, "")}`;
}

export function toVCard(c: Contact): string {
  const parts = c.name.split(/\s+/);
  const last = parts.length > 1 ? parts.slice(-1)[0] : "";
  const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : c.name;
  const lines: string[] = ["BEGIN:VCARD", "VERSION:3.0", `FN:${esc(c.name)}`, `N:${esc(last)};${esc(first)};;;`];
  if (c.title) lines.push(`TITLE:${esc(c.title)}`);
  if (c.company) lines.push(`ORG:${esc(c.company)}`);
  if (c.phone) lines.push(`TEL;TYPE=CELL:${c.phone}`);
  if (c.email) lines.push(`EMAIL;TYPE=INTERNET:${c.email}`);
  if (c.website) lines.push(`URL:${c.website}`);
  if (c.instagram) lines.push(`URL;TYPE=Instagram:${instagramUrl(c.instagram)}`);
  if (c.facebook) lines.push(`URL;TYPE=Facebook:${facebookUrl(c.facebook)}`);
  if (c.twitter) lines.push(`URL;TYPE=X:${twitterUrl(c.twitter)}`);
  if (c.tiktok) lines.push(`URL;TYPE=TikTok:${tiktokUrl(c.tiktok)}`);
  if (c.linkedin) lines.push(`URL;TYPE=LinkedIn:${linkedinUrl(c.linkedin)}`);
  if (c.github) lines.push(`URL;TYPE=GitHub:${githubUrl(c.github)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

function esc(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}
