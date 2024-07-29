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

  await $`cp ${path.join(swaggerUiDist, "swagger-ui.css")} dist`;
  await $`cp ${path.join(swaggerUiDist, "swagger-ui-bundle.js")} dist`;
  await $`cp ${path.join(
    swaggerUiDist,
    "swagger-ui-standalone-preset.js"
  )} dist`;
  await $`cp ${path.join(swaggerUiDist, "favicon-16x16.png")} dist`;
  await $`cp ${path.join(swaggerUiDist, "favicon-32x32.png")} dist`;

  console.log("postbuild: Swagger UI assets copied to `dist` directory");
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
