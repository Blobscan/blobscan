---
"@blobscan/api": minor
"@blobscan/web": minor
---

Add a granularity selector to the chart pages: hourly, daily, weekly, monthly and yearly. It is in the filter bar, next to the time frame selector, and it shows only the granularities that the time frame allows. When the new time frame does not allow the selected granularity, the chart uses the default granularity of the time frame.

The timeseries stats endpoint has a new `granularity` parameter. It also reads the monthly and yearly metrics tables. A granularity that the time frame does not allow gives a `BAD_REQUEST` error. Without the parameter, the endpoint uses the default granularity (in bold).

| Time frame | Global | With `categories` or `rollups` |
| --- | --- | --- |
| `1d` | **hour** | **hour** |
| `7d` | **hour**, day | hour, **day** |
| `15d` | hour, **day** | **day** |
| `30d` | hour, **day**, week | **day**, week |
| `90d` | **day**, week | day, **week** |
| `180d` | **day**, week, month | day, **week**, month |
| `365d` | **day**, week, month | **week**, month |
| `All` (default) | day, **week**, month, year | **week**, month, year |

This changes the default periods of three time frames. With `categories` or `rollups`, `7d` now gives daily periods, and `90d` gives weekly periods. Stacked bars with one segment for each rollup are easier to read with fewer periods. Without `categories` and `rollups`, `All` now gives weekly periods, because its number of daily periods increases each day.
