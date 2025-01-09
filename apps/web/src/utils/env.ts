import { getBaseUrl } from "~/api-client";

export const fetchEnv = async () => {
  const response = await fetch(`${getBaseUrl()}/api/trpc/getEnv`);

  if (!response.ok) {
    throw new Error("Failed to fetch envs for sentry server init config.");
  }

  return await response.json();
};
