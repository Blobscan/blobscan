import { Breadcrumb, BreadcrumbLink, BreadcrumbItem } from "@chakra-ui/react";
import Link from "next/link";
import Layout from "../../components/layout";
import { connectToDatabase } from "../../util/mongodb";

const Blob = (props: any) => {
  const { tx, blob } = props;
  return (
    <Layout>
            <Breadcrumb>
        <BreadcrumbItem>
          <BreadcrumbLink href='/'>Home</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <BreadcrumbLink href={`/block/${tx?.block}`}>Block #{tx?.block}</BreadcrumbLink>
        </BreadcrumbItem>

        <BreadcrumbItem>
          <BreadcrumbLink href={`/tx/${tx?.hash}`}>Tx {tx?.index}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbItem isCurrentPage>
          <BreadcrumbLink href='#'>Blob {blob.index}</BreadcrumbLink>
        </BreadcrumbItem>
      </Breadcrumb>
      <div style={{ paddingBottom: 10, width: "100%", wordWrap: "break-word" }}>
        <h3>Blob</h3>
        <p>Hash: {blob.hash}</p>
        <p>Commitment: {blob.commitment}</p>
        <p>Data: {blob.data}</p>
      </div>
    </Layout>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;


    let mongoQuery
    if (hash.length === 64) {
      mongoQuery = { hash }
    } else if (hash.length > 64) {
      mongoQuery = { commitment: hash }
    }

    const blob = await db
      .collection("blobs")
      .find(mongoQuery)
      .limit(1)
      .toArray();

    const txs = await db
      .collection("txs")
      .find({ hash: blob[0].tx })
      .limit(1)
      .toArray();

    return {
      props: { blob: JSON.parse(JSON.stringify(blob[0])),
        tx: JSON.parse(JSON.stringify(txs[0])) },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Blob;
