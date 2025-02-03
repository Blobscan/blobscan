import React, { createContext, useContext, useState, useEffect } from "react";
import type { z } from "zod";

import type { clientEnvVarsSchema } from "~/env.mjs";

type ClientEnvVars = z.infer<typeof clientEnvVarsSchema>;

type ClientEnv = {
  [Key in keyof ClientEnvVars as Key extends `NEXT_${infer Rest}`
    ? Rest
    : never]: ClientEnvVars[Key];
};

interface EnvContextType {
  env?: ClientEnv;
}

const EnvContext = createContext<EnvContextType>({ env: undefined });

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [env, setEnv] = useState<ClientEnv>();

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const request = await fetch("/api/env");
        const data = await request.json();
        setEnv(data);
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
