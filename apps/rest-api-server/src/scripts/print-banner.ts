import { env as apiEnv } from "@blobscan/api";

import { env as restEnv } from "../env";

function run() {
  console.log(" ____  _  _  _    ");
  console.log("|  _ \\(_)| || |___  ___ __ _ _ __    ");
  console.log("| | | | || || / __|/ __/ _` | '_ \\ ");
  console.log("| |_| | || || \\__ \\ (__|(_| | | | |");
  console.log("|____/|_||_||_|___/\\___\\__,_|_| |_|");
  console.log("Dillscan REST API (EIP-4844 blob explorer) - dillscan.dill.xyz");
  console.log("====================================================\n");

  restEnv.display();
  apiEnv.display();
}

run();
