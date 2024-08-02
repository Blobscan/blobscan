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

apply_prisma_migrations() {
	./node_modules/prisma/build/index.js migrate deploy $@
}

# check to see if this file is being run or sourced from another script
_is_sourced() {
	# https://unix.stackexchange.com/a/215279
	[ "${#FUNCNAME[@]}" -ge 2 ] \
		&& [ "${FUNCNAME[0]}" = '_is_sourced' ] \
		&& [ "${FUNCNAME[1]}" = 'source' ]
}

_main() {
	if [ "$1" = 'web' ]; then
		apply_prisma_migrations --schema node_modules/.prisma/client/schema.prisma
		node /app/apps/web/server.js
	elif [ "$1" = 'api' ]; then
		apply_prisma_migrations --schema schema.prisma
		node /app/index.js
	elif [ "$1" = '--help' ]; then
		echo "## Blobscan ##"
		echo ""
		echo "Usage:"
		echo "$0 [web|api]"
	else
		blobscan_error "Invalid command: $1"
	fi
}

# If we are sourced from elsewhere, don't perform any further actions
if ! _is_sourced; then
	_main "$@"
fi
