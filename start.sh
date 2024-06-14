#! /bin/bash
export export NODE_ENV="development" && pnpm dev > ../logs/blobscan_$(date +%Y%m%d%H%M%S).log
