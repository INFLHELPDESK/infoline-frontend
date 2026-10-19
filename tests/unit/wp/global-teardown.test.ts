import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ log: "" }));
vi.mock("../../support/tripwire-log", () => ({
  get TRIPWIRE_LOG() {
    return state.log;
  },
}));

import globalTeardown from "../../support/global-teardown";

describe("global teardown (CMS tripwire verdict)", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "tripwire-"));
    state.log = join(dir, "cms-tripwire.log");
  });
  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  it("passes when nothing called the CMS", () => {
    writeFileSync(state.log, "");
    expect(() => globalTeardown()).not.toThrow();
  });

  it("fails and lists the requests when the CMS was called", () => {
    writeFileSync(state.log, "POST /graphql\n");
    expect(() => globalTeardown()).toThrow(/POST \/graphql/);
  });

  it("fails when the log is missing (isolation unverified)", () => {
    expect(() => globalTeardown()).toThrow(/log missing/);
  });
});
