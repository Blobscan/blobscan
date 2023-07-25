#!/bin/bash
set -eo pipefail
shopt -s nullglob

# logging functions
blobscan_log() {
	local type="$1"; shift
	printf '%s [%s] [Entrypoint]: %s\n' "$(date --rfc-3339=seconds)" "$type" "$*"
}
blobscan_note() {
	blobscan_log Note "$@"
}
blobscan_warn() {
	blobscan_log Warn "$@" >&2
}
blobscan_error() {
	blobscan_log ERROR "$@" >&2
	exit 1
}

# check to see if this file is being run or sourced from another script
_is_sourced() {
	# https://unix.stackexchange.com/a/215279
	[ "${#FUNCNAME[@]}" -ge 2 ] \
		&& [ "${FUNCNAME[0]}" = '_is_sourced' ] \
		&& [ "${FUNCNAME[1]}" = 'source' ]
}

_main() {
	if [ "$BLOBSCAN_PROC" = 'web' ]; then
		cd /app
		npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
		cd /app/apps/web
		pnpm start
	elif [ "$BLOBSCAN_PROC" = 'api' ]; then
		cd /app
		npx prisma migrate deploy --schema packages/db/prisma/schema.prisma
		cd /app/apps/rest-api-server
		pnpm start
	else
		echo "## Blobscan ##"
		echo ""
		echo "You have not defined BLOBSCAN_PROC ('web' or 'api'):"
		bash
	fi
}

# If we are sourced from elsewhere, don't perform any further actions
if ! _is_sourced; then
	_main "$@"
fi
