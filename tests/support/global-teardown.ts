import { readFileSync } from "node:fs";
import { isAllowedCmsLogLine } from "./cms-allowlist";
import { TRIPWIRE_LOG } from "./tripwire-log";

/**
 * Fails the run if anything called the CMS endpoint other than the operations
 * the wired routes are allowed to make (see cms-allowlist.ts, cms-stub/main.mjs).
 */
export default function globalTeardown() {
  let log = "";
  try {
    log = readFileSync(TRIPWIRE_LOG, "utf8");
  } catch {
    throw new Error(`CMS tripwire log missing (${TRIPWIRE_LOG}); isolation was not verified.`);
  }
  const unexpected = log.split("\n").filter((line) => line.trim() && !isAllowedCmsLogLine(line.trim()));
  if (unexpected.length > 0) {
    throw new Error(`Unexpected CMS requests during the run:\n${unexpected.join("\n")}`);
  }
}
