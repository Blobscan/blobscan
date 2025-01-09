export const fetchEnv = async () => {
  // TODO: adapt for any environmet
  const response = await fetch("http://localhost:3000/api/trpc/getEnv");

  if (!response.ok) {
    throw new Error("Failed to fetch envs for sentry server init config.");
  }

  return await response.json();
};
