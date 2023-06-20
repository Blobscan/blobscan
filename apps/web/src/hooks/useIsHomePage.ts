import { useRouter } from "next/router";

export function useIsHomepage(): boolean {
  const { pathname } = useRouter();

  return pathname === "/";
}
