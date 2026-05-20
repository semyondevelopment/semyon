import type { SVGProps } from "react";

type Props = SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number };

function base({ size = 18, strokeWidth = 2, ...p }: Props) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...p,
  };
}

export function Instagram(props: Props) {
  return (
    <svg {...base(props)}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Linkedin(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4 4h4v16H4z" />
      <circle cx="6" cy="6" r="0.5" fill="currentColor" stroke="none" />
      <path d="M10 9h4v2c.7-1.3 2.1-2.3 4-2.3 3 0 4 2 4 5V20h-4v-5.5c0-1.5-.5-2.5-2-2.5s-2 1-2 2.5V20h-4z" />
    </svg>
  );
}

export function Twitter(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M4 4l7.5 10L4 20h2l6.5-6 4.5 6h4l-8-10.5L20 4h-2l-5.5 5L9 4z" />
    </svg>
  );
}

export function Facebook(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M14 22V12h3l1-4h-4V6c0-1 .5-2 2-2h2V0h-3c-3 0-5 2-5 5v3H7v4h3v10z" />
    </svg>
  );
}

export function TikTok(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M14 3v11.5a3.5 3.5 0 11-3.5-3.5" />
      <path d="M14 3c.5 2.5 2.5 4.5 5 5" />
    </svg>
  );
}

export function GitHub(props: Props) {
  return (
    <svg {...base(props)}>
      <path d="M9 19c-4 1-4-2-6-2m12 4v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 00-1.3-3.2 4.3 4.3 0 00-.1-3.2s-1-.3-3.4 1.2a11.5 11.5 0 00-6 0C7.3 2.8 6.3 3.1 6.3 3.1a4.3 4.3 0 00-.1 3.2A4.6 4.6 0 004.9 9.5c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21" />
    </svg>
  );
}
