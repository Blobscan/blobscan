import { useRouter } from "next/router";

const Blob = () => {
  const router = useRouter();
  const { hash } = router.query;

  return <p>Block hash: {hash}</p>;
};

export default Blob;
