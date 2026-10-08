"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Variants,
} from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import Button from "@/components/ui/button";
import { Link, usePathname } from "@/i18n/navigation";
import { EASE } from "@/components/ui/motion/shared";
import LanguageSwitcher from "./language-switcher";

type NavItem = { label: string; href: string };

/** Routes whose hero is light, so the header uses its light theme (per Figma). */
const LIGHT_HERO_ROUTES = ["/contact"];

export const Header = () => {
  const t = useTranslations("Header");
  const menuItems = t.raw("nav") as NavItem[];
  const isRtl = useLocale() === "ar";
  const reduce = useReducedMotion();
  const menuId = useId();

  // Locale-stripped path (e.g. "/about") so the current nav item can be marked.
  const pathname = usePathname();
  const isActive = (href: string) =>
    href !== "#" && (pathname === href || pathname.startsWith(`${href}/`));

  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  // Solid background after the first few px. The bar itself stays fixed and
  // visible at all times — it never hides on scroll.
  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 16);
  });

  // Correct state on mount (e.g. reload mid-page, where no scroll event fires).
  useEffect(() => {
    const id = requestAnimationFrame(() => setScrolled(window.scrollY > 16));
    return () => cancelAnimationFrame(id);
  }, []);

  // Close the drawer when the route changes (incl. back/forward). Adjusting
  // state during render is React's recommended alternative to an effect here.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  // Light-hero pages (Contact) use the light header from the design: dark
  // logo, dark nav, light language pill. The open mobile drawer is always ink,
  // so the bar switches to the dark theme while it is open.
  const lightPage = LIGHT_HERO_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(`${r}/`),
  );
  const light = lightPage && !open;

  // The underline follows the hovered link and rests on the active one.
  const activeHref = menuItems.find((i) => isActive(i.href))?.href ?? null;
  const underlineOn = hovered ?? activeHref;

  // Drawer items slide in from the reading-start edge.
  const itemVariants: Variants = reduce
    ? { hidden: { opacity: 0 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, x: isRtl ? 24 : -24 },
        show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: EASE } },
      };

  return (
    <>
      <motion.header
        className={`fixed inset-x-0 top-0 z-40 transition-[background-color,backdrop-filter,box-shadow] duration-300 ${
          !(scrolled || open)
            ? "bg-transparent"
            : light
              ? "bg-white/85 backdrop-blur-[18px] backdrop-saturate-140 shadow-[0_1px_0_0_rgba(15,40,60,0.08)]"
              : "bg-ink backdrop-blur-[18px] backdrop-saturate-140 shadow-[0_1px_0_0_rgba(255,255,255,0.06)]"
        }`}
        initial={reduce ? { opacity: 0 } : { y: -96, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <div className="mx-auto flex h-21 max-w-360 items-center justify-between gap-7 px-6 md:px-12">
          <Link
            href="/"
            className="relative flex flex-none items-baseline gap-3"
          >
            {/* White + dark logos stacked; crossfade with the header theme. */}
            <Image
              src="/assets/logo.svg"
              alt={t("logoAlt")}
              width={100}
              height={24}
              priority
              className={`transition-opacity duration-300 ${light ? "opacity-0" : "opacity-100"}`}
            />
            <Image
              src="/assets/logo-dark.svg"
              alt=""
              aria-hidden
              width={100}
              height={24}
              priority
              className={`absolute inset-0 transition-opacity duration-300 ${light ? "opacity-100" : "opacity-0"}`}
            />
          </Link>

          {/* Desktop nav — one shared underline glides between items */}
          <LayoutGroup id="header-nav">
            <nav
              className="hidden min-w-0 items-center gap-6 min-[1081px]:flex"
              onPointerLeave={() => setHovered(null)}
            >
              {menuItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    onPointerEnter={() => setHovered(item.href)}
                    onFocus={() => setHovered(item.href)}
                    onBlur={() => setHovered(null)}
                    className={`relative whitespace-nowrap py-1.5 text-[13.5px] font-medium tracking-[0.01em] transition-colors duration-250 ${
                      active
                        ? light
                          ? "text-brandblue-600"
                          : "text-brandblue-400"
                        : light
                          ? "text-slate-900 hover:text-brandblue-600"
                          : "text-slate-100 hover:text-cyan-50"
                    }`}
                  >
                    {item.label}
                    {underlineOn === item.href && (
                      <motion.span
                        layoutId="header-nav-underline"
                        aria-hidden
                        className="absolute inset-x-0 -bottom-px h-px bg-brandblue-500"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 36,
                        }}
                      />
                    )}
                  </Link>
                );
              })}
            </nav>
          </LayoutGroup>

          {/* Desktop actions */}
          <div className="hidden items-center gap-5 min-[1081px]:flex">
            <LayoutGroup id="lang-desktop">
              <LanguageSwitcher tone={light ? "light" : "dark"} />
            </LayoutGroup>
            <Button
              href={t("cta.href")}
              icon={ArrowRight}
              size="small"
              iconPosition="right"
            >
              {t("cta.label")}
            </Button>
          </div>

          {/* Mobile controls */}
          <div className="flex items-center gap-3 min-[1081px]:hidden">
            <LayoutGroup id="lang-mobile">
              <LanguageSwitcher tone={light ? "light" : "dark"} />
            </LayoutGroup>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label={t("menuToggle")}
              aria-expanded={open}
              aria-controls={menuId}
              className={`relative inline-flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-md border transition-colors hover:border-brandblue-500/60 ${light ? "border-slate-200 text-slate-900" : "border-white/10 text-slate-100 hover:text-white"}`}
            >
              <AnimatePresence initial={false} mode="popLayout">
                <motion.span
                  key={open ? "close" : "open"}
                  initial={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: -90, scale: 0.6 }
                  }
                  animate={{ opacity: 1, rotate: 0, scale: 1 }}
                  exit={
                    reduce
                      ? { opacity: 0 }
                      : { opacity: 0, rotate: 90, scale: 0.6 }
                  }
                  transition={{ duration: 0.28, ease: EASE }}
                  className="grid place-items-center"
                >
                  {open ? (
                    <X className="size-5" />
                  ) : (
                    <Menu className="size-5" />
                  )}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Drawer + backdrop are siblings of the header, not children: the
          header's transform/backdrop-filter would otherwise become the
          containing block for these fixed layers and clip them. */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.button
              type="button"
              aria-label={t("menuToggle")}
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 top-21 z-30 bg-black/60 backdrop-blur-sm min-[1081px]:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            />

            {/* Mobile drawer */}
            <motion.nav
              id={menuId}
              className="fixed inset-x-0 top-21 z-40 max-h-[calc(100dvh-5.25rem)] overflow-y-auto border-t border-white/10 bg-ink px-6 pb-8 pt-4 md:px-12 min-[1081px]:hidden"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <motion.ul
                className="flex flex-col"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.05, delayChildren: 0.08 },
                  },
                }}
              >
                {menuItems.map((item) => (
                  <motion.li key={item.label} variants={itemVariants}>
                    <Link
                      href={item.href}
                      aria-current={isActive(item.href) ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center justify-between border-b border-white/[.06] py-4 text-[15px] font-medium transition-colors ${
                        isActive(item.href)
                          ? "text-brandblue-400"
                          : "text-slate-100 hover:text-brandblue-500"
                      }`}
                    >
                      {item.label}
                      <ArrowRight
                        aria-hidden
                        className="size-4 opacity-0 transition-[opacity,transform] duration-300 group-hover:translate-x-1 group-hover:opacity-100 rtl:rotate-180 rtl:group-hover:-translate-x-1"
                      />
                    </Link>
                  </motion.li>
                ))}
                <motion.li variants={itemVariants} className="mt-6">
                  <Button
                    href={t("cta.href")}
                    icon={ArrowRight}
                    size="large"
                    iconPosition="right"
                    className="w-full justify-center"
                  >
                    {t("cta.label")}
                  </Button>
                </motion.li>
              </motion.ul>
            </motion.nav>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
