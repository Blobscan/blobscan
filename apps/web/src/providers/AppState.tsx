import React, { useContext } from "react";
import { createContext } from "react";

import { MS_PER_MINUTE } from "~/utils/date";
import { api } from "~/api-client";
import type { AppState } from "~/types";

interface AppStateContextType {
  appState?: AppState;
  isLoading: boolean;
  isError: boolean;
  /**
   * The time of the last successful fetch of the app state, in ms. It is 0
   * when there is no data.
   */
  dataUpdatedAt: number;
}

const AppStateContext = createContext<AppStateContextType>({
  isLoading: true,
  isError: false,
  dataUpdatedAt: 0,
});

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const {
    data: appState,
    isLoading,
    isError,
    dataUpdatedAt,
  } = api.state.getAppState.useQuery(undefined, {
    staleTime: MS_PER_MINUTE,
    // Keep the sync state fresh on tabs that stay open.
    refetchInterval: 5 * MS_PER_MINUTE,
    refetchOnWindowFocus: true,
  });

  return (
    <AppStateContext.Provider
      value={{ appState, isLoading, isError, dataUpdatedAt }}
    >
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
