---
title: FAQ / Troubleshooting
nextjs:
  metadata:
    title: FAQ / Troubleshooting
    description: Blobscan troubleshooting
---

Here is a collection of common issue and questions.

---

## Database

### How can I force apply pending migrations?

The first time you run the docker container, it will automatically apply any pending migration.
You can do it manually too:

```shell
pnpm prisma migrate deploy --schema packages/db/prisma/schema.prisma
```

### How can I reset the database and wipe all the data?

```shell
pnpm prisma migrate reset --schema packages/db/prisma/schema.prisma
```

## Docker

### Something is failing and my container is rebooting all the time so I can't debug it

You can still get a shell on the container like:

```shell
docker compose run --entrypoint bash api
```
