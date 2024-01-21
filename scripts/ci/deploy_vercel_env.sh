#!/bin/bash
environment="production"
variables="CHAIN_ID NEXT_PUBLIC_EXPLORER_BASE_URL NEXT_PUBLIC_NETWORK_NAME POSTGRES_STORAGE_ENABLED SWARM_STORAGE_ENABLED GOOGLE_STORAGE_ENABLED DATABASE_URL SECRET_KEY"

# other not so recently updated variables
# o_vars="METRICS_ENABLED BEE_ENDPOINT BEE_DEBUG_ENDPOINT GOOGLE_SERVICE_KEY GOOGLE_STORAGE_BUCKET_NAME GOOGLE_STORAGE_PROJECT_ID"

add_variable() {
	vercel env add $1 $environment
}

for var_name in $variables; do
	vercel env rm $var_name $environment -y
  add_variable $var_name
done
