#!/bin/sh
set -e

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  attempt=1
  max_attempts="${MIGRATION_MAX_ATTEMPTS:-10}"

  until ./node_modules/.bin/prisma migrate deploy; do
    if [ "$attempt" -ge "$max_attempts" ]; then
      echo "Falha ao aplicar migrações após ${max_attempts} tentativas." >&2
      exit 1
    fi

    echo "Migração falhou (tentativa ${attempt}). Tentando novamente em 3s..." >&2
    attempt=$((attempt + 1))
    sleep 3
  done
fi

exec node build/server.js
