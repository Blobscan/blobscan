import { useEffect, useState } from "react";
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
import { utils } from "ethers";
import { GetServerSideProps, NextPage } from "next";
import Link from "next/link";

import prisma from "@/lib/prisma";
import { Blob, Transaction } from "@prisma/client";

type BlobProps = {
  blob: Blob;
  tx: Transaction;
};

export const getServerSideProps: GetServerSideProps<BlobProps> = async ({
  query,
}) => {
  const blobId = query.id as string;
  const blobs = await prisma.blob.findMany({
    where: { id: blobId },
    take: 1,
  });

  const txs = await prisma.transaction.findMany({
    where: { hash: blobs[0].tx },
    take: 1,
  });

  return {
    props: {
      blob: blobs[0],
      tx: txs[0],
    },
  };
};

const Blob: NextPage<BlobProps> = ({ tx, blob }) => {
  const [utf8, setUtf8] = useState("");

  useEffect(() => {
    try {
      const utf8 = utils.toUtf8String(blob.data).replace(/\0/g, "");

      setUtf8(utf8);
    } catch {}
  }, [blob.data]);

  return (
    <>
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
            <BreadcrumbLink href={`/tx/${blob.tx}`}>
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
            <Tag mb="3px">Hash:</Tag> {blob.hash}
          </Box>
          <Box mb="3px">
            <Tag mb="3px">Commitment:</Tag> {blob.commitment}
          </Box>
          <Box mb="3px">
            <Tag mb="3px">Submitted by:</Tag>{" "}
            <Link href={`/address/${tx.from}`}>{tx.from}</Link>
          </Box>
          <Heading as="h2" width="xs" fontSize="1.2rem" mt="50px">
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
          {utf8 && (
            <>
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
            </>
          )}
        </Accordion>
      </div>
    </>
  );
};

export default Blob;
