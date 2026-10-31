// Builds the minimal node_modules that the Prisma CLI needs to run `prisma migrate deploy` in the
// web and api images, which copy only part of the builder's node_modules.
//
// Usage: node prisma-cli-closure.mjs <builder node_modules> <workdir>
//
// <workdir> holds prisma.config.ts and prisma/schema. The script copies `prisma` and `@prisma`,
// runs the CLI against a database that does not exist, copies every module it reports missing
// (with that module's own dependencies, all at the top of a hoisted node_modules) and repeats
// until the CLI gets as far as connecting. Nothing to update when `prisma` changes.
import { spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

const [src, workdir] = process.argv.slice(2);
const dest = join(workdir, "node_modules");
const added = [];

function copyPackage(name) {
  const from = join(src, name);

  if (existsSync(join(dest, name)) || !existsSync(from)) {
    return;
  }

  mkdirSync(dirname(join(dest, name)), { recursive: true });
  cpSync(from, join(dest, name), { recursive: true, dereference: true });
  added.push(name);

  const { dependencies = {} } = JSON.parse(
    readFileSync(join(from, "package.json"), "utf8")
  );

  Object.keys(dependencies).forEach(copyPackage);
}

mkdirSync(dest, { recursive: true });
cpSync(join(src, "prisma"), join(dest, "prisma"), {
  recursive: true,
  dereference: true,
});
cpSync(join(src, "@prisma"), join(dest, "@prisma"), {
  recursive: true,
  dereference: true,
});

for (let attempt = 0; attempt < 100; attempt++) {
  const { stdout, stderr } = spawnSync(
    "node",
    [join(dest, "prisma", "build", "index.js"), "migrate", "deploy"],
    {
      cwd: workdir,
      encoding: "utf8",
      timeout: 120_000,
      // Nothing listens on port 1: a healthy CLI fails only on the connection.
      env: {
        ...process.env,
        DIRECT_URL: "postgresql://nobody:nobody@127.0.0.1:1/blobscan",
      },
    }
  );
  const output = `${stdout}${stderr}`;
  const missing = /Cannot find (?:module|package) '([^']+)'/.exec(output)?.[1];

  if (missing) {
    const name = missing.startsWith("@")
      ? missing.split("/").slice(0, 2).join("/")
      : missing.split("/")[0];

    if (missing.startsWith(".") || missing.startsWith("/") || !existsSync(join(src, name))) {
      console.error(output);
      throw new Error(`The Prisma CLI needs "${missing}", which is not in ${src}`);
    }

    if (existsSync(join(dest, name))) {
      console.error(output);
      throw new Error(`The Prisma CLI cannot load "${name}" although it is copied`);
    }

    copyPackage(name);
    continue;
  }

  if (!output.includes("Can't reach database server")) {
    console.error(output);
    throw new Error("The Prisma CLI did not get as far as connecting to the database");
  }

  console.log(`Prisma CLI runs with ${added.length} extra modules: ${added.join(" ")}`);
  process.exit(0);
}

throw new Error("Gave up after 100 missing modules");
