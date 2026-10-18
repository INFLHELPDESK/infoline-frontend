import en from "../../../locales/en.json";
import ar from "../../../locales/ar.json";

/** Locale copy for assertions — tests never hard-code UI strings. */
export const messages = { en, ar } as const;

export type Locale = keyof typeof messages;

export const locales = Object.keys(messages) as Locale[];

export const dirFor = (locale: Locale) => (locale === "ar" ? "rtl" : "ltr");
