import { parse } from "dotenv";
import fs from "fs";
import path from "path";
import type { CreateServerReturnType, Instance } from "prool";
import { createServer } from "prool";
import { anvil } from "prool/instances";

const envFile = fs.readFileSync(
  path.resolve(__dirname, "../../../../.env"),
  "utf-8"
);

const VITEST_MAINNET_FORK_URL = parse(envFile).VITEST_MAINNET_FORK_URL;

let server: CreateServerReturnType;
let instance: Instance;

export function getAnvil() {
  if (!instance && !server) {
    instance = anvil({
      forkChainId: 1,
      forkUrl: VITEST_MAINNET_FORK_URL,
      forkBlockNumber: 22138144,
      port: 8545,
      noMining: true,
    });

    server = createServer({
      instance,
    });
  }

  return { anvil: instance, server };
}
