import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Small building blocks shared by every home-1 section, matching the Figma
 * "Home-1" frame: the dot + label eyebrow chip, the centred section header
 * and the rounded (8px) sentence-case buttons.
 *
 * Everything here uses logical properties (ps/pe, start/end) and flips the
 * arrow with `rtl:` so it reads correctly in Arabic without extra props.
 */

type EyebrowTone = "light" | "muted" | "dark";

const eyebrowTones: Record<EyebrowTone, string> = {
  // White chip on the pale sections (Figma: #fff, text #1c97d4).
  light: "bg-white text-brandblue-500",
  // Grey chip on white sections (Figma: #f1f2f2).
  muted: "bg-[#f1f2f2] text-brandblue-500",
  // Frosted chip on dark sections (Figma: #fff @ 20%, text #74c0e7).
  dark: "bg-white/20 text-brandblue-300 backdrop-blur-md",
};

export function Eyebrow({
  children,
  tone = "light",
  className = "",
}: {
  children: ReactNode;
  tone?: EyebrowTone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-[15px] font-medium sm:h-12 sm:text-[18px] ${eyebrowTones[tone]} ${className}`}
    >
      <span aria-hidden className="size-2.5 rounded-full bg-brandblue-500" />
      {children}
    </span>
  );
}

/** Heading sizes from Figma: 64px section titles, 72px on the proof/solutions blocks. */
export const sectionTitle =
  "text-[34px] leading-[1.12] font-semibold tracking-[-0.02em] sm:text-5xl lg:text-[64px] lg:leading-[1.09]";
export const sectionTitleXl =
  "text-[36px] leading-[1.1] font-semibold tracking-[-0.02em] sm:text-5xl lg:text-[72px] lg:leading-[1.1]";

type ButtonVariant = "primary" | "soft" | "outline" | "ghostDark";

const buttonVariants: Record<ButtonVariant, string> = {
  primary:
    "bg-brandblue-500 text-white shadow-[0_8px_24px_-12px_rgba(28,151,212,.9)] hover:bg-brandblue-600 hover:shadow-[0_16px_34px_-14px_rgba(28,151,212,1)]",
  soft: "bg-brandblue-50 text-brandblue-600 hover:bg-white",
  outline:
    "border border-[#cfd8dc] bg-white text-slate-800 hover:border-brandblue-300 hover:text-brandblue-600",
  ghostDark:
    "border border-white/20 text-white hover:border-white/50 hover:bg-white/5",
};

export function PillButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className = "",
  arrow = true,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  className?: string;
  arrow?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`group inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-[background,box-shadow,border-color,color] duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brandblue-400 ${
        size === "lg" ? "h-14 px-5 text-[16px]" : "h-12 px-4 text-[15px] sm:text-[16px]"
      } ${buttonVariants[variant]} ${className}`}
    >
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className="size-4.5 transition-transform duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1"
        />
      )}
    </Link>
  );
}
