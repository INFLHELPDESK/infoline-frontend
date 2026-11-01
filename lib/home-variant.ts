/**
 * Internal design-review switch for the Home "What changes" section.
 *
 * `?homeVariant=new` renders the alternative toggle design; anything else
 * (missing, `current`, unknown, repeated) renders the existing design. The
 * switch is opt-in: it exists only where `ENABLE_HOME_VARIANT_PREVIEW=1` is
 * set, and never on the Vercel Production environment, so no public host can
 * show the alternative before it is approved.
 */
export type HomeVariant = "current" | "new";

export function isHomeVariantPreviewEnabled(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
  optIn: string | undefined = process.env.ENABLE_HOME_VARIANT_PREVIEW,
): boolean {
  return optIn === "1" && vercelEnv !== "production";
}

export function resolveHomeVariant(
  raw: string | string[] | undefined,
  enabled: boolean = isHomeVariantPreviewEnabled(),
): HomeVariant {
  return enabled && raw === "new" ? "new" : "current";
}
