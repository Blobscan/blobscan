import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";

import {
  syncRollups,
  updatePrismaEnum,
  validateDefinitions,
} from "../scripts/sync";
import type { RollupDefinition } from "../src/types";

const definition: RollupDefinition & { id: string } = {
  id: "example",
  name: "Example",
  color: { light: "#123456", dark: "#abcdef" },
  icon: "icon.svg",
  blobPosters: { 1: ["0x1234567890123456789012345678901234567890"] },
};

const schema = `enum Rollup {
  BASE @map("base")

  @@map("rollup")
}
`;

describe("rollup sync", () => {
  it("rejects duplicate IDs and poster assignments on the same chain", () => {
    expect(() => validateDefinitions([definition, definition])).toThrow(
      "Duplicate rollup ID"
    );
    expect(() =>
      validateDefinitions([definition, { ...definition, id: "second" }])
    ).toThrow("duplicate poster");
    expect(() =>
      validateDefinitions([
        definition,
        {
          ...definition,
          id: "second",
          blobPosters: { 100: definition.blobPosters[1]! },
        },
      ])
    ).not.toThrow();
  });

  it.each([
    { id: "../example" },
    { name: "" },
    { color: { light: "bad", dark: "#abcdef" } },
    { icon: "../icon.svg" },
    { blobPosters: { 1: ["0x123"] } },
    { blobPosters: { 1: [] } },
    { blobPosters: { 0: definition.blobPosters[1] } },
  ])("rejects invalid definitions: %j", (change) => {
    expect(() =>
      validateDefinitions([
        { ...definition, ...change } as RollupDefinition & { id: string },
      ])
    ).toThrow();
  });

  it("preserves stored IDs and adds new enum entries", () => {
    const updated = updatePrismaEnum(schema, ["example", "base"]);
    expect(updated).toContain('EXAMPLE @map("example")');
    expect(updated.indexOf("BASE")).toBeLessThan(updated.indexOf("EXAMPLE"));
    expect(() => updatePrismaEnum(schema, ["example"])).toThrow(
      "Cannot remove or rename"
    );
    expect(updatePrismaEnum(updated, ["base", "example"])).toBe(updated);
  });

  it("generates stable files and checks them without writing", async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), "rollup-sync-"));
    try {
      const folder = path.join(root, "packages/rollups/src/rollups/example");
      const schemaPath = path.join(
        root,
        "packages/db/prisma/schema/enums.prisma"
      );
      await mkdir(folder, { recursive: true });
      await mkdir(path.dirname(schemaPath), { recursive: true });
      await writeFile(
        path.join(folder, "definition.ts"),
        `export default ${JSON.stringify({ ...definition, id: undefined })};`
      );
      await writeFile(schemaPath, 'enum Rollup {\n\n  @@map("rollup")\n}\n');
      await expect(syncRollups(root)).rejects.toThrow("ENOENT");
      await writeFile(
        path.join(folder, "icon.svg"),
        '<svg xmlns="http://www.w3.org/2000/svg"/>'
      );
      await expect(syncRollups(root, true)).rejects.toThrow(
        "Run pnpm rollups:sync"
      );
      const generated = path.join(
        root,
        "packages/rollups/src/generated/registry.ts"
      );
      await expect(readFile(generated)).rejects.toThrow("ENOENT");
      expect((await syncRollups(root)).migrationRequired).toBe(true);
      expect((await syncRollups(root)).changed).toEqual([]);
      await expect(syncRollups(root, true)).resolves.toMatchObject({
        changed: [],
      });
      const secondFolder = path.join(
        root,
        "packages/rollups/src/rollups/default"
      );
      await mkdir(secondFolder);
      await writeFile(
        path.join(secondFolder, "definition.ts"),
        `export default ${JSON.stringify({
          ...definition,
          id: undefined,
          icon: "icon.png",
          blobPosters: {},
        })};`
      );
      await writeFile(path.join(secondFolder, "icon.png"), "image fixture");
      expect((await syncRollups(root)).migrationRequired).toBe(true);
      const icons = await readFile(
        path.join(root, "packages/rollups/src/generated/icons.ts"),
        "utf8"
      );
      expect(icons).toContain(
        'import icon_default from "../rollups/default/icon.png"'
      );
      expect(icons).toContain("default: icon_default.src");
      expect(icons).toContain("example: icon_example");
      await writeFile(generated, "stale");
      await expect(syncRollups(root, true)).rejects.toThrow(
        "Run pnpm rollups:sync"
      );
      expect(await readFile(generated, "utf8")).toBe("stale");
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});
