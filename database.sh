#! /bin/bash
pnpm prisma migrate $1 --schema packages/db/prisma/schema.prisma

