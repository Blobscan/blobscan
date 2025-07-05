// esbuild.config.js
import * as esbuild from "esbuild";
import glob from "fast-glob";
import fs from "fs";

const entryPoints = await glob("src/**/worker.ts");

const result = await esbuild.build({
  entryPoints,
  outdir: "dist",
  outbase: "src",
  platform: "node",
  target: "node20",
  format: "cjs",
  metafile: !!process.env.BUILD_METADATA_ENABLED,
  bundle: true,
  sourcemap: true,
  treeShaking: true,
  external: ["ioredis", "prisma", "@prisma/client"],
});

if (process.env.BUILD_METADATA_ENABLED) {
  fs.writeFileSync("dist/meta.json", JSON.stringify(result.metafile));
}
