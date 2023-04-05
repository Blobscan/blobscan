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
  Spinner,
} from "@chakra-ui/react";
import { utils } from "ethers";
import { NextPage } from "next";
import Link from "next/link";
import { useRouter } from "next/router";

import { api } from "~/utils/api";

const Blob: NextPage = () => {
  const router = useRouter();
  const blobId = router.query.id as string;

  const { data: blobs } = api.blob.getAll.useQuery({
    blobId,
    transaction: true,
  });
  const [utf8, setUtf8] = useState("");

  useEffect(() => {
    if (!blobs) {
      return;
    }

    const utf8 = utils.toUtf8String(blobs[0].data).replace(/\0/g, "");

    setUtf8(utf8);
  }, [blobs]);

  if (!blobs) {
    return <Spinner />;
  }

  const blob = blobs[0];

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
