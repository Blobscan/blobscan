import Link from "next/link";
import { connectToDatabase } from "../../util/mongodb";

const Blob = (props: any) => {
  const { blob } = props;
  const data = blob && blob[0];
  return (
    <div style={{ margin: 20 }}>
      <div style={{ paddingBottom: 10, width: "100%", wordWrap: "break-word" }}>
        <h3>Blob</h3>
        <p>Hash: {data.hash}</p>
        <p>Data: {data.data}</p>
        <p>Commitment: {data.commitment}</p>
        <p>Tx:</p>
        <Link href={`/tx/${data.tx}`}>
          <a style={{ textDecoration: "underline", cursor: "pointer" }}>
            {data.tx}
          </a>
        </Link>
      </div>
    </div>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const blocks = await db
      .collection("blobs")
      .find({ hash: hash })
      //   .sort({ metacritic: -1 })
      .limit(20)
      .toArray();

    return {
      props: { blob: JSON.parse(JSON.stringify(blocks)) },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Blob;
