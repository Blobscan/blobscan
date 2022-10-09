import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  Box,
  AccordionPanel,
  AccordionIcon,
  Heading,
} from "@chakra-ui/react";
import LinkLayout from "../../components/linkLayout";
import { connectToDatabase } from "../../util/mongodb";

const Blob = (props: any) => {
  const { tx, blob } = props;
  return (
    <LinkLayout>
      <Box ml="20px">
        <Breadcrumb separator="-">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink href={`/block/${tx?.block}`}>
              Block #{tx?.block}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink href={`/tx/${tx?.hash}`}>
              Tx {tx?.index}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Blob {blob.index}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>
      <div style={{ paddingBottom: 10, width: "100%", wordWrap: "break-word" }}>
        <Heading
          as="h1"
          color="#502eb4"
          width="xl"
          mb="15px"
          ml="20px"
          fontSize="1.5rem"
          mt="3px"
        >
          Blob
        </Heading>
        <Box ml="20px">
          <Box mb="3px">Hash: {blob.hash}</Box>
          <Box mb="3px">Commitment: {blob.commitment}</Box>
          <Box mb="3px" mt="50px">
            Data:
          </Box>
        </Box>
        <Accordion allowToggle mt="15px">
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Show data
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <code>{blob.data}</code>
            </AccordionPanel>
          </AccordionItem>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Show data as base64 image
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <img src={blob.data} />
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </LinkLayout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;

    const blob = await db
      .collection("blobs")
      .find({ $or: [{ hash }, { commitment: hash }] })
      .limit(1)
      .toArray();

    const txs = await db
      .collection("txs")
      .find({ hash: blob[0].tx })
      .limit(1)
      .toArray();

    return {
      props: {
        blob: JSON.parse(JSON.stringify(blob[0])),
        tx: JSON.parse(JSON.stringify(txs[0])),
      },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Blob;
