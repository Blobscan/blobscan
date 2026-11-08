// The help texts of the address metric cards. An icon after the card name
// shows the text. The keys are the card names without the role, for
// example "Total Blob Txs" for "Total Blob Txs (As Sender)".
const METRIC_DESCRIPTIONS: Record<string, string> = {
  // Transactions
  "Total Blob Txs":
    "Number of blob transactions in the selected time frame, in this role. A transaction the address sends to itself counts in both roles.",
  "Avg. Daily Txs":
    "Mean number of blob transactions per day in the selected time frame, including days without transactions.",
  "Max Daily Txs":
    "Largest number of blob transactions in one UTC day of the selected time frame.",
  // Blobs
  "Total Blobs":
    "Number of blobs in the transactions of the selected time frame, in this role. Each blob uses 131,072 units of blob gas.",
  "Avg. Blobs per Tx": "Mean number of blobs in each blob transaction.",
  "Avg. Daily Blobs":
    "Mean number of blobs per day in the selected time frame, including days without transactions.",
  "Max Daily Blobs":
    "Largest number of blobs in one UTC day of the selected time frame.",
  // Blob usage
  "Avg. Data per Tx":
    "Mean size of the data in the blobs of each transaction. Unused blob space is not included.",
  "Avg. Daily Data":
    "Mean size of the blob data per day in the selected time frame, including days without transactions.",
  "Max Daily Data":
    "Largest size of blob data in one UTC day of the selected time frame.",
  // Fees
  "Total Blob Fees":
    "Sum of the blob base fees of the transactions. The blob base fee is the blob gas used multiplied by the blob gas price of the block.",
  "Avg. Blob Fee per Tx": "Mean blob base fee of each blob transaction.",
  "Cost per KiB of Blob Data":
    "Blob fees divided by the size of the blob data. Unused blob space makes this cost higher.",
  "Calldata Savings":
    "Fees that the address did not pay because it used blobs. It is the cost of the same data as calldata, minus the blob fees.",
  "Wasted Blob Fees":
    "Part of the blob fees that paid for unused blob space. Each blob costs the same, whether it is full or not.",
  // Network
  "Share of Network Blobs":
    "Percentage of all the blobs of the network that are in transactions of this address, for all the time. The time frame does not change this value.",
  "Avg. Blob Gas Price Paid":
    "Mean blob gas price of the transactions that the address sent, weighted by blob gas. The card compares it with the mean price of the network. Both are for all the time, and the time frame does not change them.",
  // Activity
  Age: "Number of days since the first blob transaction of the address.",
  "Time Active":
    "Number of UTC days with at least one blob transaction, sent or received.",
  "Longest Streak":
    "Largest number of consecutive UTC days with at least one blob transaction.",
  "Longest Gap":
    "Largest number of days without blob transactions between two active days.",
};

/** Returns the help text of a card. The role in the name is ignored. */
export function getMetricDescription(name?: string) {
  return name
    ? METRIC_DESCRIPTIONS[name.replace(/ \(As .+\)$/, "")]
    : undefined;
}
