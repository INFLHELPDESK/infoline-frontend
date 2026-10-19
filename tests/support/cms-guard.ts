import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Fail-closed CMS configuration checks for test runs (Playwright, CI).
 *
 * Tests must never reach the production CMS. A run is refused unless an
 * explicit loopback endpoint is configured and isolation is declared, and the
 * production build under test carries no production CMS host.
 */

export const PRODUCTION_CMS_HOST = "green-tarsier-764009.hostingersite.com";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);

export function assertIsolatedCmsEnv(env: Record<string, string | undefined> = process.env): void {
  const endpoint = env.NEXT_PUBLIC_WPGRAPHQL_ENDPOINT;
  const problems: string[] = [];

  if (env.CMS_ISOLATED !== "1") problems.push("CMS_ISOLATED must be 1");
  if (!endpoint) {
    problems.push("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT must point at a local CMS stub");
  } else {
    try {
      const { hostname, port } = new URL(endpoint);
      if (!LOOPBACK_HOSTS.has(hostname)) {
        problems.push("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT must be a loopback address");
      } else if (!port) {
        problems.push("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT must include an explicit port");
      }
    } catch {
      problems.push("NEXT_PUBLIC_WPGRAPHQL_ENDPOINT is not a valid URL");
    }
  }

  if (problems.length > 0) {
    throw new Error(
      `Refusing to run tests against an unisolated CMS config: ${problems.join("; ")}. ` +
        "Copy .env.example to .env.local (the build must see the same values).",
    );
  }
}

function jsFiles(dir: string): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return jsFiles(path);
    return name.endsWith(".js") ? [path] : [];
  });
}

/**
 * `NEXT_PUBLIC_*` is inlined at build time, and `lib/forms` still falls back
 * to the production endpoint when it is unset. A build made without the
 * isolation env would therefore ship the production host in executable code,
 * and no runtime env check could notice. Source maps are ignored (they carry
 * original source text, not executable code). Returns offending files.
 */
export function findProductionHostInBuild(buildDir = ".next"): string[] {
  return [join(buildDir, "static"), join(buildDir, "server")]
    .flatMap(jsFiles)
    .filter((file) => readFileSync(file, "utf8").includes(PRODUCTION_CMS_HOST));
}

export function assertBuildIsIsolated(buildDir = ".next"): void {
  const offenders = findProductionHostInBuild(buildDir);
  if (offenders.length > 0) {
    throw new Error(
      `Refusing to run tests: the build contains the production CMS host (${offenders.length} file(s), e.g. ${offenders[0]}). ` +
        "Rebuild with CMS_ISOLATED=1 and NEXT_PUBLIC_WPGRAPHQL_ENDPOINT set.",
    );
  }
}
