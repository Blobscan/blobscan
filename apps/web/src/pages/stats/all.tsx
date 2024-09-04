import BlobStats from "./blob";
import BlockStats from "./block";
import TransactionStats from "./tx";

const AllStats = function () {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <BlobStats />
      </div>
      <div className="flex flex-col gap-4">
        <BlockStats />
      </div>
      <div className="flex flex-col gap-4">
        <TransactionStats />
      </div>
    </div>
  );
};

export default AllStats;
