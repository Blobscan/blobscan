#!/bin/bash
environment="production"
variables="CHAIN_ID PUBLIC_EXPLORER_BASE_URL PUBLIC_NETWORK_NAME PUBLIC_SUPPORTED_NETWORKS POSTGRES_STORAGE_ENABLED SWARM_STORAGE_ENABLED GOOGLE_STORAGE_ENABLED DATABASE_URL DIRECT_URL SECRET_KEY"

# other not so recently updated variables
# o_vars="METRICS_ENABLED BEE_ENDPOINT GOOGLE_SERVICE_KEY GOOGLE_STORAGE_BUCKET_NAME GOOGLE_STORAGE_PROJECT_ID"

add_variable() {
	vercel env add $1 $environment
}

for var_name in $variables; do
	vercel env rm $var_name $environment -y
  add_variable $var_name
done
