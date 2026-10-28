import type {
  CreateEnv,
  DefaultCombinedSchema,
  EnvOptions,
  StandardSchemaDictionary,
  StandardSchemaV1,
} from "@t3-oss/env-core";
import { createEnv as createEnv_ } from "@t3-oss/env-core";

export function createEnv<
  TPrefix extends string | undefined = "",
  TServer extends StandardSchemaDictionary = NonNullable<unknown>,
  TClient extends StandardSchemaDictionary = NonNullable<unknown>,
  TShared extends StandardSchemaDictionary = NonNullable<unknown>,
  const TExtends extends Array<Record<string, unknown>> = [],
  TFinalSchema extends StandardSchemaV1<
    Record<string, unknown>,
    Record<string, unknown>
  > = DefaultCombinedSchema<TServer, TClient, TShared>
>({
  envOptions,
  display,
}: {
  envOptions: EnvOptions<
    TPrefix,
    TServer,
    TClient,
    TShared,
    TExtends,
    TFinalSchema
  >;
  display?(env: Readonly<CreateEnv<TFinalSchema, TExtends>>): void;
}) {
  const env_ = createEnv_(envOptions);
  return {
    ...env_,
    display: display ? () => display(env_) : () => void 0,
  };
}

export const presetEnvOptions = {
  runtimeEnv: process.env,
  // CI builds run without a full environment, but tests must validate and
  // coerce the values from .env.test just like local runs do.
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    (!!process.env.CI && process.env.NODE_ENV !== "test"),
};

export function maskSensitiveData(sensitiveData: string | undefined) {
  return sensitiveData?.replace(/./g, "*");
}

export function maskPassword(uri: string | undefined) {
  const regex = /:\/\/(.*):.*@/;

  return uri?.replace(regex, (_, username) => `://${username}:****@`);
}
