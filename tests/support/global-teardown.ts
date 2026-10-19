import { readFileSync } from "node:fs";
import { TRIPWIRE_LOG } from "./tripwire-log";

/** Fails the run if anything called the CMS endpoint (see cms-tripwire.mjs). */
export default function globalTeardown() {
  let log = "";
  try {
    log = readFileSync(TRIPWIRE_LOG, "utf8");
  } catch {
    throw new Error(`CMS tripwire log missing (${TRIPWIRE_LOG}); isolation was not verified.`);
  }
  if (log.trim()) {
    throw new Error(`Unexpected CMS requests during the run:\n${log}`);
  }
}
