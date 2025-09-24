import React, { useContext } from "react";
import { createContext } from "react";

import { api } from "~/api-client";
import type { AppState } from "~/types";

interface AppStateContextType {
  appState?: AppState;
  isLoading: boolean;
}

const AppStateContext = createContext<AppStateContextType>({
  isLoading: true,
});

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { data: appState, isLoading } = api.state.getAppState.useQuery(
    undefined,
    {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    }
  );

  return (
    <AppStateContext.Provider value={{ appState, isLoading }}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  const context = useContext(AppStateContext);

  if (!context) {
    throw new Error("useAppState must be used within an EnvProvider");
  }

  return context;
};
