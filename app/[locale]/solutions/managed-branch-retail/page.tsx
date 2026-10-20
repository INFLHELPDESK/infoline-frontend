import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import ManagedBranch from "@/components/sections/solutions/managed-branch";
import { localeAlternates } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("SolutionsPage.managedBranch"),
    getLocale(),
  ]);

  return {
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: await localeAlternates(
      locale,
      "/solutions/managed-branch-retail",
    ),
  };
}

export default function ManagedBranchRetailPage() {
  return (
    <main className="overflow-x-clip">
      <ManagedBranch />
    </main>
  );
}
