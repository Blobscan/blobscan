export * from "@t3-oss/env-core";

export const presetEnvOptions = {
  runtimeEnv: process.env,
  skipValidation: !!process.env.CI || !!process.env.SKIP_ENV_VALIDATION,
};
