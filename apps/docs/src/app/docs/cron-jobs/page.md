---
title: Cron jobs
nextjs:
  metadata:
    title: Cron jobs
    description: Quidem magni aut exercitationem maxime rerum eos.
---

Blobscan requires two periodic tasks in order to recalculate the metrics and block statistics.

There are multiple ways out there to run periodic jobs. You can simply use `crontab` for that:

```shell
crontab -e
```

Then add the following lines (adjust them to your case):

```shell
5	    0	*	*	*	cd /opt/blobscan && pnpm update:daily >> cron.log
*/15 	* 	* 	* 	*	cd /opt/blobscan && pnpm update:overall >> cron.log
```

## Docker

When using docker, simply prefix pnpm with `docker compose exec api`:

```shell
5	    0	*	*	*	cd /opt/blobscan && docker compose exec api pnpm update:daily >> cron.log
*/15 	* 	* 	* 	*	cd /opt/blobscan && docker compose exec api pnpm update:overall >> cron.log
```
