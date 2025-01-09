// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

// DISCUSS: on the first load of the app, there is no value, should we put a fallback? or retry the operation til there is a value in
// the local storage? After a first load, always works
const getEnvFromLocalStorage = (key: string) => {
  if (typeof window !== "undefined") {
    try {
      const storedEnv = localStorage.getItem("env");
      if (storedEnv) {
        const parsedEnv = JSON.parse(storedEnv) as Record<string, string>;
        return parsedEnv[`${key}`];
      }
    } catch (error) {
      console.error("Failed to read env from localStorage:", error);
    }
  }
  return undefined;
};

const initSentry = () => {
  const retryInterval = 1000;
  const maxRetries = 10;
  let retries = 0;

  const interval = setInterval(() => {
    const dns = getEnvFromLocalStorage("PUBLIC_SENTRY_DSN_WEB");
    const environment = getEnvFromLocalStorage("PUBLIC_NETWORK_NAME");

    if (environment || dns) {
      Sentry.init({
        dsn: dns,
        environment,
        tracesSampleRate: 1,
        debug: false,
      });

      clearInterval(interval);
    }

    retries += 1;
    if (retries >= maxRetries) {
      clearInterval(interval);
      console.warn("Failed to initialize Sentry after maximum retries.");
    }
  }, retryInterval);
};

initSentry();
