---
title: Cron jobs
nextjs:
  metadata:
    title: Cron jobs
    description: Blobscan cron jobs
---

Blobscan requires two periodic tasks in order to recalculate the metrics and block statistics.

There are multiple ways out there to run periodic jobs. You can simply use [crontab](https://linux.die.net/man/5/crontab) for that:

```shell
crontab -e
```

Then add the following lines (adjust them to your case):

```shell
5	    0	*	*	*	cd $HOME/blobscan && pnpm stats daily >> $HOME/cron.log
*/15 	* 	* 	* 	*	cd $HOME/blobscan && pnpm stats overall >> $HOME/cron.log
```

## Docker

When using docker, simply prefix pnpm with `docker compose exec api`:

```shell
5	    0	*	*	*	cd $HOME/blobscan && docker compose exec api pnpm stats daily >> $HOME/cron.log
*/15 	* 	* 	* 	*	cd $HOME/blobscan && docker compose exec api pnpm stats overall >> $HOME/cron.log
```
