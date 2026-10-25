// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const replace = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  usePathname: () => "/insights/hello",
  useRouter: () => ({ replace }),
}));
vi.mock("next-intl", () => ({
  useLocale: () => "en",
  useTranslations: () => () => "Language",
}));
vi.mock("framer-motion", () => ({
  motion: { span: (p: object) => <span {...p} /> },
}));

import LanguageSwitcher from "@/components/layout/header/language-switcher";
import { LocaleTargetsProvider, LocaleTargetsRegistrar } from "@/components/layout/header/locale-targets";

afterEach(cleanup);

const setup = (targets?: Record<string, string>) =>
  render(
    <LocaleTargetsProvider>
      {targets ? <LocaleTargetsRegistrar targets={targets} /> : null}
      <LanguageSwitcher />
    </LocaleTargetsProvider>,
  );

describe("LanguageSwitcher with CMS targets", () => {
  it("keeps the path on pages that declare nothing", () => {
    replace.mockClear();
    setup();
    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    expect(replace).toHaveBeenCalledWith("/insights/hello", { locale: "ar" });
  });
  it("uses the CMS translated URI, not the current slug", () => {
    replace.mockClear();
    setup({ ar: "/insights/مرحبا" });
    fireEvent.click(screen.getByRole("button", { name: "العربية" }));
    expect(replace).toHaveBeenCalledWith("/insights/مرحبا", { locale: "ar" });
  });
  it("disables a locale with no verified translation and never navigates", () => {
    replace.mockClear();
    setup({});
    const ar = screen.getByRole("button", { name: "العربية" });
    expect((ar as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(ar);
    expect(replace).not.toHaveBeenCalled();
    expect((screen.getByRole("button", { name: "English" }) as HTMLButtonElement).disabled).toBe(false);
  });
});
