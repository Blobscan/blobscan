import type { EnvOptions, Simplify } from "@t3-oss/env-core";
import { createEnv as createEnv_ } from "@t3-oss/env-core";
import type { z, ZodObject, ZodType } from "zod";

export function createEnv<
  TPrefix extends string = "",
  TServer extends Record<string, ZodType> = NonNullable<unknown>,
  TClient extends Record<string, ZodType> = NonNullable<unknown>,
  TShared extends Record<string, ZodType> = NonNullable<unknown>
>({
  envOptions,
  display,
}: {
  envOptions: EnvOptions<TPrefix, TServer, TClient, TShared>;
  display?(
    env: Readonly<
      Simplify<
        z.infer<ZodObject<TServer>> &
          z.infer<ZodObject<TClient>> &
          z.infer<ZodObject<TShared>>
      >
    >
  ): void;
}) {
  const env_ = createEnv_(envOptions);
  return {
    ...env_,
    display: display ? () => display(env_) : () => void 0,
  };
}

export const presetEnvOptions = {
  runtimeEnv: process.env,
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
};

export function maskSensitiveData(sensitiveData: string | undefined) {
  return sensitiveData?.replace(/./g, "*");
}

export function maskPassword(uri: string | undefined) {
  const regex = /:\/\/(.*):.*@/;

  return uri?.replace(regex, (_, username) => `://${username}:****@`);
}

export function maskJSONRPCUrl(url?: string): string | undefined {
  if (!url) {
    return;
  }

  try {
    const parsed = new URL(url);
    const hostParts = parsed.hostname.split(".");
    const domain = hostParts.slice(-3).join(".");
    const network = hostParts.slice(1, 2)[0];
    return `https://****.${network}.${domain
      .split(".")
      .slice(1)
      .join(".")}/****`;
  } catch {
    return "****";
  }
}

export function maskConnectionUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Mask username and password if present
    if (parsed.username || parsed.password) {
      parsed.username = "***";
      parsed.password = "***";
    }

    return parsed.toString();
  } catch {
    // Fallback if URL is malformed or not standard
    return url.replace(/\/\/([^:@]+):([^@]+)@/, "//***:***@");
  }
}
