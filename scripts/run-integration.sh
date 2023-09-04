#!/usr/bin/env bash

DIR="$(cd "$(dirname "$0")" && pwd)"
source $DIR/setenv.sh
docker-compose -f $DIR/../docker-compose.yml up -d postgres storage
echo '🟡 - Waiting for database to be ready...'
$DIR/wait-for-it.sh -t 5 "${DATABASE_URL}" -- echo '🟢 - Database is ready!'
echo '🟡 - Waiting for storage to be ready...'
$DIR/wait-for-it.sh -t 5 "${GOOGLE_STORAGE_API_ENDPOINT}" -- echo '🟢 - Storage is ready!'
npx prisma migrate dev --skip-seed --name init --schema $DIR/../packages/db/prisma/schema.prisma