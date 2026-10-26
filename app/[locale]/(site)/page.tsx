import Hero from "@/components/sections/home-1/hero";
import Clients from "@/components/sections/home-1/clients";
import Partners from "@/components/sections/home/partners";
import WhyTrust from "@/components/sections/home-1/why-trust";
import WhatWeDo from "@/components/sections/home-1/what-we-do";
import Industries from "@/components/sections/home-1/industries";
import WhatChanges from "@/components/sections/home-1/what-changes";
import WhatChangesToggle from "@/components/sections/home-1/what-changes-toggle";
import Proof from "@/components/sections/home-1/proof";
import ThreeWays from "@/components/sections/home-1/three-ways";
import { isHomeVariantPreviewEnabled, resolveHomeVariant } from "@/lib/home-variant";

export default async function HomePage({
  searchParams,
}: PageProps<"/[locale]">) {
  // Only read the query where the preview switch is on, so Production never
  // depends on request data for this section.
  const variant = isHomeVariantPreviewEnabled()
    ? resolveHomeVariant((await searchParams).homeVariant)
    : "current";

  return (
    <main className="overflow-x-clip">
      <Hero />
      <Clients />
      <WhyTrust />
      <WhatWeDo />
      <Industries />
      {variant === "new" ? <WhatChangesToggle /> : <WhatChanges />}
      <Proof />
      <ThreeWays />
      <Partners />
    </main>
  );
}
