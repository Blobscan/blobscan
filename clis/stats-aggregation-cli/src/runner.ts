import { gracefulShutdown } from "./graceful-shutdown";
import { main } from "./main";

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(`Failed to run stats aggregator: ${err}`);
    return process.exit(1);
  })
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  .finally(gracefulShutdown);
