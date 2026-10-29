import { $, path, glob } from "zx";

async function main() {
  const prismaFiles = await glob(path.join("dist", "client", "*"));

  await $`mv ${prismaFiles} dist`;

  console.log("postbuild: Prisma client files moved to `dist` directory");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
