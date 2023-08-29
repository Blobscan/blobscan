import type { NodeHTTPRequest } from "@trpc/server/adapters/node-http";
import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

import { getJWTFromRequest } from "./context";

vi.mock("./env", () => ({
  env: {
    SECRET_KEY: "supersecret",
  },
}));

describe("getJWTFromRequest", () => {
  it("should return null if no authorization header is present", () => {
    const req = { headers: {} } as NodeHTTPRequest;
    expect(getJWTFromRequest(req)).toBeNull();
  });

  it("should return null if the authorization header is not a Bearer token", () => {
    const req = {
      headers: { authorization: "Basic abc123" },
    } as NodeHTTPRequest;
    expect(getJWTFromRequest(req)).toBeNull();
  });

  it("should return null if the token is missing", () => {
    const req = { headers: { authorization: "Bearer " } } as NodeHTTPRequest;
    expect(getJWTFromRequest(req)).toBeNull();
  });

  it("should return the decoded token if it is valid", () => {
    const token = jwt.sign("foobar", "supersecret");

    const req = {
      headers: { authorization: `Bearer ${token}` },
    } as NodeHTTPRequest;

    const decoded = getJWTFromRequest(req);

    expect(decoded).toEqual("foobar");
  });

  it("should throw a TRPCError if the token is invalid", () => {
    const req = {
      headers: { authorization: "Bearer invalid" },
    } as NodeHTTPRequest;

    expect(getJWTFromRequest(req)).toBeNull;
  });
});
