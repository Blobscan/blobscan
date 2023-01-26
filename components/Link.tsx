import { Link as ChakraLink } from "@chakra-ui/react";
import React from "react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";

interface LinkProps extends NextLinkProps {
  children: string;
}

export const Link: React.FC<LinkProps> = ({ children, href }: LinkProps) => {
  return (
    <NextLink href={href} passHref>
      <ChakraLink>{children}</ChakraLink>
    </NextLink>
  );
};
