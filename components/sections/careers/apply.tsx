"use client";

import { useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { ArrowRight, ChevronDown } from "lucide-react";
import { Reveal } from "@/components/ui/motion";
import Honeypot from "@/components/ui/forms/honeypot";
import Turnstile from "@/components/ui/forms/turnstile";
import { isCmsEndpointConfigured } from "@/lib/cms-endpoint";
import { classifyInquiryResult, submitApplication } from "@/lib/forms";

type Role = { title: string };
type Values = { name: string; email: string; phone: string; position: string; message: string };

// Handover §4: PDF, DOC or DOCX, 5 MB max; 200 chars for text, 5000 for textareas.
const CV_EXTENSIONS = ["pdf", "doc", "docx"];
const CV_MAX_BYTES = 5 * 1024 * 1024;
const TEXT_MAX = 200;
const TEXTAREA_MAX = 5000;

const inputBase =
  "w-full rounded-md border bg-white px-4 py-3 text-[14px] leading-5 text-slate-800 placeholder:text-[#90a4ae] outline-none transition-[border-color,box-shadow] duration-200 focus:border-brandblue-400 focus:shadow-[0_0_0_3px_rgba(28,151,212,.14)]";
const inputClass = (invalid: boolean) =>
  `${inputBase} ${invalid ? "border-red-400" : "border-[#e0e0e0] hover:border-slate-300"}`;

function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-2 block text-[13px] leading-5 text-slate-600">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[12px] text-slate-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-[12.5px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Apply — the on-page job application (`#apply`). Submits multipart to the
 * REST /apply endpoint from the browser (rate limiting is per visitor IP).
 * The position comes from the vacancy row's `?position=` deep link, or the
 * select. Server messages are English-only, so errors map by field to our copy.
 */
export default function Apply() {
  const t = useTranslations("CareersPage.apply");
  const roles = useTranslations("CareersPage").raw("vacancies.roles") as Role[];
  const locale = useLocale();
  const uid = useId();
  const requested = useSearchParams().get("position") ?? "";

  const [values, setValues] = useState<Values>({
    name: "",
    email: "",
    phone: "",
    position: "",
    message: "",
  });
  const [cv, setCv] = useState<File | null>(null);
  const [touched, setTouched] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [turnstileToken, setTurnstileToken] = useState("");
  const inFlight = useRef(false);
  const cmsReady = isCmsEndpointConfigured();
  const cvInput = useRef<HTMLInputElement>(null);

  // A vacancy deep link wins until the visitor picks a role themselves.
  const deepLinked = roles.some((r) => r.title === requested) ? requested : "";
  const position = values.position || deepLinked;

  const set = (key: keyof Values, v: string) => {
    setValues((prev) => ({ ...prev, [key]: v }));
    setServerErrors((prev) => {
      if (!prev[key]) return prev;
      const rest = { ...prev };
      delete rest[key];
      return rest;
    });
  };

  const clientErrors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    if (!values.name.trim()) e.name = t("form.errors.name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) e.email = t("form.errors.email");
    if (!values.phone.trim()) e.phone = t("form.errors.phone");
    if (!position) e.position = t("form.errors.position");
    if (!cv) e.cv = t("form.errors.cv");
    else if (!CV_EXTENSIONS.includes(cv.name.split(".").pop()?.toLowerCase() ?? ""))
      e.cv = t("form.errors.cvType");
    else if (cv.size > CV_MAX_BYTES) e.cv = t("form.errors.cvSize");
    return e;
  };

  const errors = { ...(touched ? clientErrors() : {}), ...serverErrors };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (inFlight.current || !cmsReady) return;
    setTouched(true);
    if (Object.keys(clientErrors()).length > 0) return;

    const body = new FormData();
    body.append("name", values.name);
    body.append("email", values.email);
    body.append("phone", values.phone);
    body.append("position", position);
    body.append("message", values.message);
    body.append("cv", cv as File);
    body.append("website", String(new FormData(e.currentTarget).get("website") ?? ""));
    body.append("turnstileToken", turnstileToken);

    inFlight.current = true;
    setSubmitting(true);
    setGeneralError(null);
    setServerErrors({});
    try {
      const result = await submitApplication(body);
      const state = classifyInquiryResult(result);
      if (state === "success") {
        setSent(true);
      } else if (state === "field_errors") {
        const mapped: Record<string, string> = {};
        let unmapped = false;
        for (const item of result.validationErrors) {
          // Server messages are English-only — show our own copy (handover §3).
          if (t.has(`form.errors.${item.field}`)) mapped[item.field] = t(`form.errors.${item.field}`);
          else unmapped = true;
        }
        setServerErrors(mapped);
        if (unmapped) setGeneralError(t("form.submitError"));
      } else {
        setGeneralError(t("form.submitError"));
      }
    } catch {
      setGeneralError(t("form.submitError"));
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const reset = () => {
    setValues({ name: "", email: "", phone: "", position: "", message: "" });
    setCv(null);
    if (cvInput.current) cvInput.current.value = "";
    setTouched(false);
    setSent(false);
    setGeneralError(null);
    setServerErrors({});
  };

  return (
    <section id="apply" className="scroll-mt-24 bg-slate-25 py-10 lg:py-15">
      <div className="mx-auto w-full max-w-360 px-6 lg:px-10">
        <Reveal amount={0.1}>
          <div className="rounded-2xl bg-white p-8 shadow-[0_1px_2px_rgba(15,40,60,.04),0_18px_44px_-24px_rgba(15,40,60,.18)] lg:p-10">
            {sent ? (
              <div>
                <h3 className="heading-lg-semibold text-slate-900">{t("success.title")}</h3>
                <p className="body-lg-regular mt-3 max-w-[64ch] text-slate-600">
                  {t("success.description", { email: values.email })}
                </p>
                <button
                  type="button"
                  onClick={reset}
                  className="group mt-7 inline-flex items-center gap-2 font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-brandblue-600"
                >
                  {t("success.again")}
                  <ArrowRight className="size-3.5 rtl:rotate-180" />
                </button>
              </div>
            ) : (
              <>
                <h3 className="heading-lg-semibold text-slate-900">{t("title")}</h3>
                <p className="body-lg-regular mt-3 max-w-[64ch] text-slate-600">
                  {t("description")}
                </p>
                <form onSubmit={handleSubmit} noValidate className="mt-8">
                  <Honeypot />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label={t("form.name")} htmlFor={`${uid}-name`} error={errors.name}>
                      <input
                        id={`${uid}-name`}
                        className={inputClass(!!errors.name)}
                        placeholder={t("form.namePlaceholder")}
                        value={values.name}
                        maxLength={TEXT_MAX}
                        autoComplete="name"
                        onChange={(e) => set("name", e.target.value)}
                      />
                    </Field>
                    <Field label={t("form.email")} htmlFor={`${uid}-email`} error={errors.email}>
                      <input
                        id={`${uid}-email`}
                        type="email"
                        dir="ltr"
                        className={inputClass(!!errors.email)}
                        placeholder={t("form.emailPlaceholder")}
                        value={values.email}
                        maxLength={TEXT_MAX}
                        autoComplete="email"
                        onChange={(e) => set("email", e.target.value)}
                      />
                    </Field>
                    <Field label={t("form.phone")} htmlFor={`${uid}-phone`} error={errors.phone}>
                      <input
                        id={`${uid}-phone`}
                        type="tel"
                        dir="ltr"
                        className={inputClass(!!errors.phone)}
                        placeholder={t("form.phonePlaceholder")}
                        value={values.phone}
                        maxLength={TEXT_MAX}
                        autoComplete="tel"
                        onChange={(e) => set("phone", e.target.value)}
                      />
                    </Field>
                    <Field
                      label={t("form.position")}
                      htmlFor={`${uid}-position`}
                      error={errors.position}
                    >
                      <div className="relative">
                        <select
                          id={`${uid}-position`}
                          className={`${inputClass(!!errors.position)} appearance-none pe-10 ${position ? "" : "text-slate-400"}`}
                          value={position}
                          onChange={(e) => set("position", e.target.value)}
                        >
                          <option value="" disabled>
                            {t("form.positionPlaceholder")}
                          </option>
                          {roles.map((r) => (
                            <option key={r.title} value={r.title}>
                              {r.title}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute end-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                      </div>
                    </Field>
                  </div>

                  <div className="mt-4 space-y-4">
                    <Field
                      label={t("form.cv")}
                      htmlFor={`${uid}-cv`}
                      error={errors.cv}
                      hint={t("form.cvHint")}
                    >
                      <input
                        id={`${uid}-cv`}
                        ref={cvInput}
                        type="file"
                        name="cv"
                        accept=".pdf,.doc,.docx"
                        className={`${inputClass(!!errors.cv)} text-[13px] file:me-3 file:rounded file:border-0 file:bg-brandblue-50 file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-brandblue-700`}
                        onChange={(e) => {
                          setCv(e.target.files?.[0] ?? null);
                          setServerErrors((prev) => {
                            const rest = { ...prev };
                            delete rest.cv;
                            return rest;
                          });
                        }}
                      />
                    </Field>
                    <Field
                      label={t("form.message")}
                      htmlFor={`${uid}-msg`}
                      error={errors.message}
                    >
                      <textarea
                        id={`${uid}-msg`}
                        rows={4}
                        className={`${inputClass(!!errors.message)} resize-none`}
                        placeholder={t("form.messagePlaceholder")}
                        value={values.message}
                        maxLength={TEXTAREA_MAX}
                        onChange={(e) => set("message", e.target.value)}
                      />
                    </Field>
                  </div>

                  {generalError && (
                    <p
                      role="alert"
                      className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-medium text-red-700"
                    >
                      {generalError}
                    </p>
                  )}

                  {!cmsReady && (
                    <p
                      role="status"
                      className="mt-6 rounded-lg border border-slate-300 bg-slate-50 px-4 py-3 text-[13px] font-medium text-slate-700"
                    >
                      {t("form.unavailable")}
                    </p>
                  )}

                  {/* Turnstile — inert until the backend sets the key. */}
                  <Turnstile onToken={setTurnstileToken} language={locale} className="mt-6" />

                  <button
                    type="submit"
                    disabled={submitting || !cmsReady}
                    className="group mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-brandblue-500 px-4 text-[14px] font-medium text-white shadow-[0_8px_24px_-12px_rgba(28,151,212,.9)] transition-[background,box-shadow] duration-300 hover:bg-brandblue-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {submitting ? t("form.submitting") : t("form.submit")}
                    <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </button>
                </form>
              </>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
