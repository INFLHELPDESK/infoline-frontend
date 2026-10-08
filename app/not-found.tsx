import Button from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

/**
 * Root 404 fallback — shown for unmatched URLs outside any locale (e.g. before
 * middleware redirects). Hardcoded English copy; the locale-aware variant with
 * the same design lives in app/[locale]/not-found.tsx.
 */
export default function RootNotFound() {
  return (
    <section className="relative overflow-hidden bg-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/5 start-[-14%] aspect-square w-[43%] rounded-full bg-[radial-gradient(circle,#1C97D4_0%,transparent_68%)] opacity-30 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[72vh] w-full max-w-360 flex-col justify-center px-6 py-28 lg:px-10 lg:py-36">
        <span className="mb-8.5 font-mono text-[11.5px] font-medium uppercase tracking-[0.2em] text-lightblue-300">
          404
        </span>

        <h1 className="max-w-[16ch] text-[44px] font-bold leading-[1.05] tracking-[-.033em] text-white lg:text-[52px]">
          This page isn&apos;t here{" "}
          <span className="text-brandblue-400">just yet.</span>
        </h1>

        <p className="mt-7.5 max-w-[60ch] text-[16px] leading-[24px] text-slate-200">
          The page you&apos;re looking for is not available. It may be on its
          way — meanwhile, here&apos;s where we can take you.
        </p>

        <div className="mt-11 flex flex-wrap gap-4">
          <Button href="/" icon={ArrowRight} iconPosition="right">
            Back to home
          </Button>
          <Button href="/solutions" variant="secondary">
            Explore solutions
          </Button>
        </div>
      </div>
    </section>
  );
}
