import Link from "next/link";
import { connectToDatabase } from "../../util/mongodb";

const Tx = (props: any) => {
  const { tx } = props;
  const data = tx && tx[0];
  const blob =
    "0x1fe496dbcd00922f574b8b288b9daae1fb5276d350e02251eaeec5122287b126";
  return (
    <div style={{ margin: 20 }}>
      <h3>Transaction Info</h3>
      <div style={{ borderBottom: "2px solid black" }}>
        <p>Hash: {data.hash}</p>
        <Link href={`/blob/${blob}`}>
          <p>
            Blob:{" "}
            <a style={{ textDecoration: "underline", cursor: "pointer" }}>
              {blob}
            </a>
          </p>
        </Link>
        <p>From: {data.from}</p>
        <p>To: {data.to}</p>
        <p>Block: {data.block}</p>
      </div>
    </div>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const tx = await db
      .collection("txs")
      .find({ hash })
      //   .sort({ metacritic: -1 })
      .limit(20)
      .toArray();

    return {
      props: { tx: JSON.parse(JSON.stringify(tx)) },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Tx;
