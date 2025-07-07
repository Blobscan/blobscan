// esbuild.config.js
import * as esbuild from "esbuild";
import fs from "fs";

const result = await esbuild.build({
  entryPoints: ["src/index.ts"],
  outdir: "dist",
  outbase: "src",
  platform: "node",
  target: "node20",
  format: "cjs",
  metafile: !!process.env.BUILD_METADATA_ENABLED,
  bundle: true,
  external: [".prisma", "prisma", "@prisma/client"],
});

if (process.env.BUILD_METADATA_ENABLED) {
  fs.writeFileSync("dist/meta.json", JSON.stringify(result.metafile));
}
