/**
 * Internal design-review switch for the Home "What changes" section.
 *
 * `?homeVariant=new` renders the alternative toggle design; anything else
 * (missing, `current`, unknown, repeated) renders the existing design. The
 * switch is off on the Vercel Production environment, so the public site can
 * never show the alternative before it is approved.
 */
export type HomeVariant = "current" | "new";

export function isHomeVariantPreviewEnabled(
  vercelEnv: string | undefined = process.env.VERCEL_ENV,
): boolean {
  return vercelEnv !== "production";
}

export function resolveHomeVariant(
  raw: string | string[] | undefined,
  enabled: boolean = isHomeVariantPreviewEnabled(),
): HomeVariant {
  return enabled && raw === "new" ? "new" : "current";
}
