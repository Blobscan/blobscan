import type { NextPage } from "next";
import NextError from "next/error";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Heading,
  Spinner,
  Tag,
} from "@chakra-ui/react";
import { utils } from "ethers";

import { api } from "~/utils/api";

const Blob: NextPage = () => {
  const router = useRouter();
  const hash = router.query.hash as string;
  const blobQuery = api.blob.byId.useQuery({
    id: hash,
  });

  if (blobQuery.error) {
    return (
      <NextError
        title={blobQuery.error.message}
        statusCode={blobQuery.error.data?.httpStatus ?? 500}
      />
    );
  }

  if (blobQuery.status !== "success") {
    return <Spinner />;
  }

  const { data: blob } = blobQuery;
  const utf8 = utils.toUtf8String(blob.data).replace(/\0/g, "");

  return (
    <>
      <Box ml="20px">
        <Breadcrumb separator="-" fontWeight="medium" fontSize="md" mb="5px">
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink href={`/block/${blob.Transaction.block}`}>
              Block #{blob.Transaction.block}
            </BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem>
            <BreadcrumbLink href={`/tx/${blob.tx}`}>
              Tx {blob.Transaction.index}
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
            <Link href={`/address/${blob.Transaction.from}`}>
              {blob.Transaction.from}
            </Link>
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
                  <Image src={utf8} alt="blob" />
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
