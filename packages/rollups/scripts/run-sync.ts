import path from "node:path";

import { syncRollups } from "./sync";

const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--check")) {
  throw new Error("Usage: pnpm rollups:sync [--check]");
}
syncRollups(path.resolve(__dirname, "../../.."), args.includes("--check"))
  .then(({ changed, migrationRequired }) => {
    console.log(
      changed.length
        ? `Updated:\n${changed.join("\n")}`
        : "Rollup files are up to date."
    );
    if (migrationRequired)
      console.log(
        "The Prisma enum changed. Create and review a Prisma migration."
      );
  })
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
