import { useRouter } from "next/router";
import { connectToDatabase } from "../../util/mongodb";

const Blob = (props: any) => {
  const router = useRouter();
  const { hash } = router.query;
  console.log({ props });
  return <p>Block hash: {hash}</p>;
};

export const getServerSideProps = async ({ query }: any) => {
  try {
    const { db } = await connectToDatabase();
    const { hash } = query;
    const blocks = await db
      .collection("blocks")
      .find({ number: hash })
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

export default Blob;
