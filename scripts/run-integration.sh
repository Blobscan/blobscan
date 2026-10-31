#!/usr/bin/env bash

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh
docker-compose -f $DIR/../docker-compose.local.yml up -d postgres storage redis s3mock
echo '🟡 - Waiting for database to be ready...'
$DIR/wait-for-it.sh -t 1 "${DATABASE_URL}" -- echo '🟢 - Database is ready!'
echo '🟡 - Waiting for storage to be ready...'
$DIR/wait-for-it.sh -t 1 "${GOOGLE_STORAGE_API_ENDPOINT}" -- echo '🟢 - Storage is ready!'
echo '🟡 - Waiting for redis to be ready...'
$DIR/wait-for-it.sh -t 1 "${REDIS_URI}" -- echo '🟢 - Redis is ready!'
# Drops the database and applies all existing migrations (never creates new ones).
# Prisma 7 discovers the datasource and schema through prisma.config.ts, so run
# the CLI from the db package.
(cd "$DIR/../packages/db" && pnpm exec prisma migrate reset --force)
