import {
  Breadcrumb,
  BreadcrumbLink,
  BreadcrumbItem,
  Box,
  Heading,
  Tag,
  Collapse,
  Button,
  HStack,
} from "@chakra-ui/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import LinkLayout from "../../components/linkLayout";
import { connectToDatabase } from "../../util/mongodb";

const COLLAPSE_THRESHOLD = 100;

const Blob = (props: any) => {
  const [showCollapse, setShowCollapse] = useState<boolean>(false);
  const [showExpandBtn, setShowExpandBtn] = useState(false);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const { tx, blob } = props;

  useEffect(() => {
    if (!blob.data?.length) {
      setShowExpandBtn(false);
    } else if (contentRef.current) {
      setShowExpandBtn(contentRef.current.clientHeight > COLLAPSE_THRESHOLD);
    }
  }, [blob.data]);

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
            <BreadcrumbLink href={`/tx/${blob.tx}`}>
              Tx {tx?.index}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href="#">Blob {blob.index}</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Box>
      <div
        style={{ paddingBottom: 10, width: "95%", wordWrap: "break-word" }}
      >
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
          <Heading as="h2" color="#502eb4" fontSize="1.2rem" mt="50px">
            <HStack justifyContent="space-between" mb="4">
              <Box>Data</Box>
              {showExpandBtn && (
                <Button
                  width="30"
                  size="sm"
                  onClick={() => setShowCollapse((show) => !show)}
                  mt="1rem"
                >
                  Show {showCollapse ? "Less" : "More"}
                </Button>
              )}
            </HStack>
          </Heading>
        </Box>
        <Box>
          <Collapse startingHeight={COLLAPSE_THRESHOLD} in={showCollapse}>
            <div ref={contentRef}>{blob.data}</div>
          </Collapse>
        </Box>
      </div>
    </LinkLayout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { id } = query;

    const blob = await db
      .collection("blobs")
      .find({ $or: [{ _id: id }] })
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
