import { env as apiEnv } from "@blobscan/api";

//TODO: Find a way to run this script and use the web envs from `env.mjs`. Right now, it fails with a ERR_REQUIRE_ESM error

export function run() {
  console.log(" ____  _       _");
  console.log("| __ )| | ___ | |__  ___  ___ __ _ _ __");
  console.log("|  _ \\| |/ _ \\| '_ \\/ __|/ __/ _` | '_ \\");
  console.log("| |_) | | (_) | |_) \\__ \\ (_| (_| | | | |");
  console.log("|____/|_|\\___/|_.__/|___/\\___\\__,_|_| |_|");
  console.log("Blobscan Web App (EIP-4844 blob explorer) - blobscan.com");
  console.log("=======================================================\n");
  console.log(
    `Configuration: network=${process.env.NEXT_PUBLIC_NETWORK_NAME}, explorer=${
      process.env.NEXT_PUBLIC_EXPLORER_BASE_URL
    }, beaconExplorer=${
      process.env.NEXT_PUBLIC_BEACON_BASE_URL
    }, feedbackEnabled=${!!process.env
      .FEEDBACK_WEBHOOK_URL}, tracesEnabled=${!!process.env.TRACES_ENABLED}`
  );
  apiEnv.display();
}

run();
