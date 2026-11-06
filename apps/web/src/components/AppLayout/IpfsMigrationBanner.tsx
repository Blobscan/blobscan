import { Link } from "../Link";
import Banner from "./Banner";

// To disable this banner, remove <IpfsMigrationBanner /> from AppLayout.tsx.
export default function IpfsMigrationBanner() {
  return (
    <Banner dismissible>
      <p>
        🌐 Blobscan is migrating to IPFS. Mainnet blobs remain permanently
        pinned on IPFS. Sepolia and Hoodi blobs are now served via IPFS on a
        best-effort basis without pinning guarantees.
      </p>
      <Link
        href="https://paragraph.com/@blobscan/announcing-transition-to-decentralized-blob-storage"
        isExternal
      >
        Learn more →
      </Link>
    </Banner>
  );
}
