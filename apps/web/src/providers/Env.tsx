import React, { createContext, useContext, useState, useEffect } from "react";

interface EnvContextType {
  env?: Record<string, string | boolean | undefined>;
}

const EnvContext = createContext<EnvContextType>({ env: undefined });

export const EnvProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [env, setEnv] =
    useState<Record<string, string | boolean | undefined>>();

  useEffect(() => {
    const fetchEnv = async () => {
      try {
        const request = await fetch("/api/env", { method: "POST" });
        const data = await request.json();
        setEnv(data.data);
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
