import { type Transaction } from "~/types";
import { buildBlobRoute } from "~/utils";
import { Link } from "../Link";
import { CardBase } from "./Bases";

type BlobCardProps = {
  blob: Transaction["blobs"][0];
  txHash: string;
};

export const BlobCard: React.FC<BlobCardProps> = ({ blob, txHash }) => {
  return (
    <CardBase>
      <div className="space-y-2 text-sm">
        <div className="font-semibold">
          <Link href={buildBlobRoute(txHash, blob.index)}>
            Blob #{blob.index}
          </Link>
        </div>
        <div className="flex flex-col gap-1">
          <div className="font-semibold">Versioned Hash</div>
          <div className="truncate">{blob.versionedHash}</div>
        </div>
        <div>
          <div className="gap-1 font-semibold">Commitment</div>
          <div className="truncate">{blob.commitment}</div>
        </div>
      </div>
    </CardBase>
  );
};
