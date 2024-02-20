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
