import { $, path, glob } from "zx";

async function main() {
  const prismaFiles = await glob(path.join("dist", "client", "*"));

  await $`mv ${prismaFiles} dist`;

  console.log("postbuild: Prisma client files moved to `dist` directory");

  const swaggerUiDist = path.join(
    __dirname,
    "..",
    "..",
    "..",
    "node_modules",
    "swagger-ui-dist"
  );

  const files = [
    "swagger-ui.css",
    "swagger-ui-bundle.js",
    "swagger-ui-standalone-preset.js",
    "favicon-16x16.png",
    "favicon-32x32.png"
  ];

  for (const file of files) {
    await $`cp ${path.join(swaggerUiDist, file)} dist`;
  }

  console.log("postbuild: Swagger UI assets copied to `dist` directory");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
