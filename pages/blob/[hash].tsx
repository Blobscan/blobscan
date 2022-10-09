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
  Tag,
} from "@chakra-ui/react";
import Link from "next/link";
import LinkLayout from "../../components/linkLayout";
import { connectToDatabase } from "../../util/mongodb";
import { utils } from 'ethers'

const Blob = (props: any) => {
  const { tx, blob } = props;
  const utf8 = utils.toUtf8String(blob.data).replace(/\0/g, '')
  return (
    <LinkLayout>
      <Box ml="20px">
        <Breadcrumb separator="-" fontWeight="medium" fontSize="md" mb="5px">
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
          width="100%"
          mb="15px"
          ml="20px"
          fontSize="1.5rem"
          mt="3px"
        >
          Blob {blob.hash}
        </Heading>
        <Box ml="20px">
          <Box mb="3px">
            <Tag color="#502eb4" mb="3px">
              Hash:
            </Tag>{" "}
            {blob.hash}
          </Box>
          <Box mb="3px">
            <Tag color="#502eb4" mb="3px">
              Commitment:
            </Tag>{" "}
            {blob.commitment}
          </Box>
          <Box mb="3px">
            <Tag color="#502eb4" mb="3px">
              Submitted by:
            </Tag>{" "}
            <Link href={`/address/${tx.from}`}>{tx.from}</Link>
          </Box>
          <Box mb="3px">
            <Tag color="#502eb4" mb="3px">
              Data gas:
            </Tag>
          </Box>
          <Heading
          as="h2"
          color="#502eb4"
          width="xs"
          fontSize="1.2rem"
          mt="50px"
        >
          Data
        </Heading>
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
                  Show data as utf8 string
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>
              <code>{utf8}</code>
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
              <img src={utf8} />
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
