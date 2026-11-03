---
"@blobscan/api": minor
"@blobscan/web": minor
---

Add a time frame selector to the chart pages: 24H, 7D, 1M, 3M, 1Y and All. It is in the filter bar, and the pages with only global values now show the filter bar too. The chart dates show in UTC, because the periods start at UTC boundaries.

The timeseries stats endpoint reads the hourly, daily or weekly metrics table for the time frame. The response gives the length of the periods in `granularity`. It does not sample the daily metrics any more. A sampled timeseries showed only one day out of every 3, 4 or 7 days.

| Time frame | Global | With `categories` or `rollups` |
| --- | --- | --- |
| `1d`, `7d` | hour | hour |
| `15d`, `30d`, `90d` | day | day |
| `180d`, `365d`, `All` (default) | day | week |

This changes the periods of the existing time frames: `1d` and `7d` now give hourly periods, and `180d`, `365d` and `All` give weekly periods when the request has `categories` or `rollups`.

A gap in a series now keeps a `null` value for a metric that the series does not have (for example, a global-only metric in a rollup series). Before, the gap got a zero, and the response failed the output validation.
