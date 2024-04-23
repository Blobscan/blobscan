---
title: Background jobs
nextjs:
  metadata:
    title: Background jobs
    description: Blobscan background jobs
---

Blobscan uses [BullMQ](https://bullmq.io/) to run two tasks in the background in order to recalculate the metrics and statistics.

In case you want to disable the background tasks and run them as cronjob, you can do it by setting the following variables:

```shell
BLOB_PROPAGATOR_ENABLED=false
```

Note that charts won't be updated and blob uploads to storages will take longer as you are disabling parallel uploads, specially if you are syncing several days.

You can run these tasks There are multiple ways out there to run periodic jobs. You can simply use [crontab](https://linux.die.net/man/5/crontab) for that:

```shell
crontab -e
```

Then add the following lines (adjust them to your case):

```shell
5	    0	*	*	*	cd $HOME/blobscan && pnpm job:daily >> $HOME/cron.log
*/15 	* 	* 	* 	*	cd $HOME/blobscan && pnpm job:overall >> $HOME/cron.log
```

## Docker

When using docker, simply prefix pnpm with `docker compose exec api`:

```shell
5	    0	*	*	*	cd $HOME/blobscan && docker compose exec api pnpm job:daily >> $HOME/cron.log
*/15 	* 	* 	* 	*	cd $HOME/blobscan && docker compose exec api pnpm job:overall >> $HOME/cron.log
```
