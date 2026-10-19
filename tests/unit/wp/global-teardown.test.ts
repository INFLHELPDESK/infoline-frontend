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

  it("fails and lists a request that is not allow-listed", () => {
    writeFileSync(state.log, "POST /graphql op=Services\n");
    expect(() => globalTeardown()).toThrow(/POST \/graphql op=Services/);
  });

  it("passes when only the wired route's operation (and its media) was requested", () => {
    writeFileSync(state.log, "POST /graphql op=Posts\nGET /stub-media/post.gif\n");
    expect(() => globalTeardown()).not.toThrow();
  });

  it.each([
    ["an unknown operation", "POST /graphql op=unknown"],
    ["an allowed name with extra text", "POST /graphql op=Posts extra"],
    ["a request with no operation", "POST /graphql"],
    ["another endpoint", "GET /wp-json/wp/v2/posts"],
    ["a non-media GET", "GET /graphql op=Posts"],
  ])("fails for %s, even next to allowed traffic", (_name, line) => {
    writeFileSync(state.log, `POST /graphql op=Posts\n${line}\n`);
    expect(() => globalTeardown()).toThrow(line);
  });

  it("fails when the log is missing (isolation unverified)", () => {
    expect(() => globalTeardown()).toThrow(/log missing/);
  });
});
