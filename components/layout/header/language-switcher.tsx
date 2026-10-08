"use client";

import { useTransition, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const tones = {
  dark: {
    container: "bg-white/8",
    inactive: "text-slate-500 hover:text-slate-300",
    active: "text-white",
    highlight: "bg-black/20",
  },
  // Light header (Contact): slate-50 pill with a white active chip.
  light: {
    container: "bg-slate-50",
    inactive: "text-slate-500 hover:text-slate-700",
    active: "text-slate-900",
    highlight: "bg-white shadow-[0_1px_3px_rgba(15,40,60,0.12)]",
  },
} as const;

// The Arabic glyph exported from Figma (fill driven by currentColor).
const ArabicGlyph = (
  <svg
    viewBox="0 0 40 30"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="h-[30px] w-10"
    aria-hidden
  >
    <path
      d="M19.933 21.996C18.8137 21.996 17.9435 21.7353 17.3225 21.214C16.7092 20.6927 16.4025 19.9567 16.4025 19.006C16.4025 18.4003 16.575 17.856 16.92 17.373C17.2727 16.89 17.8323 16.4645 18.599 16.0965V16.039C18.1237 15.7477 17.7748 15.4257 17.5525 15.073C17.3378 14.7127 17.2305 14.3063 17.2305 13.854C17.2305 13.5013 17.2918 13.1602 17.4145 12.8305C17.5372 12.4932 17.7135 12.198 17.9435 11.945C18.1812 11.6843 18.4648 11.4773 18.7945 11.324C19.1318 11.1707 19.5113 11.094 19.933 11.094C20.5003 11.094 20.9833 11.2243 21.382 11.485C21.7807 11.7457 22.1027 12.0868 22.348 12.5085L21.1175 13.601C20.9488 13.3327 20.7533 13.1372 20.531 13.0145C20.3087 12.8842 20.0327 12.819 19.703 12.819C19.289 12.819 18.9632 12.9072 18.7255 13.0835C18.4955 13.2598 18.3805 13.5205 18.3805 13.8655C18.3805 14.5708 18.9517 14.9235 20.094 14.9235C20.3087 14.9235 20.5387 14.912 20.784 14.889C21.0293 14.866 21.3015 14.8277 21.6005 14.774L22.5205 14.613L22.785 16.2L21.2785 16.453C20.0288 16.66 19.1165 16.9437 18.5415 17.304C17.9665 17.6643 17.679 18.1358 17.679 18.7185V18.8565C17.679 19.3395 17.8783 19.696 18.277 19.926C18.6757 20.156 19.2277 20.271 19.933 20.271C20.485 20.271 21.0293 20.1713 21.566 19.972C22.1103 19.7803 22.578 19.5043 22.969 19.144L23.8315 20.501C23.3485 20.9687 22.7658 21.3328 22.0835 21.5935C21.4012 21.8618 20.6843 21.996 19.933 21.996Z"
      fill="currentColor"
    />
  </svg>
);

// A locale -> option content map. Add an entry when you add a locale.
const optionContent: Record<string, ReactNode> = {
  ar: ArabicGlyph,
  en: <span className="body-sm-medium leading-none">EN</span>,
};

const localeNames: Record<string, string> = {
  ar: "العربية",
  en: "English",
};

export default function LanguageSwitcher({
  tone = "dark",
}: {
  tone?: keyof typeof tones;
}) {
  const styles = tones[tone];
  const locale = useLocale();
  const t = useTranslations("Header");
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    if (next === locale) return;
    startTransition(() => {
      // Keep the current path, swap the locale.
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <div
      role="group"
      aria-label={t("languageLabel")}
      className={`flex h-9 w-[90px] shrink-0 flex-row items-center gap-px rounded-full px-1 transition-colors duration-300 ${styles.container}`}
    >
      {routing.locales.map((l) => {
        const isActive = l === locale;
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            disabled={isPending}
            aria-pressed={isActive}
            aria-label={localeNames[l] ?? l}
            title={localeNames[l] ?? l}
            className={`relative grid h-[30px] w-10 place-items-center rounded-full transition-colors duration-200 disabled:cursor-not-allowed ${
              isActive ? styles.active : styles.inactive
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="lang-switcher-active"
                className={`absolute inset-0  rounded-full ${styles.highlight}`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10 flex items-center justify-center">
              {optionContent[l] ?? l.toUpperCase()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
