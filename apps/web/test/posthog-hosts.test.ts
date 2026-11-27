import { describe, expect, it } from "vitest";

import {
  getPostHogAssetsOrigin,
  getPostHogUiHost,
  getUpstreamUrl,
} from "../src/posthog-hosts";

const US_HOST = "https://us.i.posthog.com";
const SELF_HOSTED = "https://posthog.example.com";

describe("getPostHogAssetsOrigin", () => {
  it.each([
    [US_HOST, "https://us-assets.i.posthog.com"],
    ["https://eu.i.posthog.com", "https://eu-assets.i.posthog.com"],
    [`${SELF_HOSTED}/`, SELF_HOSTED],
  ])("returns the assets host of %s", (host, expected) => {
    expect(getPostHogAssetsOrigin(host)).toBe(expected);
  });
});

describe("getPostHogUiHost", () => {
  it.each([
    [US_HOST, "https://us.posthog.com"],
    ["https://eu.i.posthog.com", "https://eu.posthog.com"],
    [SELF_HOSTED, SELF_HOSTED],
  ])("returns the app host of %s", (host, expected) => {
    expect(getPostHogUiHost(host)).toBe(expected);
  });
});

describe("getUpstreamUrl", () => {
  it.each([
    ["/api/relay/e/?ip=0&_=1", `${US_HOST}/e/?ip=0&_=1`],
    [
      "/api/relay/i/v0/e/?compression=gzip-js",
      `${US_HOST}/i/v0/e/?compression=gzip-js`,
    ],
    ["/api/relay/batch/", `${US_HOST}/batch/`],
    ["/api/relay/flags/?v=2", `${US_HOST}/flags/?v=2`],
    [
      "/api/relay/array/phc_test/config.js",
      "https://us-assets.i.posthog.com/array/phc_test/config.js",
    ],
    [
      "/api/relay/static/dead-clicks-autocapture.js",
      "https://us-assets.i.posthog.com/static/dead-clicks-autocapture.js",
    ],
  ])("forwards %s to %s", (requestUrl, expected) => {
    expect(getUpstreamUrl(requestUrl, US_HOST)?.toString()).toBe(expected);
  });

  it("forwards everything to a self-hosted instance", () => {
    expect(
      getUpstreamUrl("/api/relay/static/array.js", SELF_HOSTED)?.toString()
    ).toBe(`${SELF_HOSTED}/static/array.js`);
  });

  it.each([
    "/api/relay/api/projects/1/",
    "/api/relay/",
    "/api/relay",
    "/api/other/e/",
    "/api/relay//evil.example/e/",
    "/api/relay/e/../api/projects/",
    "/api/relay/e/%2e%2e/api/projects/",
  ])("rejects %s", (requestUrl) => {
    expect(getUpstreamUrl(requestUrl, US_HOST)).toBeUndefined();
  });
});
