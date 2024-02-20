#!/usr/bin/env bash

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh
docker-compose -f $DIR/../docker-compose.local.yml up -d postgres storage redis
echo '🟡 - Waiting for database to be ready...'
$DIR/wait-for-it.sh -t 1 "${DATABASE_URL}" -- echo '🟢 - Database is ready!'
echo '🟡 - Waiting for storage to be ready...'
$DIR/wait-for-it.sh -t 1 "${GOOGLE_STORAGE_API_ENDPOINT}" -- echo '🟢 - Storage is ready!'
echo '🟡 - Waiting for redis to be ready...'
$DIR/wait-for-it.sh -t 1 "${REDIS_URI}" -- echo '🟢 - Redis is ready!'
npx prisma migrate reset --force
npx prisma migrate dev --skip-seed --name init --schema $DIR/../packages/db/prisma/schema.prisma
