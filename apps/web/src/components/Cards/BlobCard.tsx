import { type Transaction } from "~/types";
import { buildRoute } from "~/utils";
import { Link } from "../Link";
import { CardBase } from "./Bases";

type BlobCardProps = {
  blob: Transaction["blobs"][0];
  index: number;
};

export const BlobCard: React.FC<BlobCardProps> = ({ blob, index }) => {
  return (
    <CardBase>
      <div className="space-y-2 text-sm">
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="text-base font-semibold">Blob #{index}</div>
          <Link href={buildRoute("blob", blob.hash)}>{blob.hash}</Link>
        </div>
        <div>
          <div className="font-semibold">Commitment</div>
          <div className="truncate">{blob.commitment}</div>
        </div>
      </div>
    </CardBase>
  );
};
