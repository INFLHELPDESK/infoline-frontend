"use client";

import { useTransition, type ReactNode } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { useLocaleTargets } from "./locale-targets";

const tones = {
  dark: {
    container: "bg-white/8",
    // Figma keeps both labels white; the active chip signals state.
    inactive: "text-white hover:text-slate-100",
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

// A locale -> option content map. Add an entry when you add a locale.
const optionContent: Record<string, ReactNode> = {
  // Figma: Tajawal Medium 12px for the Arabic label, 12px for EN.
  ar: (
    <span lang="ar" className="font-arabic text-xs leading-none font-medium">
      ع
    </span>
  ),
  en: <span className="text-xs leading-none font-medium">EN</span>,
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
  const targets = useLocaleTargets();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (next: string) => {
    if (next === locale) return;
    // A page that declared its translations (CMS articles) is the only source
    // of its other-language URL; no declared URL means no destination.
    const destination = targets ? targets[next] : pathname;
    if (!destination) return;
    startTransition(() => {
      // Keep the current path, swap the locale.
      router.replace(destination, { locale: next });
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
        const unavailable = !isActive && targets !== null && !targets[l];
        return (
          <button
            key={l}
            type="button"
            onClick={() => switchLocale(l)}
            disabled={isPending || unavailable}
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
