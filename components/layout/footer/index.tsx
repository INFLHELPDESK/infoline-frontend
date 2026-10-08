import { Link } from "@/i18n/navigation";
import Button from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/ui/motion";
import { socialIcons } from "./social-icons";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };
type SocialLink = { label: string; href: string; network: string };

export const Footer = () => {
  const t = useTranslations("Footer");
  const columns = t.raw("columns") as FooterColumn[];
  const socials = t.raw("socials") as SocialLink[];
  const legal = t.raw("legal") as FooterLink[];

  return (
    <footer id="careers" className="bg-ink pb-10 pt-[76px] text-slate-300">
      <div className="mx-auto max-w-340 px-6 md:px-12">
        <Stagger
          as="div"
          className="grid grid-cols-1 gap-11 sm:grid-cols-2 lg:grid-cols-[1.75fr_1fr_1fr_1fr_1fr]"
          stagger={0.08}
          amount={0.25}
        >
          <StaggerItem as="div" distance={32} blur={false}>
            <Link href="/" className="flex items-baseline gap-3">
              <Image
                src="/assets/logo.svg"
                alt={t("logoAlt")}
                width={100}
                height={24}
              />
            </Link>
            <p className="mt-5 body-sm-regular text-slate-400">
              {t("office")}
              <br />
              {t("contact")}
            </p>

            {/* Social links */}
            <ul className="mt-6 flex items-center gap-3">
              {socials.map((social) => {
                const Icon = socialIcons[social.network];
                if (!Icon) return null;
                return (
                  <li key={social.network}>
                    <Link
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex size-10 items-center justify-center rounded-full bg-white/[.06] text-slate-200 transition-colors duration-300 hover:bg-brandblue-500 hover:text-white"
                    >
                      <Icon className="size-[18px]" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <Button
              href={t("cta.href")}
              icon={ArrowRight}
              size="small"
              iconPosition="right"
              className="mt-7 justify-center"
            >
              {t("cta.label")}
            </Button>
          </StaggerItem>

          {columns.map((column) => (
            <StaggerItem as="div" key={column.title} distance={32} blur={false}>
              <p className="mb-[18px] font-mono text-[10.5px] font-medium uppercase tracking-[0.2em] text-slate-600">
                {column.title}
              </p>
              <div className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[13.5px] leading-[1.4] text-slate-200 transition-colors hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        <div className="mt-16 flex flex-col items-start gap-6 border-t border-white/[.08] pt-[26px] sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[12px] text-slate-600">
            {t("copyright")}
          </p>
          <div className="flex gap-6">
            {legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[12px] text-slate-500 transition-colors hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
