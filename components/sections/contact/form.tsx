"use client";

import { useId, useRef, useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CalendarClock, ChevronDown } from "lucide-react";
import { EASE } from "@/components/ui/motion/shared";
import Turnstile from "@/components/ui/forms/turnstile";
import Honeypot from "@/components/ui/forms/honeypot";
import {
  submitInquiry,
  classifyInquiryResult,
  type ProjectType,
  type StartTimeline,
} from "@/lib/forms";
import { useRouteSelection, type RouteId } from "./route-context";
import Rail from "./rail";

type Strings = Record<string, string>;

const fieldMotion = (reduce: boolean) => ({
  initial: reduce ? { opacity: 0 } : { opacity: 0, height: 0 },
  animate: reduce ? { opacity: 1 } : { opacity: 1, height: "auto" },
  exit: reduce ? { opacity: 0 } : { opacity: 0, height: 0 },
  transition: { duration: 0.4, ease: EASE },
  className: "overflow-hidden",
});

/** One labelled input row; error text animates in only when touched+invalid. */
function Field({
  label,
  error,
  htmlFor,
  children,
}: {
  label: string;
  error?: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-[13.5px] font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="mt-1.5 text-[12.5px] font-medium text-red-600"
            role="alert"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border bg-white px-4 py-3 text-[14.5px] text-slate-800 placeholder:text-slate-400 outline-none transition-[border-color,box-shadow] duration-200 focus:border-brandblue-400 focus:shadow-[0_0_0_3px_rgba(28,151,212,.14)]";

function inputClass(invalid?: boolean) {
  return `${inputBase} ${
    invalid ? "border-red-400" : "border-slate-200 hover:border-slate-300"
  }`;
}

export default function Form({
  services = [],
}: {
  /**
   * Catalogue names for the service route's select, resolved on the server
   * (root-scope `Solutions.items`) and passed down — client-side cross-
   * namespace `t.raw` lookups don't resolve in the browser.
   */
  services: { title: string }[];
}) {
  const t = useTranslations("ContactPage");
  const locale = useLocale();
  const reduce = !!useReducedMotion();
  const uid = useId();

  const { route } = useRouteSelection();
  const [values, setValues] = useState<Strings>({
    name: "",
    organisation: "",
    email: "",
    country: "",
    service: "",
    projectType: "",
    timeline: "",
    vendorCategory: "",
    message: "",
    role: "",
  });
  const [touched, setTouched] = useState<Strings>({});
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState("");

  const formRef = useRef<HTMLDivElement>(null);
  const successRef = useRef<HTMLDivElement>(null);

  const countries = t.raw("form.countries") as string[];
  const timelineOptions = t.raw("form.timelineOptions") as string[];
  const projectTypeOptions = t.raw("form.projectTypeOptions") as string[];
  const vendorOptions = t.raw("form.vendorCategoryOptions") as string[];
  // Index-aligned with the label arrays above — maps UI label -> API key.
  const timelineKeys = t.raw("form.timelineKeys") as string[];
  const projectTypeKeys = t.raw("form.projectTypeKeys") as string[];

  const set = (key: string, v: string) =>
    setValues((prev) => ({ ...prev, [key]: v }));
  const blur = (key: string) => setTouched((prev) => ({ ...prev, [key]: "1" }));

  /** UI label -> fixed API key (handover: send the key, not the label). */
  const keyForLabel = (label: string, keys: string[], labels: string[]) =>
    keys[labels.indexOf(label)] ?? label;

  /** Field-level validation — only surfaces once a field is touched. */
  const errorFor = (key: string): string | undefined => {
    // Server-side validation errors take precedence (mapped by field).
    if (serverFieldErrors[key]) return serverFieldErrors[key];
    if (!touched[key]) return undefined;
    const v = values[key].trim();
    switch (key) {
      case "name":
        return v.length < 2 ? t("form.errors.name") : undefined;
      case "email":
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)
          ? undefined
          : t("form.errors.email");
      case "organisation":
        return route === "careers"
          ? undefined
          : v
            ? undefined
            : t("form.errors.organisation");
      case "country":
        return v ? undefined : t("form.errors.country");
      case "service":
        return v ? undefined : t("form.errors.service");
      case "projectType":
        return v ? undefined : t("form.errors.projectType");
      case "timeline":
        return v ? undefined : t("form.errors.timeline");
      case "vendorCategory":
        return v ? undefined : t("form.errors.vendor");
      case "message": {
        if (route === "careers") return undefined;
        if (route === "vendor") return undefined;
        return v.trim().length < 10 ? t("form.errors.message") : undefined;
      }
      case "role":
        return v.trim() ? undefined : t("form.errors.role");
      default:
        return undefined;
    }
  };

  const requiredKeys: Record<RouteId, string[]> = {
    service: ["name", "email", "organisation", "country", "service", "message"],
    project: [
      "name",
      "email",
      "organisation",
      "country",
      "projectType",
      "timeline",
      "message",
    ],
    vendor: ["name", "email", "organisation", "country", "vendorCategory"],
    careers: ["name", "email", "role"],
  };

  const currentErrors = requiredKeys[route]
    .map(errorFor)
    .filter(Boolean) as string[];
  const invalid = currentErrors.length > 0;

  const submitLabel = {
    service: t("form.sendService"),
    project: t("form.sendProject"),
    vendor: t("form.sendProject"),
    careers: t("form.sendCareers"),
  }[route];

  const sectionLabel = {
    service: t("form.sections.service"),
    project: t("form.sections.project"),
    vendor: t("form.sections.vendor"),
    careers: t("form.sections.careers"),
  }[route];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(Object.fromEntries(requiredKeys[route].map((k) => [k, "1"])));
    if (invalid) return;

    // Vendor route has no API form yet (handover §2 lists only the three
    // GraphQL inquiries + job application) — keep the local success state.
    if (route === "vendor") {
      setSent(true);
      requestAnimationFrame(() =>
        successRef.current?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "nearest",
        }),
      );
      return;
    }

    setSubmitting(true);
    setGeneralError(null);
    setServerFieldErrors({});

    try {
      const result = await submitInquiry(
        route === "service"
          ? {
              action: "service_inquiry",
              name: values.name,
              organisation: values.organisation,
              workEmail: values.email,
              country: values.country,
              service: values.service,
              message: values.message,
              website: "",
              turnstileToken,
            }
          : {
              action: "project_inquiry",
              name: values.name,
              organisation: values.organisation,
              workEmail: values.email,
              country: values.country,
              projectType: keyForLabel(
                values.projectType,
                projectTypeOptions,
                projectTypeKeys,
              ) as ProjectType,
              startTimeline: keyForLabel(
                values.timeline,
                timelineOptions,
                timelineKeys,
              ) as StartTimeline,
              message: values.message,
              website: "",
              turnstileToken,
            },
      );

      const state = classifyInquiryResult(result);
      if (state === "success") {
        setSent(true);
        requestAnimationFrame(() =>
          successRef.current?.scrollIntoView({
            behavior: reduce ? "auto" : "smooth",
            block: "nearest",
          }),
        );
      } else if (state === "field_errors") {
        // Map server errors onto our fields (field names match inputs).
        const mapped: Record<string, string> = {};
        for (const errItem of result.validationErrors) {
          const uiKey =
            errItem.field === "workEmail"
              ? "email"
              : errItem.field === "startTimeline"
                ? "timeline"
                : errItem.field;
          // Server messages are English-only — show our own copy (handover §3).
          mapped[uiKey] = t(`form.errors.${uiKey}`);
        }
        setServerFieldErrors(mapped);
        setTouched(Object.fromEntries(Object.keys(mapped).map((k) => [k, "1"])));
      } else {
        // Rate limit / server error — show the general message.
        setGeneralError(t("form.submitError"));
      }
    } catch {
      setGeneralError(t("form.submitError"));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues({
      name: "",
      organisation: "",
      email: "",
      country: "",
      service: "",
      projectType: "",
      timeline: "",
      vendorCategory: "",
      message: "",
      role: "",
    });
    setTouched({});
    setSent(false);
    setGeneralError(null);
    setServerFieldErrors({});
    formRef.current?.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  };

  const err = (k: string) => errorFor(k) !== undefined;

  return (
    <section className="bg-slate-25 py-6xl" id="enquiry">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-14">
          <div>
            {/* Section label mirrors the mono eyebrow from the Figma */}
            <div aria-hidden className="sr-only">
              {sectionLabel}
            </div>
            <p className="mb-6 font-mono text-[11.5px] font-semibold uppercase tracking-[0.2em] text-brandblue-600">
              {sectionLabel}
            </p>

            <div ref={formRef} className="relative">
              <AnimatePresence mode="wait" initial={false}>
                {sent ? (
                  <motion.div
                    key="success"
                    ref={successRef}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
                    transition={{ duration: 0.5, ease: EASE }}
                    className="rounded-2xl bg-white p-10 shadow-[0_1px_2px_rgba(15,40,60,.04),0_18px_44px_-24px_rgba(15,40,60,.18)]"
                  >
                    {/* Drawn check mark — the Figma's green circle, animated */}
                    <motion.span
                      className="mb-6 flex size-12 items-center justify-center rounded-full bg-emerald-50"
                      initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className="size-6 text-emerald-600"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2.4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <motion.path
                          d="M4.5 12.5l5 5L19.5 7"
                          initial={{ pathLength: reduce ? 1 : 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{
                            duration: reduce ? 0 : 0.5,
                            delay: reduce ? 0 : 0.2,
                            ease: EASE,
                          }}
                        />
                      </svg>
                    </motion.span>
                    <h3 className="heading-lg-semibold text-slate-900">
                      {t(`success.title.${route}`)}
                    </h3>
                    <p className="body-lg-regular mt-3 max-w-[64ch] text-slate-600">
                      {t(`success.description.${route}`, { email: values.email })}
                    </p>
                    <button
                      type="button"
                      onClick={reset}
                      className="group mt-7 inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brandblue-600"
                    >
                      {t("success.again")}
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16 }}
                    transition={{ duration: 0.5, ease: EASE }}
                  >
                    <form
                      onSubmit={handleSubmit}
                      noValidate
                      className="rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(15,40,60,.04),0_18px_44px_-24px_rgba(15,40,60,.18)] lg:p-10"
                    >
                      {/* Honeypot — every form ships it (Phase 3 handover). */}
                      <Honeypot />

                      {/* ---- Shared: your details ---- */}
                      <p className="mb-6 font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                        {t("form.yourDetails")}
                      </p>
                      <div className="grid gap-5 md:grid-cols-2">
                        <Field
                          label={t("form.name")}
                          error={errorFor("name")}
                          htmlFor={`${uid}-name`}
                        >
                          <input
                            id={`${uid}-name`}
                            className={inputClass(err("name"))}
                            placeholder={t("form.namePlaceholder")}
                            value={values.name}
                            onChange={(e) => set("name", e.target.value)}
                            onBlur={() => blur("name")}
                            autoComplete="name"
                          />
                        </Field>
                        <Field
                          label={t("form.organisation")}
                          error={errorFor("organisation")}
                          htmlFor={`${uid}-org`}
                        >
                          <input
                            id={`${uid}-org`}
                            className={inputClass(err("organisation"))}
                            placeholder={t("form.organisationPlaceholder")}
                            value={values.organisation}
                            onChange={(e) =>
                              set("organisation", e.target.value)
                            }
                            onBlur={() => blur("organisation")}
                            autoComplete="organization"
                          />
                        </Field>
                        <Field
                          label={t("form.workEmail")}
                          error={errorFor("email")}
                          htmlFor={`${uid}-email`}
                        >
                          <input
                            id={`${uid}-email`}
                            type="email"
                            dir="ltr"
                            className={inputClass(err("email"))}
                            placeholder={t("form.emailPlaceholder")}
                            value={values.email}
                            onChange={(e) => set("email", e.target.value)}
                            onBlur={() => blur("email")}
                            autoComplete="email"
                          />
                        </Field>
                        <Field
                          label={t("form.country")}
                          error={errorFor("country")}
                          htmlFor={`${uid}-country`}
                        >
                          <div className="relative">
                            <select
                              id={`${uid}-country`}
                              className={`${inputClass(err("country"))} appearance-none pe-10 ${values.country ? "" : "text-slate-400"}`}
                              value={values.country}
                              onChange={(e) => set("country", e.target.value)}
                              onBlur={() => blur("country")}
                            >
                              <option value="" disabled>
                                {t("form.countryPlaceholder")}
                              </option>
                              {countries.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                          </div>
                        </Field>
                      </div>

                      {/* ---- Route-specific block ---- */}
                      <AnimatePresence initial={false} mode="wait">
                        <motion.div key={route} {...fieldMotion(reduce)}>
                          <div className="mt-9 border-t border-slate-100 pt-9">
                            {route === "service" && (
                              <div className="space-y-5">
                                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                  {t("form.aboutEngagement")}
                                </p>
                                <Field
                                  label={t("form.service")}
                                  error={errorFor("service")}
                                  htmlFor={`${uid}-service`}
                                >
                                  <div className="relative">
                                    <select
                                      id={`${uid}-service`}
                                      className={`${inputClass(err("service"))} appearance-none pe-10 ${values.service ? "" : "text-slate-400"}`}
                                      value={values.service}
                                      onChange={(e) =>
                                        set("service", e.target.value)
                                      }
                                      onBlur={() => blur("service")}
                                    >
                                      <option value="" disabled>
                                        {t("form.servicePlaceholder")}
                                      </option>
                                      {services?.map((s) => (
                                        <option key={s.title} value={s.title}>
                                          {s.title}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                  </div>
                                </Field>
                                <Field
                                  label={t("form.fix")}
                                  error={errorFor("message")}
                                  htmlFor={`${uid}-msg`}
                                >
                                  <textarea
                                    id={`${uid}-msg`}
                                    rows={4}
                                    className={`${inputClass(err("message"))} resize-none`}
                                    placeholder={t("form.fixPlaceholder")}
                                    value={values.message}
                                    onChange={(e) =>
                                      set("message", e.target.value)
                                    }
                                    onBlur={() => blur("message")}
                                  />
                                </Field>
                              </div>
                            )}

                            {route === "project" && (
                              <div className="space-y-5">
                                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                  {t("form.yourProject")}
                                </p>
                                <Field
                                  label={t("form.projectType")}
                                  error={errorFor("projectType")}
                                  htmlFor={`${uid}-ptype`}
                                >
                                  <div className="relative">
                                    <select
                                      id={`${uid}-ptype`}
                                      className={`${inputClass(err("projectType"))} appearance-none pe-10 ${values.projectType ? "" : "text-slate-400"}`}
                                      value={values.projectType}
                                      onChange={(e) =>
                                        set("projectType", e.target.value)
                                      }
                                      onBlur={() => blur("projectType")}
                                    >
                                      <option value="" disabled>
                                        {t("form.projectTypePlaceholder")}
                                      </option>
                                      {projectTypeOptions.map((o) => (
                                        <option key={o} value={o}>
                                          {o}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                  </div>
                                </Field>
                                <div>
                                  <span className="mb-2.5 block text-[13.5px] font-medium text-slate-700">
                                    {t("form.timeline")}
                                  </span>
                                  <div className="flex flex-wrap gap-2.5">
                                    {timelineOptions.map((o) => {
                                      const active = values.timeline === o;
                                      return (
                                        <button
                                          key={o}
                                          type="button"
                                          onClick={() => {
                                            set("timeline", o);
                                            blur("timeline");
                                          }}
                                          aria-pressed={active}
                                          className={`rounded-full border px-4.5 py-2.5 text-[13.5px] transition-[background,border-color,color,box-shadow] duration-200 ${
                                            active
                                              ? "border-brandblue-500 bg-brandblue-50 text-brandblue-700 shadow-[0_0_0_3px_rgba(28,151,212,.1)]"
                                              : "border-slate-200 bg-white text-slate-600 hover:border-brandblue-300 hover:text-brandblue-600"
                                          }`}
                                        >
                                          {o}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <AnimatePresence initial={false}>
                                    {errorFor("timeline") && (
                                      <motion.p
                                        className="mt-1.5 text-[12.5px] font-medium text-red-600"
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -4 }}
                                        role="alert"
                                      >
                                        {t("form.errors.timeline")}
                                      </motion.p>
                                    )}
                                  </AnimatePresence>
                                </div>
                                <Field
                                  label={t("form.build")}
                                  error={errorFor("message")}
                                  htmlFor={`${uid}-msg`}
                                >
                                  <textarea
                                    id={`${uid}-msg`}
                                    rows={4}
                                    className={`${inputClass(err("message"))} resize-none`}
                                    placeholder={t("form.messagePlaceholder")}
                                    value={values.message}
                                    onChange={(e) =>
                                      set("message", e.target.value)
                                    }
                                    onBlur={() => blur("message")}
                                  />
                                </Field>
                              </div>
                            )}

                            {route === "vendor" && (
                              <div className="space-y-5">
                                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                  {t("form.aboutEngagement")}
                                </p>
                                <Field
                                  label={t("form.vendorCategory")}
                                  error={errorFor("vendorCategory")}
                                  htmlFor={`${uid}-vcat`}
                                >
                                  <div className="relative">
                                    <select
                                      id={`${uid}-vcat`}
                                      className={`${inputClass(err("vendorCategory"))} appearance-none pe-10 ${values.vendorCategory ? "" : "text-slate-400"}`}
                                      value={values.vendorCategory}
                                      onChange={(e) =>
                                        set("vendorCategory", e.target.value)
                                      }
                                      onBlur={() => blur("vendorCategory")}
                                    >
                                      <option value="" disabled>
                                        {t("form.servicePlaceholder")}
                                      </option>
                                      {vendorOptions.map((o) => (
                                        <option key={o} value={o}>
                                          {o}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                  </div>
                                </Field>
                                <Field
                                  label={t("form.messageOptional")}
                                  htmlFor={`${uid}-msg`}
                                >
                                  <textarea
                                    id={`${uid}-msg`}
                                    rows={4}
                                    className={`${inputBase} border-slate-200 hover:border-slate-300 resize-none`}
                                    placeholder={t(
                                      "form.messageOptionalPlaceholder",
                                    )}
                                    value={values.message}
                                    onChange={(e) =>
                                      set("message", e.target.value)
                                    }
                                  />
                                </Field>
                              </div>
                            )}

                            {route === "careers" && (
                              <div className="space-y-5">
                                <p className="font-mono text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                  {t("form.aboutEngagement")}
                                </p>
                                <Field
                                  label={t("form.roleInterest")}
                                  error={errorFor("role")}
                                  htmlFor={`${uid}-role`}
                                >
                                  <input
                                    id={`${uid}-role`}
                                    className={inputClass(err("role"))}
                                    placeholder={t("form.rolePlaceholder")}
                                    value={values.role}
                                    onChange={(e) =>
                                      set("role", e.target.value)
                                    }
                                    onBlur={() => blur("role")}
                                  />
                                </Field>
                                <Field
                                  label={t("form.messageOptional")}
                                  htmlFor={`${uid}-msg`}
                                >
                                  <textarea
                                    id={`${uid}-msg`}
                                    rows={4}
                                    className={`${inputBase} border-slate-200 hover:border-slate-300 resize-none`}
                                    placeholder={t(
                                      "form.messageOptionalPlaceholder",
                                    )}
                                    value={values.message}
                                    onChange={(e) =>
                                      set("message", e.target.value)
                                    }
                                  />
                                </Field>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </AnimatePresence>

                      {/* ---- Submission feedback ---- */}
                      {generalError && (
                        <p
                          role="alert"
                          className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700"
                        >
                          {generalError}
                        </p>
                      )}

                      {/* Turnstile — inert until the backend sets the key. */}
                      <Turnstile
                        onToken={setTurnstileToken}
                        language={locale}
                        className="mt-6"
                      />

                      {/* ---- Actions ---- */}
                      <div className="mt-9 flex flex-wrap items-center gap-3.5">
                        <button
                          type="submit"
                          disabled={submitting}
                          className="group inline-flex items-center gap-2.5 rounded-md bg-brandblue-500 px-7 py-4 text-[12.5px] font-semibold uppercase tracking-[0.11em] text-white shadow-[0_8px_24px_-12px_rgba(28,151,212,.9)] transition-[background,box-shadow,transform] duration-300 [transition-timing-function:cubic-bezier(.16,1,.3,1)] hover:bg-brandblue-600 hover:shadow-[0_16px_34px_-14px_rgba(28,151,212,1)] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {submitting ? t("form.submitting") : submitLabel}
                          <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                        </button>
                        <a
                          href="mailto:connect@infoline.om"
                          className="inline-flex items-center rounded-md border border-slate-200 px-7 py-4 text-[12.5px] font-semibold uppercase tracking-[0.11em] text-slate-700 transition-[border-color,background] duration-300 hover:border-slate-400 hover:bg-slate-50"
                        >
                          <CalendarClock className="me-2.5 size-4 text-brandblue-600" />
                          {t("form.bookCall")}
                        </a>
                      </div>
                      <p className="mt-5 inline-flex items-center gap-2 rounded-full bg-brandblue-50 px-3.5 py-1.5 text-[12.5px] font-medium text-brandblue-700">
                        <span className="relative flex size-2">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brandblue-400 opacity-60" />
                          <span className="relative inline-flex size-2 rounded-full bg-brandblue-500" />
                        </span>
                        {t("form.respondNote")}
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <Rail />
        </div>
      </div>
    </section>
  );
}
