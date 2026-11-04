# @blobscan/zod

## 0.2.0

### Minor Changes

- [#1066](https://github.com/Blobscan/blobscan/pull/1066) [`7db40c7`](https://github.com/Blobscan/blobscan/commit/7db40c7ae3ee33b0a0c14ad9283c5878c8b818a0) Thanks [@PJColombo](https://github.com/PJColombo)! - Add a granularity selector to the chart pages: hourly, daily, weekly, monthly and yearly. It is in the filter bar, next to the time frame selector, and it shows only the granularities that the time frame allows. When the new time frame does not allow the selected granularity, the chart uses the default granularity of the time frame.

  The timeseries stats endpoint has a new `granularity` parameter. It also reads the monthly and yearly metrics tables. A granularity that the time frame does not allow gives a `BAD_REQUEST` error. Without the parameter, the endpoint uses the default granularity (in bold).

  | Time frame      | Global                     | With `categories` or `rollups` |
  | --------------- | -------------------------- | ------------------------------ |
  | `1d`            | **hour**                   | **hour**                       |
  | `7d`            | **hour**, day              | hour, **day**                  |
  | `15d`           | hour, **day**              | **day**                        |
  | `30d`           | hour, **day**, week        | **day**, week                  |
  | `90d`           | **day**, week              | day, **week**                  |
  | `180d`          | **day**, week, month       | day, **week**, month           |
  | `365d`          | **day**, week, month       | **week**, month                |
  | `All` (default) | day, **week**, month, year | **week**, month, year          |

  This changes the default periods of three time frames. With `categories` or `rollups`, `7d` now gives daily periods, and `90d` gives weekly periods. Stacked bars with one segment for each rollup are easier to read with fewer periods. Without `categories` and `rollups`, `All` now gives weekly periods, because its number of daily periods increases each day.

  `@blobscan/zod` now exports the time frame and granularity schemas and their types: `timeFrameSchema`, `TimeFrame`, `metricsGranularitySchema` and `MetricsGranularity`. `@blobscan/api` and `@blobscan/web` import them from there. `@blobscan/api` no longer exports the `TimeFrame` type.

## 0.1.1

### Patch Changes

- [#1035](https://github.com/Blobscan/blobscan/pull/1035) [`1a3b53a`](https://github.com/Blobscan/blobscan/commit/1a3b53a63c9feaa66acc7799e7a2b2f3d435d0dc) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Resolve the remaining dependency advisories.

  - Upgrade Next.js, Zod, ECharts, Turborepo, T3 env, Prisma, and Prisma instrumentation
  - Align Prisma Client and `@prisma/instrumentation` on 6.19.3
  - Move Prisma CLI configuration to `prisma.config.ts` so Prisma 6 resolves the existing migrations directory
  - Override Prisma's `deepmerge-ts` dependency with the fixed `8.0.2` release
  - Handle Prisma 6 `Uint8Array` byte fields
  - Replace the unmaintained `zod-prisma` generator with `zod-prisma-types` for native Zod 4 support and update API imports to the generated `*Schema` names
  - Migrate chart typings, env defaults, and generated error snapshots
  - Add regression coverage for env validation in Vitest/CI runs

## 0.1.0

### Minor Changes

- [#359](https://github.com/Blobscan/blobscan/pull/359) [`b1141b1`](https://github.com/Blobscan/blobscan/commit/b1141b1ca369ee8c3d02c4cb3dd4e47ebca08120) Thanks [@PJColombo](https://github.com/PJColombo)! - Added blob storages schema

- [#388](https://github.com/Blobscan/blobscan/pull/388) [`514784a`](https://github.com/Blobscan/blobscan/commit/514784a743937dc2d1af1ed533e90fef3b3aa057) Thanks [@PabloCastellano](https://github.com/PabloCastellano)! - Added a schema for conditionally verifying the presence of a value based on another value matching a specific criterion.

## 0.0.4

### Patch Changes

- [#298](https://github.com/Blobscan/blobscan/pull/298) [`3c09b5b`](https://github.com/Blobscan/blobscan/commit/3c09b5bf8ea854f30a6675b022a87b1a04960bf6) Thanks [@0xGabi](https://github.com/0xGabi)! - Deprecated goerli network

## 0.0.3

### Patch Changes

- [#279](https://github.com/Blobscan/blobscan/pull/279) [`a39efaf`](https://github.com/Blobscan/blobscan/commit/a39efafec2732d0ceced9f97fc0d538cf7b0c922) Thanks [@PJColombo](https://github.com/PJColombo)! - Added network name enum schema

## 0.0.2

### Patch Changes

- [#247](https://github.com/Blobscan/blobscan/pull/247) [`2fb02b0`](https://github.com/Blobscan/blobscan/commit/2fb02b0268e1fcafc10abefb079d822845392d73) Thanks [@0xGabi](https://github.com/0xGabi)! - Set up changeset
