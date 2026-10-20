import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
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
  const tagline = t.raw("tagline") as string[];

  return (
    <footer id="careers" className="bg-black text-slate-100">
      <div className="mx-auto max-w-340 px-6 md:px-12 xl:px-20">
        {/* Tagline + social links */}
        <div className="flex flex-col gap-8 border-t border-white/10 py-12 sm:flex-row sm:items-start sm:justify-between lg:px-[50px]">
          <p className="text-lg-plus text-[18px] leading-7 text-slate-100/60">
            {tagline.map((line, i) => (
              <span key={line}>
                {i > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
          <div className="flex flex-col gap-3 sm:items-end">
            <p className="text-[18px] leading-7 text-slate-100/60">
              {t("connect")}
            </p>
            <ul className="flex items-center gap-6">
              {socials.map((social) => {
                const Icon = socialIcons[social.network];
                if (!Icon) return null;
                return (
                  <li key={social.network}>
                    <Link
                      href={social.href}
                      aria-label={social.label}
                      className="inline-flex size-6 items-center justify-center text-slate-100/50 transition-colors duration-300 hover:text-white focus-visible:text-white"
                    >
                      <Icon className="size-6" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Link columns */}
        <Stagger
          as="div"
          className="grid grid-cols-1 gap-10 border-t border-white/10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:[&>*]:px-10"
          stagger={0.08}
          amount={0.25}
        >
          {columns.map((column) => (
            <StaggerItem as="div" key={column.title} distance={32} blur={false}>
              <p className="mb-6 text-base font-medium leading-6 text-slate-300">
                {column.title}
              </p>
              <div className="flex flex-col gap-3">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="text-[13px] leading-5 text-slate-100 transition-colors hover:text-white focus-visible:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </StaggerItem>
          ))}
        </Stagger>

        {/* Copyright + legal */}
        <div className="flex flex-col items-start gap-4 border-t border-white/10 py-10 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs font-medium uppercase leading-4 tracking-[1.5px] text-slate-600">
            {t("copyright")}
          </p>
          <div className="flex gap-6">
            {legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-base font-medium leading-6 text-[#4e5258] transition-colors hover:text-white focus-visible:text-white"
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
