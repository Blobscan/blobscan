import {
  ChakraProvider,
  cookieStorageManagerSSR,
  localStorageManager,
} from "@chakra-ui/react";
import { GetServerSideProps } from "next";

import { theme } from "@/theme";

type ChakraProps = {
  children: React.ReactElement;
  cookies: string;
};
export const Chakra: React.FC<ChakraProps> = ({ children, cookies }) => {
  /**
   * Required for Next.js
   * See https://chakra-ui.com/docs/styled-system/color-mode#add-colormodemanager-optional-for-ssr
   */
  const colorModeManager =
    typeof cookies === "string"
      ? cookieStorageManagerSSR(cookies)
      : localStorageManager;

  return (
    <ChakraProvider theme={theme} colorModeManager={colorModeManager}>
      {children}
    </ChakraProvider>
  );
};

export const getServerSideProps: GetServerSideProps<{
  cookies: string;
}> = async ({ req }) => {
  return {
    props: {
      // first time users will not have any cookies and you may not return
      // undefined here, hence ?? is necessary
      cookies: req.headers.cookie ?? "",
    },
  };
};
