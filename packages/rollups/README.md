# Rollups

Each directory in `src/rollups` contains one rollup definition and its icon.
The directory name supplies the ID. The definition supplies the display name, theme colors, icon classes, and poster
addresses for each chain. Chain IDs refer to the chains where blobs are posted.

## Add a rollup

1. Copy an existing rollup directory, such as `src/rollups/base`.
2. Set the directory name to the lowercase ID. Use letters and digits, with a
   letter first. The sync command derives the ID from this name. Do not add an
   `id` field to the definition. Keep the directory name stable after the ID is
   stored in the database.
3. Set the name, colors, and poster addresses in `definition.ts`. Use an empty
   `blobPosters` object if there are no known posters. Omit chains with no posters.
4. Add `icon.svg`, `icon.png`, `icon.jpg`, or `icon.jpeg`. Set `icon` to that filename.
   SVG icons can use `currentColor` to use the theme color. Pegglecoin currently
   uses a placeholder icon.
5. Run `pnpm rollups:sync` from the repository root.
6. If the Prisma enum changed, create and review a migration:

   ```sh
   pnpm --filter @blobscan/db db:migrate --create-only --name add_example_rollup
   ```

7. Apply the migration to the development database and run `pnpm db:generate`.
8. Commit the definition, icon, generated files, and migration together.

Apply migrations before the updated application writes new rollup IDs.
Address changes can require a separate backfill of existing records and metrics.
The sync command does not connect to a database or run a backfill.

## Generated files

`pnpm rollups:sync` validates the definitions and writes:

- `src/generated/registry.ts`: explicit imports of all definitions.
- `src/generated/icons.ts`: explicit imports of all icons.
- The `Rollup` enum in `packages/db/prisma/schema/enums.prisma`.

The command rejects duplicate IDs, invalid addresses, missing icons, duplicate
poster assignments on the same chain, and removal or renaming of existing enum
IDs. Existing enum order is preserved. Applied migrations are never changed.

Run `pnpm rollups:sync --check` to check the generated files without writing them.
CI runs this check. New definitions require a sync before starting or rebuilding
the application. Changes to existing definitions are read through the registry
imports; address or color changes do not require an enum migration.

## Imports

Server code imports the data and registry without loading image files:

```ts
import { ROLLUP_DEFINITIONS, RollupRegistry } from "@blobscan/rollups";
```

The web app imports icons through a separate entry point:

```ts
import { rollupIcons } from "@blobscan/rollups/icons";
```

The icon entry point requires the web app's SVG and static image loaders.
SVG entries are React components. PNG and JPEG entries are URLs from static
image imports. The package root does not export this module.

Run package tests with `pnpm exec vitest run --project rollups` from the root.

Development seed data uses the same registry for its configured chain. A new
rollup with posters on that chain is included without a separate seed entry.
