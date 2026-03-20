#!/bin/sh

echo "Waiting for database..."
sleep 25

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application..."
exec "$@"