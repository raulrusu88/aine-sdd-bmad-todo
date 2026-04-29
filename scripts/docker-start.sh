#!/bin/sh

set -eu

if [ "$#" -eq 0 ]; then
  echo "No startup command was provided." >&2
  exit 1
fi

if [ "${RUN_DB_MIGRATIONS:-true}" = "true" ]; then
  echo "Running database migrations..."
  npm run db:migrate
else
  echo "Skipping database migrations."
fi

exec "$@"
