import React, { createContext, useContext, useState, useEffect } from "react";
import type { z } from "@blobscan/zod";

import type { clientEnvVarsSchema } from "~/env";

export type ClientEnvVars = z.output<typeof clientEnvVarsSchema>;
interface EnvContextType {
  env?: ClientEnvVars;
}

const EnvContext = createContext<EnvContextType>({ env: undefined });

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [env, setEnv] = useState<ClientEnvVars>();

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const request = await fetch("/api/env");
        const env = (await request.json()) as ClientEnvVars;

        setEnv(env);
      } catch (error) {
        console.error(
          "Error fetching environment variables from server side:",
          error
        );
      }
    };

    fetchEnv();
  }, []);

  return (
    <EnvContext.Provider value={{ env: env }}>{children}</EnvContext.Provider>
  );
};

export const useEnv = () => {
  const context = useContext(EnvContext);
  if (!context) {
    throw new Error("useEnv must be used within an EnvProvider");
  }
  return context;
};
