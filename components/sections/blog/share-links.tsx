"use client";

import { useRef, useState } from "react";
import { Check, Link as LinkIcon } from "lucide-react";
import { socialIcons } from "@/components/layout/footer/social-icons";

type Network = { network: string; label: string };

/** Share-intent URLs per network; the page URL is read on click, never at render. */
const intents: Record<string, (url: string, title: string) => string> = {
  facebook: (u) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  x: (u, t) =>
    `https://twitter.com/intent/tweet?url=${encodeURIComponent(u)}&text=${encodeURIComponent(t)}`,
  linkedin: (u) =>
    `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}`,
};

const buttonClass =
  "flex size-8 items-center justify-center rounded-full bg-white text-slate-500 transition-colors duration-300 hover:bg-brandblue-500 hover:text-white focus-visible:outline-2 focus-visible:outline-brandblue-500";

/**
 * Share row from the article design: copy-link plus Facebook / X / LinkedIn.
 * Labels come from the server (shareLabel + footer social labels); nothing is
 * sent anywhere until the reader clicks.
 */
export default function ShareLinks({
  title,
  shareLabel,
  networks,
}: {
  title: string;
  shareLabel: string;
  networks: Network[];
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable: leave the button idle */
    }
  };

  const order = ["facebook", "x", "linkedin"];
  const items = order
    .map((n) => networks.find((x) => x.network === n))
    .filter((x): x is Network => !!x && !!intents[x.network]);

  return (
    <ul className="flex items-center gap-3" aria-label={shareLabel}>
      <li>
        <button
          type="button"
          onClick={copy}
          aria-label={`${shareLabel} — link`}
          className={buttonClass}
        >
          {copied ? (
            <Check className="size-5 text-brandblue-500" />
          ) : (
            <LinkIcon className="size-5" />
          )}
        </button>
      </li>
      {items.map(({ network, label }) => {
        const Icon = socialIcons[network];
        if (!Icon) return null;
        return (
          <li key={network}>
            <button
              type="button"
              aria-label={`${shareLabel} — ${label}`}
              onClick={() =>
                window.open(
                  intents[network](window.location.href, title),
                  "_blank",
                  "noopener,noreferrer",
                )
              }
              className={buttonClass}
            >
              <Icon className="size-4" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
