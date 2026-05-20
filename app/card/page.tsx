import QRCode from "qrcode";
import Link from "next/link";
import { Download, Mail, Phone, Globe, Share2, Briefcase, User as UserIcon } from "lucide-react";
import {
  Instagram, Linkedin, Twitter, Facebook, TikTok, GitHub,
} from "@/components/BrandIcons";
import {
  getContact, toVCard, parseMode,
  instagramUrl, facebookUrl, linkedinUrl, twitterUrl, tiktokUrl, githubUrl,
  type Mode,
} from "@/lib/contact";
import CopyButton from "@/components/CopyButton";
import { cn } from "@/lib/cn";

export const revalidate = 3600;

export const metadata = { title: "Connect", description: "Tap, scan, or save my contact." };

export default async function CardPage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const sp = await searchParams;
  const mode = parseMode(sp.mode);
  const c = getContact(mode);
  const vcard = toVCard(c);
  const qrSvg = await QRCode.toString(vcard, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#0a0a0b", light: "#ffffff" },
  });

  const initials = c.name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");

  return (
    <div className="mx-auto max-w-md space-y-5">
      <header className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-black shadow-[0_14px_40px_-10px_rgba(209,250,110,0.7)]">
          {initials || "•"}
        </div>
        <h1 className="mt-3 text-[28px] font-semibold leading-none tracking-tight">{c.name}</h1>
        {mode === "business" && (c.title || c.company) && (
          <p className="mt-1.5 text-sm text-sub">
            {[c.title, c.company].filter(Boolean).join(" · ")}
          </p>
        )}
      </header>

      <ModeTabs mode={mode} />

      <div className="card relative overflow-hidden p-5">
        <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative space-y-4">
          <div className="mx-auto flex aspect-square w-full max-w-[260px] items-center justify-center rounded-2xl bg-white p-4">
            <div
              aria-label="Contact QR code"
              className="h-full w-full [&_svg]:h-full [&_svg]:w-full"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
          </div>
          <p className="text-center text-[11px] text-sub">Scan to add me to contacts.</p>
          <a href={`/api/vcard?mode=${mode}`} className="btn btn-accent w-full justify-center gap-1.5" download>
            <Download size={14} strokeWidth={2.5} />Save contact
          </a>
        </div>
      </div>

      <section className="space-y-2">
        {c.phone && (
          <ContactLink href={`tel:${c.phone}`} Icon={Phone} label="Phone" value={c.phone} copy={c.phone} accent="#34d399" />
        )}
        {c.email && (
          <ContactLink href={`mailto:${c.email}`} Icon={Mail} label="Email" value={c.email} copy={c.email} accent="#60a5fa" />
        )}
        {mode === "personal" && c.instagram && (
          <ContactLink href={instagramUrl(c.instagram)} Icon={Instagram} label="Instagram" value={`@${c.instagram.replace(/^@/, "")}`} accent="#f472b6" external />
        )}
        {mode === "personal" && c.facebook && (
          <ContactLink href={facebookUrl(c.facebook)} Icon={Facebook} label="Facebook" value={c.facebook.replace(/^https?:\/\/(www\.)?facebook\.com\//, "")} accent="#3b82f6" external />
        )}
        {mode === "personal" && c.twitter && (
          <ContactLink href={twitterUrl(c.twitter)} Icon={Twitter} label="X" value={`@${c.twitter.replace(/^@/, "")}`} accent="#e5e7eb" external />
        )}
        {mode === "personal" && c.tiktok && (
          <ContactLink href={tiktokUrl(c.tiktok)} Icon={TikTok} label="TikTok" value={`@${c.tiktok.replace(/^@/, "")}`} accent="#f43f5e" external />
        )}
        {mode === "business" && c.linkedin && (
          <ContactLink href={linkedinUrl(c.linkedin)} Icon={Linkedin} label="LinkedIn" value={c.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")} accent="#0a66c2" external />
        )}
        {mode === "business" && c.github && (
          <ContactLink href={githubUrl(c.github)} Icon={GitHub} label="GitHub" value={c.github.replace(/^@/, "")} accent="#e5e7eb" external />
        )}
        {c.website && (
          <ContactLink href={c.website} Icon={Globe} label="Website" value={c.website.replace(/^https?:\/\//, "")} accent="#fbbf24" external />
        )}
      </section>

      <div className="flex items-center justify-center gap-2 text-xs text-sub">
        <Share2 size={12} />
        <span>NFC: write this page's URL to a tag.</span>
      </div>

      <div className="pt-2 text-center">
        <Link href="/" className="text-xs text-sub hover:text-ink">← Back to Life OS</Link>
      </div>
    </div>
  );
}

function ModeTabs({ mode }: { mode: Mode }) {
  const tabs: { id: Mode; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number }> }[] = [
    { id: "personal", label: "Personal", Icon: UserIcon },
    { id: "business", label: "Business", Icon: Briefcase },
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-2xl border border-line bg-panel/60 p-1.5 backdrop-blur">
      {tabs.map((t) => {
        const active = t.id === mode;
        return (
          <Link
            key={t.id}
            href={`/card?mode=${t.id}`}
            className={cn(
              "relative flex items-center justify-center gap-2 rounded-xl py-2.5 text-[13px] font-medium transition active:scale-95",
              active ? "bg-accent text-black shadow-[0_8px_24px_-10px_rgba(209,250,110,0.7)]" : "text-sub hover:text-ink",
            )}
          >
            <t.Icon size={15} strokeWidth={active ? 2.4 : 1.9} />
            <span>{t.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

function ContactLink({
  href, Icon, label, value, copy, accent, external,
}: {
  href: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  label: string;
  value: string;
  copy?: string;
  accent: string;
  external?: boolean;
}) {
  return (
    <div className="card flex items-center gap-3 p-3">
      <a
        href={href}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line"
          style={{ background: `${accent}1f`, color: accent }}
        >
          <Icon size={18} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] uppercase tracking-[0.14em] text-sub">{label}</div>
          <div className="truncate text-sm">{value}</div>
        </div>
      </a>
      {copy && <CopyButton value={copy} />}
    </div>
  );
}
