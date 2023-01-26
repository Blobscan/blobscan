export type Block = {
  hash: string;
  miner: string;
  number: number;
  timestamp: number;
  transactions: string[];
  slot?: number;
};

export type Transaction = {
  hash: string;
  from: string;
  to: string;
};
