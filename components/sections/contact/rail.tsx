import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { socialIcons } from "@/components/layout/footer/social-icons";
import { Stagger, StaggerItem } from "@/components/ui/motion";

type SocialLink = { label: string; href: string; network: string };

/**
 * Right rail for the form section — three stacked cards from the Figma:
 * "Prefer to read first?" (FAQ), Head Office Address (with the extracted map),
 * and Follow us. All server-rendered.
 */
export default function Rail() {
  const t = useTranslations("ContactPage.sidebar");
  const socials = useTranslations("Footer").raw("socials") as SocialLink[];

  return (
    <Stagger
      as="div"
      className="flex flex-col gap-5"
      stagger={0.1}
      delayChildren={0.15}
      amount={0.15}
    >
      {/* FAQ card */}
      <StaggerItem className="rounded-2xl bg-white p-7 shadow-[0_1px_2px_rgba(15,40,60,.04),0_12px_32px_-18px_rgba(15,40,60,.14)]">
        <h3 className="heading-sm-semibold text-slate-900">{t("faq.title")}</h3>
        <p className="body-md-regular mt-2 text-slate-600">
          {t("faq.description")}
        </p>
        <Link
          href="/solutions#catalogue"
          className="group mt-4 inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brandblue-600"
        >
          {t("faq.link")}
          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
        </Link>
      </StaggerItem>

      {/* Head office + map */}
      <StaggerItem className="overflow-hidden rounded-2xl bg-white p-7 shadow-[0_1px_2px_rgba(15,40,60,.04),0_12px_32px_-18px_rgba(15,40,60,.14)]">
        <h3 className="heading-sm-semibold text-slate-900">
          {t("office.title")}
        </h3>
        <p className="body-md-regular mt-2 text-slate-600">
          {t("office.address")}
        </p>
        <div className="relative mt-4 h-44 overflow-hidden rounded-lg border border-slate-100">
          <Image
            src="/assets/contact/map.jpg"
            alt={t("office.mapAlt")}
            fill
            sizes="(max-width: 1024px) 100vw, 460px"
            className="object-cover"
          />
        </div>
        <dl className="mt-5 space-y-2 text-[14px]">
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 text-slate-400">{t("office.tel")}</dt>
            <dd className="font-medium text-slate-700" dir="ltr">
              {t("office.telValue")}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 text-slate-400">{t("office.fax")}</dt>
            <dd className="font-medium text-slate-700" dir="ltr">
              {t("office.faxValue")}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 shrink-0 text-slate-400">
              {t("office.emailLabel")}
            </dt>
            <dd className="font-medium text-brandblue-600" dir="ltr">
              <a href="mailto:contact@infoline.om">{t("office.emailValue")}</a>
            </dd>
          </div>
        </dl>
      </StaggerItem>

      {/* Socials — reuses the footer's brand glyphs and link data */}
      <StaggerItem className="rounded-2xl bg-white p-7 shadow-[0_1px_2px_rgba(15,40,60,.04),0_12px_32px_-18px_rgba(15,40,60,.14)]">
        <h3 className="heading-sm-semibold text-slate-900">
          {t("social.title")}
        </h3>
        <p className="body-md-regular mt-2 text-slate-600">
          {t("social.description")}
        </p>
        <ul className="mt-4 flex items-center gap-3">
          {socials.map((social) => {
            const Icon = socialIcons[social.network];
            if (!Icon) return null;
            return (
              <li key={social.network}>
                <a
                  href={social.href}
                  aria-label={social.label}
                  className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors duration-300 hover:bg-brandblue-500 hover:text-white"
                >
                  <Icon className="size-4.5" />
                </a>
              </li>
            );
          })}
        </ul>
      </StaggerItem>
    </Stagger>
  );
}
