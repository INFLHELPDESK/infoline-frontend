/**
 * Forms API client — Phase 3 handover (docs/backend/phase3-forms-api.md).
 *
 * Rules baked in from the handover:
 * - Submissions are sent FROM THE BROWSER (rate limiting is per visitor IP;
 *   server-side proxying would lock everyone out after 5 submissions).
 * - GraphQL returns HTTP 200 even on rejection — always read `success`.
 * - `validationErrors[].field` matches the input name exactly.
 * - Server error messages are English-only: never render them on /ar —
 *   map errors by field and show translated copy instead.
 * - Honeypot field `website` ships with every submission (empty for humans).
 * - Turnstile token is sent as `turnstileToken` (inert until the key is set).
 * - Choice fields take fixed keys, not UI labels (see CHOICE maps below).
 */

import { requireCmsEndpoint } from "@/lib/cms-endpoint";

// No default endpoint: requireCmsEndpoint() throws when
// NEXT_PUBLIC_WPGRAPHQL_ENDPOINT is unset, so a missing config can never post to
// the production CMS. It is resolved per call, not at import time.

type InquiryAction = "service_inquiry" | "project_inquiry" | "media_inquiry";

/** Fixed keys per handover §3 — send the key, never the UI label. */
export type ProjectType =
  | "new_build"
  | "platform_migration"
  | "custom_integration"
  | "other";

export type StartTimeline = "ready_now" | "1_3_months" | "3_6_months" | "scoping";

type ValidationError = { field: string; message: string };

export type SubmitInquiryResult = {
  success: boolean;
  message: string;
  entryId: number;
  emailSent: boolean;
  validationErrors: ValidationError[];
};

type GraphQLResponse<T> = {
  data?: { submitInquiry?: T };
  errors?: { message: string }[];
};

const SUBMIT_INQUIRY_MUTATION = /* GraphQL */ `
  mutation SubmitInquiry($input: SubmitInquiryInput!) {
    submitInquiry(input: $input) {
      success
      message
      entryId
      emailSent
      validationErrors {
        field
        message
      }
    }
  }
`;

/**
 * Submit one of the three GraphQL inquiry forms.
 * Always resolves with the parsed payload; network failures throw.
 */
export async function submitInquiry(
  input: {
    action: InquiryAction;
    name: string;
    organisation: string;
    workEmail: string;
    country?: string;
    service?: string;
    projectType?: ProjectType;
    startTimeline?: StartTimeline;
    message?: string;
    website?: string;
    turnstileToken?: string;
  },
  { signal }: { signal?: AbortSignal } = {},
): Promise<SubmitInquiryResult> {
  const res = await fetch(requireCmsEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: SUBMIT_INQUIRY_MUTATION, variables: { input } }),
    signal,
  });

  if (!res.ok) {
    throw new Error(`Inquiry request failed: HTTP ${res.status}`);
  }

  const json = (await res.json()) as GraphQLResponse<SubmitInquiryResult>;

  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join(" · "));
  }

  const payload = json.data?.submitInquiry;
  if (!payload) {
    throw new Error("Inquiry API returned no payload");
  }

  return {
    ...payload,
    validationErrors: payload.validationErrors ?? [],
  };
}

/**
 * Classify a result into a UI state:
 * - "success"          stored (entryId > 0 or success with no field errors)
 * - "field_errors"     per-field validation issues to display
 * - "general_error"    rate limit / server error — show the message
 * (entryId === 0 with success === true means the honeypot caught a bot;
 *  humans should never see it — treat as success so bots stay convinced.)
 */
export function classifyInquiryResult(result: SubmitInquiryResult) {
  if (result.success && result.validationErrors.length === 0) {
    return "success" as const;
  }
  if (!result.success && result.validationErrors.length > 0) {
    return "field_errors" as const;
  }
  return "general_error" as const;
}

/** REST path of the job application endpoint, on the CMS origin. */
const APPLY_PATH = "/wp-json/infoline/v1/apply";

/**
 * Submit a job application (multipart, with the CV file) to REST /apply.
 * The caller builds the FormData (name, email, phone, position, message, cv,
 * website, turnstileToken). Content-Type is left unset so the browser adds the
 * multipart boundary. The endpoint answers 200 on success and 422 on
 * rejection with the same payload shape as GraphQL, so both are parsed;
 * anything else (network failure, other status, non-JSON) throws.
 */
export async function submitApplication(
  body: FormData,
  { signal }: { signal?: AbortSignal } = {},
): Promise<SubmitInquiryResult> {
  const url = new URL(APPLY_PATH, new URL(requireCmsEndpoint()).origin);
  const res = await fetch(url, { method: "POST", body, signal });

  if (!res.ok && res.status !== 422) {
    throw new Error(`Application request failed: HTTP ${res.status}`);
  }

  const payload = (await res.json()) as Partial<SubmitInquiryResult> | null;
  if (!payload || typeof payload.success !== "boolean") {
    throw new Error("Application API returned no payload");
  }

  return {
    success: payload.success,
    message: payload.message ?? "",
    entryId: payload.entryId ?? 0,
    emailSent: payload.emailSent ?? false,
    validationErrors: payload.validationErrors ?? [],
  };
}
