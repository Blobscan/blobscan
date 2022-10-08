import Link from "next/link";
import { connectToDatabase } from "../../util/mongodb";

const Block = (props: any) => {
  const { blocks } = props;
  return (
    <div style={{ margin: 20 }}>
      <h3>Transactions</h3>
      {blocks?.map((b: any) => {
        // TODO: Change the tx hash to one from the database
        return (
          <div style={{ borderBottom: "2px solid black" }}>
            <p>
              Hash:
              <Link
                href={`/tx/0xebe560c32d59d9368e7fef0d6012728b91f90d3822014792d991843fa6ae403c`}
              >
                <a style={{ textDecoration: "underline", cursor: "pointer" }}>
                  {b.hash}
                </a>
              </Link>
            </p>
          </div>
        );
      })}
    </div>
  );
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const blocks = await db
      .collection("blocks")
      .find({ number: parseInt(hash) })
      //   .sort({ metacritic: -1 })
      .limit(20)
      .toArray();

    return {
      props: { blocks: JSON.parse(JSON.stringify(blocks)) },
    };
  } catch (e) {
    console.error(e);
  }
};

export default Block;
