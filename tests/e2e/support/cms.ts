import type { Page } from "@playwright/test";

/** Origin of the CMS (the local stub) the build was made for. */
export const cmsOrigin = () => new URL(process.env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT!).origin;

/**
 * Records every request the page makes (including ones the network guard then
 * aborts) for which `match` is true. Register it before navigation.
 */
export function trackRequests(page: Page, match: (url: string) => boolean): string[] {
  const seen: string[] = [];
  page.on("request", (request) => {
    if (match(request.url())) seen.push(request.url());
  });
  return seen;
}

/** Requests aimed at the CMS: its origin, or any /graphql endpoint. */
export const isCmsRequest = (url: string) =>
  url.startsWith(cmsOrigin()) || /\/graphql(\?|$)/.test(new URL(url).pathname + new URL(url).search);
