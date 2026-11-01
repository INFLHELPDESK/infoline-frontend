import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Tajawal } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import CustomCursor from "@/components/ui/cursor";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { HeaderThemeProvider } from "@/components/layout/header/theme";
import { LocaleTargetsProvider } from "@/components/layout/header/locale-targets";
import { SITE_NAME, getSiteUrl, localeAlternates } from "@/lib/site";
// Approved English face (Figma handoff): Avenir, from the supplied TTFs.
// The files' OS/2 weights are not in visual order (Black=800 is heavier than
// Heavy=900), so each CSS weight is declared explicitly to follow Figma, whose
// "semibold" styles use Heavy and "bold" styles use Black:
//   400 Roman | 500 Medium | 600 Heavy | 700-800 Black | 900 Heavy
const avenir = localFont({
  variable: "--font-avenir",
  display: "swap",
  preload: false,
  src: [
    { path: "./fonts/Avenir-Roman.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Avenir-Medium.ttf", weight: "500", style: "normal" },
    { path: "./fonts/Avenir-Heavy.ttf", weight: "600", style: "normal" },
    { path: "./fonts/Avenir-Black.ttf", weight: "700 800", style: "normal" },
    { path: "./fonts/Avenir-Heavy.ttf", weight: "900", style: "normal" },
  ],
});
// Approved Arabic face (Figma handoff).
const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700", "800"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale, siteUrl] = await Promise.all([
    getTranslations("Metadata"),
    getLocale(),
    getSiteUrl(),
  ]);
  const title = t("title");
  const description = t("description");

  return {
    metadataBase: new URL(siteUrl),
    title,
    description,
    alternates: await localeAlternates(locale),
    robots: { index: true, follow: true },
    icons: {
      icon: [
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      ],
      apple: { url: "/apple-touch-icon.png", sizes: "180x180" },
    },
    manifest: "/site.webmanifest",
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "website",
      locale: locale === "ar" ? "ar_OM" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function RootLayout({
  children,
}: LayoutProps<"/[locale]">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${avenir.variable} ${tajawal.variable} h-full antialiased`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <body className={locale === "ar" ? "font-arabic" : "font-latin"}>
        <NextIntlClientProvider>
          <HeaderThemeProvider>
            <LocaleTargetsProvider>
              <Header />
              {children}
              <Footer />
            </LocaleTargetsProvider>
          </HeaderThemeProvider>
          <CustomCursor />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
