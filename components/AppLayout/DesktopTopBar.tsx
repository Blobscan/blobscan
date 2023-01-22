import {
  Flex,
  Icon,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Button,
  useColorModeValue,
  useColorMode,
} from "@chakra-ui/react";
import Image from "next/image";

import { MdSettings } from "react-icons/md";

import Switcher from "../Switcher";
import InputSearch from "../InputSearch";

import Logo from "../../assests/logo-mini-light.svg";
import LogoDark from "../../assests/logo-mini-dark.svg";

type DesktopNavProps = {
  displayLogo: boolean;
};

export const DesktopNav: React.FC<DesktopNavProps> = ({ displayLogo }) => {
  const { colorMode } = useColorMode();

  const bgColor = useColorModeValue("body", "neutral.dark.500");
  const borderColor = useColorModeValue("neutral.200", "neutral.dark.400");

  return (
    <>
      <Flex
        alignItems={"center"}
        justify={displayLogo ? "space-between" : "end"}
        w="100%"
      >
        {displayLogo && (
          <>
            {colorMode === "light" ? (
              <Image src={Logo} alt="blobscan-logo-light" />
            ) : (
              <Image src={LogoDark} alt="blobscan-logo-dark" />
            )}
            <InputSearch />
          </>
        )}

        <Flex>
          <Popover>
            <PopoverTrigger>
              <Button
                variant={"switch"}
                justifyContent="center"
                ml="11px"
                mr="-13px"
                borderRadius="100%"
                w="40px"
                h="40px"
                bgColor={"body"}
                _dark={{
                  bgColor: "neutral.darl.500",
                  _hover: { bgColor: "primary.dark.500" },
                }}
              >
                {" "}
                <Icon
                  as={MdSettings}
                  _dark={{
                    fill: "neutral.dark.300",
                    bgColor: "body",
                    _hover: { fill: "primary.dark.200" },
                  }}
                  _hover={{ fill: "primary.300" }}
                  fill={"neutral.700"}
                  w="17px"
                  h="17px"
                />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              w="content"
              p="8px"
              borderRadius={"8px"}
              border="1px solid"
              borderColor={borderColor}
              bgColor={bgColor}
            >
              <PopoverBody>
                {/* TODO: APIs styles button */}
                <Button
                  mb="12px"
                  bgColor={"transparent"}
                  color="body"
                  _dark={{ bgColor: "body" }}
                >
                  APIs
                </Button>
                <Switcher />
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>
      </Flex>
    </>
  );
};
