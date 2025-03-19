#! /bin/bash

pnpm fetch -r
pnpm install -r

export NODE_ENV=production && SKIP_ENV_VALIDATION=true npm run build
