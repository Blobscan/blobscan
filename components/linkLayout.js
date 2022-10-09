import {
  Box,
  Heading,
  Input,
  InputGroup,
  Text,
  Link,
  Flex,
  Spacer,
} from "@chakra-ui/react";

import { BiSearchAlt } from "react-icons/fa";

const LinkLayout = ({ children }) => (
  <>
    <Flex mt="50px" pl="100px" pr="100px" pt="20px" pb="25px" bg="#f4f4f4">
      <Box>
        <Heading as="h1" textAlign="center" fontSize="7xl">
          bl<span>⍥</span>bscan
          {/* blöbscan */}
        </Heading>
        <Text fontSize="xs" textAlign="center" mt="5px">
          Blob transactions explorer for{" "}
          <Link href="https://www.eip4844.com/">EIP-4844</Link>
        </Text>
      </Box>
      <Spacer />
      <Box>
        <InputGroup size="md" mt="30px">
          <Input
            width="md"
            placeholder="Search by block/transaction/blob Hash or address "
            variant="filled"
            focusBorderColor="#502eb4"
            _placeholder={{ opacity: 0.6, color: "#502eb4" }}
            textAlign="center"
          />
        </InputGroup>
      </Box>
    </Flex>
    {children}
  </>
);

export default LinkLayout;
