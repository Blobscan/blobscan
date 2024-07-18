#! /bin/bash

cd "$(dirname "$0")"
ROOT="$(pwd)"
PJROOT="$ROOT"

logs_dir=$PJROOT/logs
if [ ! -d "$logs_dir" ]; then
    mkdir -p "$logs_dir"
fi

export export NODE_ENV="development"
nohup pnpm dev &>> $logs_dir/blobscan.log &
