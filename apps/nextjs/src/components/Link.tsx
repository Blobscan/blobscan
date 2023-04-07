import React from "react";
import NextLink, { type LinkProps as NextLinkProps } from "next/link";
import { Link as ChakraLink } from "@chakra-ui/react";

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
