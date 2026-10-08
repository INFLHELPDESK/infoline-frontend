"use client";

import { useEffect, useId, useRef, useState } from "react";

/**
 * Cloudflare Turnstile widget wrapper — Phase 3 handover §3.
 *
 * Turnstile is built into the API but inactive until the backend sets the
 * secret key. We render the widget and pass its token as `turnstileToken`;
 * while the key is unset the token is ignored server-side, so this is safe
 * to ship now and required once verification switches on.
 *
 * Renders nothing when NEXT_PUBLIC_TURNSTILE_SITE_KEY is not configured,
 * so local/dev environments are unaffected.
 */

// Minimal typings for the Turnstile global injected by the script.
type TurnstileApi = {
  render: (
    el: HTMLElement,
    options: {
      sitekey: string;
      callback?: (token: string) => void;
      "expired-callback"?: () => void;
      "error-callback"?: () => void;
      theme?: "light" | "dark" | "auto";
      language?: string;
    },
  ) => string;
  remove: (widgetId: string) => void;
  reset: (widgetId?: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

let scriptPromise: Promise<void> | null = null;

function loadTurnstile(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src^="${SCRIPT_SRC}"]`,
    );
    const script = existing ?? document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () =>
      reject(new Error("Failed to load Turnstile script")),
    );
    if (!existing) document.head.appendChild(script);
  });

  return scriptPromise;
}

export default function Turnstile({
  onToken,
  language,
  className,
}: {
  onToken: (token: string) => void;
  /** BCP-47 tag (e.g. "ar") so the widget matches the page language. */
  language?: string;
  className?: string;
}) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerId = useId();
  const widgetRef = useRef<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!siteKey) return;

    let cancelled = false;

    loadTurnstile()
      .then(() => {
        if (cancelled || !window.turnstile) return;
        const el = document.getElementById(containerId);
        if (!el || widgetRef.current) return;
        widgetRef.current = window.turnstile.render(el, {
          sitekey: siteKey,
          callback: (token) => onToken(token),
          "expired-callback": () => onToken(""),
          "error-callback": () => {
            onToken("");
            setFailed(true);
          },
          theme: "light",
          ...(language ? { language } : {}),
        });
      })
      .catch(() => setFailed(true));

    return () => {
      cancelled = true;
      if (widgetRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetRef.current);
        } catch {
          // Widget already gone — nothing to clean up.
        }
        widgetRef.current = null;
      }
    };
  }, [siteKey, containerId, language, onToken]);

  // No site key configured — ship nothing (API ignores tokens for now).
  if (!siteKey || failed) return null;

  return (
    <div
      id={containerId}
      className={className}
      data-turnstile-placeholder=""
    />
  );
}
