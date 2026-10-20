import Hero from "@/components/sections/home-1/hero";
import WhyTrust from "@/components/sections/home-1/why-trust";
import WhatWeDo from "@/components/sections/home-1/what-we-do";
import Industries from "@/components/sections/home-1/industries";
import WhatChanges from "@/components/sections/home-1/what-changes";
import Proof from "@/components/sections/home-1/proof";
import ThreeWays from "@/components/sections/home-1/three-ways";
import Cta from "@/components/sections/home-1/cta";

export default function HomePage() {
  return (
    <main className="overflow-x-clip">
      <Hero />
      <WhyTrust />
      <WhatWeDo />
      <Industries />
      <WhatChanges />
      <Proof />
      <ThreeWays />
      <Cta />
    </main>
  );
}
