import { getLocale } from "next-intl/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { getQueryClient } from "@/providers/query-client/get-query-client";
import { prefetchClients, prefetchPosts, type WpLocale } from "@/lib/wp";
import Industries from "@/components/sections/home/industries";
import Insights from "@/components/sections/home/insights";
import Main from "@/components/sections/home/main";
import Options from "@/components/sections/home/options";
import Partners from "@/components/sections/home/partners";
import PartnersLogos from "@/components/sections/home/partners-logos";
import Solutions from "@/components/sections/home/solutions";
import WhatChanges from "@/components/sections/home/what-changes";
import WhyInfoline from "@/components/sections/home/why-infoline";

export default async function HomePage() {
  const locale: WpLocale = (await getLocale()) === "ar" ? "ar" : "en";
  const queryClient = getQueryClient();
  await Promise.allSettled([
    prefetchClients(queryClient, locale),
    prefetchPosts(queryClient, locale),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <main className="overflow-x-clip">
        <Main />
        <PartnersLogos />
        <WhyInfoline />
        <Solutions />
        <Industries />
        <WhatChanges />
        <Partners />
        <Options />
        <Insights />
      </main>
    </HydrationBoundary>
  );
}
