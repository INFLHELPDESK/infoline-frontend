import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "ar"],

  // Used when no locale matches
  defaultLocale: "en",

  // English is the confirmed default. Without this, next-intl sends `/` to
  // /ar for Arabic browsers or an NEXT_LOCALE=ar cookie. Explicit /ar and /en
  // URLs and the language switcher are unaffected.
  localeDetection: false,
});
