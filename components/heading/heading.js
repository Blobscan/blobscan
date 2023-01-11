import { Heading } from "@chakra-ui/react";

const Headings = (h = "h1", width = "xs", fontSize = "1.5rem", Title) => {
  return (
    //   h1, xs, 1.5rem, Block: #{block?.number
    <Heading as={h} color="#502eb4" width={width} mb="5px" fontSize={fontSize}>
      {Title}
    </Heading>
  );
};

export default Headings;
