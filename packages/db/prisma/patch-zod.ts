import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * zod-prisma generates schemas using zod v3 type aliases. Keep the generated
 * output compatible with zod v4 until the generator supports it natively.
 */
const zodDir = join(dirname(fileURLToPath(import.meta.url)), "zod");

const replacements: Array<[string, string]> = [
  ["z.ZodSchema<", "z.ZodType<"],
  ["z.record(jsonSchema)", "z.record(z.string(), jsonSchema)"],
];

async function main() {
  const entries = await readdir(zodDir, { withFileTypes: true });
  let patchedFiles = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".ts")) {
      continue;
    }

    const filePath = join(zodDir, entry.name);
    const original = await readFile(filePath, "utf8");
    const patched = replacements.reduce(
      (content, [from, to]) => content.replaceAll(from, to),
      original
    );

    if (patched !== original) {
      await writeFile(filePath, patched);
      patchedFiles++;
    }
  }

  console.log(`Patched ${patchedFiles} generated zod file(s) for zod v4`);
}

void main();
