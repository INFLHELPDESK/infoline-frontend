import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { Inter, IBM_Plex_Sans_Arabic } from "next/font/google";
import "./globals.css";
import CustomCursor from "@/components/ui/cursor";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ProviderQueryWrapper } from "@/providers";
import { SITE_NAME, getSiteUrl, localeAlternates } from "@/lib/site";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
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
      className={`${inter.variable} ${ibmPlexSansArabic.variable} h-full antialiased`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <body className={locale === "ar" ? "font-arabic" : "font-latin"}>
        <NextIntlClientProvider>
          <ProviderQueryWrapper>
            <Header />
            {children}
            <Footer />
            <CustomCursor />
          </ProviderQueryWrapper>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
