#!/usr/bin/env bash

DIR="$(cd "$(dirname "$0")" && pwd)"

# Export env vars
export $(grep -v '^#' $DIR/../.env | xargs)