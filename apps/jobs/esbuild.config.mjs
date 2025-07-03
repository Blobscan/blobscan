// esbuild.config.js
import * as esbuild from "esbuild";
import glob from "fast-glob";

const entryPoints = await glob("src/**/worker.ts");

await esbuild.build({
  entryPoints,
  outdir: "dist",
  outbase: "src",
  platform: "node",
  target: "node20",
  format: "cjs",
  bundle: true,
  sourcemap: true,
  external: ["ioredis", "prisma"],
});
