import { useRouter } from "next/compat/router";

export function useIsHomepage(): boolean {
  const router = useRouter();

  return router?.pathname === "/";
}
