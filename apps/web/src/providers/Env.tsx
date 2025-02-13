import React, { createContext, useContext, useState, useEffect } from "react";
import type { z } from "zod";

import { clientEnvVarsSchema } from "~/env.mjs";

type ClientEnvVars = z.infer<typeof clientEnvVarsSchema>;

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
        const data = await request.json();

        const envVars = clientEnvVarsSchema.safeParse(data);

        if (!envVars.success) {
          throw new Error(`Failed to parse env vars`, { cause: envVars.error });
        }

        setEnv(envVars.data);
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
