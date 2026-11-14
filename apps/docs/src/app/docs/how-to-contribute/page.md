---
title: How to contribute
nextjs:
  metadata:
    title: How to contribute
    description: How to contribute to Blobscan.
---

Thank you for your interest in contributing to Blobscan! We welcome contributions from everyone, and this document provides some guidelines to make the contribution process smoother.

## Code of Conduct

All contributors are expected to follow our [Code of Conduct](/docs/code-of-conduct). Please make sure you are welcoming and friendly in all our spaces.

## Getting Started

- Ensure you have a [GitHub account](https://github.com/).
- Look for an issue to tackle in our [issue tracker on GitHub](https://github.com/Blobscan/blobscan/issues).
- Once you've chosen an issue, comment on it to let others know you're working on it.

## Making Changes

- Begin by [setting up Blobscan locally](/docs/running-blobscan-locally).
- Proceed to make your changes.
- Ensure you've tested your changes comprehensively. Refer to our [Testing Guide](/docs/testing) for details on our testing setup.
- Once done, push your changes to your GitHub fork.
- Create a pull request against our main repository.

## Contact

If you have questions or need help with your contribution, join our [Discord](https://discordapp.com/invite/fmqrqhkjHY/) server and ask in the `#🔎-blobscan` channel.

# Examples

## Add support for a new network

Steps:

1. Add a new chain file under `packages/chains/src/chains/` (see existing chains for reference) and export it from `packages/chains/src/chains/index.ts`
2. Add the new network name to the `networkSchema` enum in `packages/env/index.ts`
3. Update environment documentation in `apps/docs/src/app/docs/environment/page.md`

Check out the following PRs:

* https://github.com/Blobscan/blobscan/pull/823
* https://github.com/Blobscan/blobscan/commit/0a2a94c587e9b93f6b36ad15fd55065e824b5049
* https://github.com/Blobscan/blobscan/pull/826

## Add a new storage provider

Steps:

1. Add the new storage value to the `BlobStorage` enum in `packages/db/prisma/schema.prisma` and create a Prisma migration
2. Implement the storage class in `packages/blob-storage-manager/src/storages/` extending `BlobStorage` and export it from its `index.ts`
3. Add any new environment variables to `packages/env/index.ts` and document them in `apps/docs/src/app/docs/environment/page.md`
4. Wire up the new storage in `packages/blob-storage-manager/src/utils/storage.ts` (`createStorageFromEnv`)
5. Add a worker processor file in `packages/blob-propagator/src/worker-processors/` and register it in `packages/blob-propagator/src/BlobPropagator.ts`
6. Add an SVG icon to `apps/web/src/icons/blob-storages/`, register it in `apps/web/src/icons/blob-storages/index.ts`, and add the badge entry in `apps/web/src/components/Badges/StorageBadge.tsx`
7. Add tests for the new storage class and worker processor

Check out the following PRs:

* https://github.com/Blobscan/blobscan/pull/820

## Label a new rollup

Steps:

1. Add a directory in `packages/rollups/src/rollups/` with the rollup ID as its name.
2. Add `definition.ts` with the display name, theme colors, icon filename, and poster addresses for each chain. The folder name supplies the ID; do not add an `id` field. Use an existing definition as a template.
3. Add `icon.svg`, `icon.png`, `icon.jpg`, or `icon.jpeg` in the same directory. SVG icons can use `currentColor` for theme colors.
4. Run `pnpm rollups:sync` from the repository root. This generates the registry, icon map, and Prisma enum entries.
5. If the enum changed, run `pnpm --filter @blobscan/db db:migrate --create-only --name add_example_rollup`. Review the migration, apply it to the development database, and run `pnpm db:generate`.
6. Commit the definition, icon, generated files, and migration together. Apply the migration before the updated application writes the new rollup ID.
7. Run a separate backfill if existing address records or metrics need updates.

Run `pnpm rollups:sync --check` to check generated files without writing them.
The sync command does not connect to the database or change migration files.

Check out the following PRs:

* https://github.com/Blobscan/blobscan/pull/923

