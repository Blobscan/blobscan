import { apiEnv, blobStorageManagerEnv } from "@blobscan/api";
import { env as otelEnv } from "@blobscan/open-telemetry";

import { env } from "../env";

function run() {
  console.log(" ____  _       _");
  console.log("| __ )| | ___ | |__  ___  ___ __ _ _ __");
  console.log("|  _ \\| |/ _ \\| '_ \\/ __|/ __/ _` | '_ \\");
  console.log("| |_) | | (_) | |_) \\__ \\ (_| (_| | | | |");
  console.log("|____/|_|\\___/|_.__/|___/\\___\\__,_|_| |_|");
  console.log("Blobscan REST API (EIP-4844 blob explorer) - blobscan.com");
  console.log("====================================================\n");
  console.log(
    `Configuration: metrics=${env.METRICS_ENABLED}, traces=${env.TRACES_ENABLED}, port=${env.BLOBSCAN_API_PORT}`
  );

  apiEnv.display();
  blobStorageManagerEnv.display();
  otelEnv.display();
}

run();
