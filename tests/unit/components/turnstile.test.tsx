// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The site key is inlined at build time, so the E2E build (no key) can only
 * cover the "inert" branch. These tests cover the keyed branch in isolation.
 */

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

type RenderOptions = {
  sitekey: string;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
  theme?: string;
  language?: string;
};

function stubTurnstileApi() {
  const api = {
    render: vi.fn<(el: HTMLElement, options: RenderOptions) => string>(() => "widget-1"),
    remove: vi.fn(),
    reset: vi.fn(),
  };
  window.turnstile = api;
  return api;
}

/** Fresh module per test: the script-loading promise is module-level state. */
async function loadTurnstile() {
  vi.resetModules();
  return (await import("@/components/ui/forms/turnstile")).default;
}

const flush = () => act(async () => {});

beforeEach(() => {
  delete window.turnstile;
  document.head.querySelectorAll("script").forEach((s) => s.remove());
});

afterEach(() => {
  cleanup();
});

describe("Turnstile", () => {
  it("renders nothing and loads no script without a site key", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    const Turnstile = await loadTurnstile();
    const onToken = vi.fn();

    const { container } = render(<Turnstile onToken={onToken} language="ar" />);
    await flush();

    expect(container.innerHTML).toBe("");
    expect(document.querySelector(`script[src^="${SCRIPT_SRC}"]`)).toBeNull();
    expect(onToken).not.toHaveBeenCalled();
  });

  it("injects the Cloudflare script and renders the widget after it loads", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const Turnstile = await loadTurnstile();

    const { container } = render(<Turnstile onToken={vi.fn()} language="ar" className="mt-6" />);
    await flush();

    const scripts = document.querySelectorAll<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`);
    expect(scripts).toHaveLength(1);
    expect(scripts[0].async).toBe(true);

    const api = stubTurnstileApi();
    await act(async () => {
      scripts[0].dispatchEvent(new Event("load"));
    });

    const placeholder = container.querySelector("[data-turnstile-placeholder]");
    expect(placeholder?.className).toBe("mt-6");
    expect(api.render).toHaveBeenCalledTimes(1);
    const [el, options] = api.render.mock.calls[0];
    expect(el).toBe(placeholder);
    expect(options).toMatchObject({ sitekey: "site-key", theme: "light", language: "ar" });
  });

  it("reports tokens, clears them on expiry, and removes the widget on unmount", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const api = stubTurnstileApi();
    const Turnstile = await loadTurnstile();
    const onToken = vi.fn();

    const { unmount } = render(<Turnstile onToken={onToken} />);
    await flush();

    const options = api.render.mock.calls[0][1];
    expect(options).not.toHaveProperty("language");

    act(() => options.callback?.("token-123"));
    expect(onToken).toHaveBeenLastCalledWith("token-123");

    act(() => options["expired-callback"]?.());
    expect(onToken).toHaveBeenLastCalledWith("");

    unmount();
    expect(api.remove).toHaveBeenCalledWith("widget-1");
  });

  it("clears the token and hides the widget on a widget error", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const api = stubTurnstileApi();
    const Turnstile = await loadTurnstile();
    const onToken = vi.fn();

    const { container } = render(<Turnstile onToken={onToken} />);
    await flush();
    act(() => api.render.mock.calls[0][1]["error-callback"]?.());

    expect(onToken).toHaveBeenLastCalledWith("");
    expect(container.innerHTML).toBe("");
  });

  it("hides the widget when the script fails to load", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "site-key");
    const Turnstile = await loadTurnstile();

    const { container } = render(<Turnstile onToken={vi.fn()} />);
    await flush();
    const script = document.querySelector<HTMLScriptElement>(`script[src^="${SCRIPT_SRC}"]`)!;
    await act(async () => {
      script.dispatchEvent(new Event("error"));
    });

    expect(container.innerHTML).toBe("");
  });
});
